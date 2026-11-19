# syntax=docker/dockerfile:1
# Container image for REAA (Next.js 14: pages, API routes and middleware in
# one server). Built by GitHub Actions (.github/workflows/azure.yml) and run
# on Azure Container Apps; never built in Azure.
#
#   docker build --platform linux/amd64 -f deploy/Dockerfile \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key> \
#     -t reaa .
#   docker run --rm -p 8080:8080 --env-file <settings> reaa
#
# The two NEXT_PUBLIC_ values are PUBLIC (they end up in the browser's
# JavaScript) and are baked in at build time; the workflow takes them from
# WEB_ENV_* in deploy/azure-deploy.conf. Every secret (Gemini, Supabase secret
# key, Pinecone, Astra) is read at run time from env vars, never baked in.
#
# Uses deploy/Dockerfile.dockerignore (BuildKit picks it up next to this file).

ARG NODE_IMAGE=node:22-alpine

# ---- dependencies (all, for the build) ----
FROM --platform=linux/amd64 ${NODE_IMAGE} AS deps
# Package registry: the normal default; a local build can use a mirror
# (e.g. --build-arg NPM_REGISTRY=https://registry.yarnpkg.com).
ARG NPM_REGISTRY=https://registry.npmjs.org/
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set registry "$NPM_REGISTRY" \
 && npm ci --no-audit --no-fund --loglevel=error

# ---- production-only dependencies (what the server needs at run time) ----
FROM --platform=linux/amd64 ${NODE_IMAGE} AS prod-deps
ARG NPM_REGISTRY=https://registry.npmjs.org/
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set registry "$NPM_REGISTRY" \
 && npm ci --omit=dev --no-audit --no-fund --loglevel=error \
 && npm cache clean --force \
 && rm -rf node_modules/@next/swc-*
# (@next/swc-* is the ~280MB compiler used by "next build"; "next start"
# doesn't load it.)

# ---- build ----
FROM --platform=linux/amd64 ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Public browser settings, inlined into the JavaScript by "next build".
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
 && rm -rf .next/cache

# ---- runtime ----
FROM --platform=linux/amd64 ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/next.config.mjs ./
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
# Makes sign-in redirects use the public address instead of 0.0.0.0:8080
# (see the comment at the top of deploy/redirect-host.cjs).
COPY --chown=node:node deploy/redirect-host.cjs ./deploy/redirect-host.cjs
ENV NODE_OPTIONS=--require=/app/deploy/redirect-host.cjs
# Non-root (uid 1000). Next.js may write its cache under .next/cache; that is
# the only disk write, it is a cache, and it is lost on restart (that's fine).
USER node
EXPOSE 8080
# package.json's "start" hard-codes port 3005, so call next directly with $PORT
# (Azure sets 8080) and listen on all interfaces.
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p \"${PORT:-8080}\""]
