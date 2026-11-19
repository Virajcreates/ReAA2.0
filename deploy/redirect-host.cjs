// Loaded before Next.js starts (NODE_OPTIONS=--require, see deploy/Dockerfile).
//
// Why: when Next.js 14 runs outside Vercel ("next start"), request.url in route
// handlers is built from the address the server listens on, e.g.
// https://0.0.0.0:8080/... or https://localhost:8080/..., not from the address
// the visitor used. app/auth/callback/route.ts redirects with
// new URL(target, request.url) and `${origin}/login`, so after Google sign-in
// visitors would be sent to https://0.0.0.0:8080/ and the sign-in looks broken.
//
// What: in a redirect's Location header ONLY, an origin that is this server's
// own internal address (0.0.0.0 / localhost / 127.0.0.1 / [::] on $PORT) is
// replaced with the public one the request came in on (X-Forwarded-Host or
// Host, X-Forwarded-Proto). Nothing else is touched.
//
// The proper fix belongs in app/auth/callback/route.ts (use the
// x-forwarded-host header, as Supabase's Next.js example does). Once the code
// does that, this file does nothing and can be removed.
'use strict';

const http = require('http');

const PORT = String(process.env.PORT || '8080');
const INTERNAL = new RegExp(
  '^https?://(?:0\\.0\\.0\\.0|localhost|127\\.0\\.0\\.1|\\[::\\]|\\[::1\\]):' + PORT + '(?=[/?#]|$)',
  'i'
);

function first(v) {
  return String(Array.isArray(v) ? v[0] : v || '').split(',')[0].trim();
}

function publicOrigin(req) {
  const h = (req && req.headers) || {};
  const host = first(h['x-forwarded-host']) || first(h.host);
  if (!/^[A-Za-z0-9.-]+(:[0-9]{1,5})?$/.test(host)) return null;
  const proto = first(h['x-forwarded-proto']).toLowerCase();
  return (proto === 'https' || proto === 'http' ? proto : 'http') + '://' + host;
}

function fix(res, value) {
  if (Array.isArray(value)) return value.map((v) => fix(res, v));
  if (typeof value !== 'string' || !INTERNAL.test(value)) return value;
  const origin = publicOrigin(res.req);
  return origin ? value.replace(INTERNAL, origin) : value;
}

const isLocation = (name) => String(name).toLowerCase() === 'location';
const proto = http.ServerResponse.prototype;

const setHeader = proto.setHeader;
proto.setHeader = function (name, value) {
  return setHeader.call(this, name, isLocation(name) ? fix(this, value) : value);
};

if (typeof proto.appendHeader === 'function') {
  const appendHeader = proto.appendHeader;
  proto.appendHeader = function (name, value) {
    return appendHeader.call(this, name, isLocation(name) ? fix(this, value) : value);
  };
}

const writeHead = proto.writeHead;
proto.writeHead = function (statusCode, ...rest) {
  const i = typeof rest[0] === 'string' ? 1 : 0; // writeHead(code, [message], [headers])
  const headers = rest[i];
  if (Array.isArray(headers)) {
    // flat [name, value, name, value, ...]
    for (let k = 0; k + 1 < headers.length; k += 2) {
      if (isLocation(headers[k])) headers[k + 1] = fix(this, headers[k + 1]);
    }
  } else if (headers && typeof headers === 'object') {
    for (const k of Object.keys(headers)) {
      if (isLocation(k)) headers[k] = fix(this, headers[k]);
    }
  }
  return writeHead.call(this, statusCode, ...rest);
};
