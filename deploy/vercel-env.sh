#!/usr/bin/env bash
# deploy/vercel-env.sh: copy the app's settings from Vercel into .env.azure.
#
#   bash deploy/vercel-env.sh               # project from deploy/azure-deploy.conf
#   bash deploy/vercel-env.sh <project>     # another Vercel project name
#
# Asks for a Vercel access token (vercel.com -> avatar -> Account Settings ->
# Tokens -> Create; scope: the account or team that owns the project). It is
# read without echo and only sent to api.vercel.com. VERCEL_TOKEN in the shell
# is used instead if set. The team comes from VERCEL_TEAM in the config file.
#
# Reads the project's Production environment variables. Values Vercel marks
# "Sensitive" can't be read back by anyone (not the API, not the dashboard);
# they are listed so you can add them by hand.
# Writes .env.azure (mode 600, never committed) with every name suffixed
# _<project> (GEMINI_API_KEY -> GEMINI_API_KEY_reaa), backs up an existing
# file to .env.azure.bak, and never prints a value.
# Leaves out PORT, Vercel-only settings, NEXT_PUBLIC_ website build settings
# (deploy/azure.sh puts the public Supabase values into the config file
# itself), one-time admin passwords and empty or multi-line values, and lists
# what it left out. At the end it lists the required settings still missing.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"

need curl
need jq
APP="$(conf_get APP_NAME)"
[ -n "$APP" ] || die "APP_NAME is missing in $CONF_REL"
PROJECT="$(printf '%s' "$APP" | tr '-' '_')"
FROM_FILE=""
if [ "${1:-}" = "--from-file" ]; then
  # bash deploy/vercel-env.sh --from-file <path>: same, but from a local
  # KEY=value file (e.g. the .env.local someone runs the app with) instead of
  # the Vercel API. Names in it are WITHOUT the _<project> suffix.
  FROM_FILE="${2:-}"
  [ -n "$FROM_FILE" ] && [ -f "$FROM_FILE" ] || die "usage: bash deploy/vercel-env.sh --from-file <path to a KEY=value file>"
  case "$(cd "$(dirname "$FROM_FILE")" && pwd)/$(basename "$FROM_FILE")" in
    "$REPO_DIR/.env.azure"|"$REPO_DIR/.env.azure.bak") die "that is the output file itself; give the original settings file" ;;
  esac
  set --
fi
VPROJECT="${1:-$(conf_get VERCEL_PROJECT_NAME)}"
[ -n "$VPROJECT" ] || die "give the Vercel project name: bash deploy/vercel-env.sh <project>"
TEAM="$(conf_get VERCEL_TEAM)"
API="https://api.vercel.com"
OUT="$REPO_DIR/.env.azure"

case "$TEAM" in
  "") TEAMQ="" ;;
  team_*) TEAMQ="teamId=$TEAM" ;;
  *) TEAMQ="slug=$TEAM" ;;
esac

# Settings the code needs, and where to get each one if Vercel doesn't have it
# (or has it marked Sensitive). "A/B" means either one.
REQUIRED="GEMINI_API_KEY|Google AI Studio -> Get API key (https://aistudio.google.com/apikey)
SUPABASE_URL|Supabase dashboard -> your project -> Project Settings -> Data API -> Project URL (https://<ref>.supabase.co)
SUPABASE_PUBLISHABLE_KEY|Supabase -> Project Settings -> API Keys -> Publishable key (sb_publishable_...) or the legacy 'anon' key
SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY|Supabase -> Project Settings -> API Keys -> Secret key (sb_secret_...) or the legacy 'service_role' key
PINECONE_API_KEY|app.pinecone.io -> API Keys (and PINECONE_HOST: Indexes -> newreaa -> Host)
ASTRA_DB_API_ENDPOINT|astra.datastax.com -> your database -> Overview -> API Endpoint
ASTRA_DB_APPLICATION_TOKEN|astra.datastax.com -> your database -> Overview -> Generate Token (AstraCS:...)"

BODY="$(mktemp "${TMPDIR:-/tmp}/vercel.XXXXXX")"
trap 'rm -f "$BODY" "$ERR_FILE" "${TMP_OUT:-}"' EXIT
ALL="[]"
UNREADABLE=""
OTHER_ONLY=""
SOURCE="Vercel project $VPROJECT"

if [ -n "$FROM_FILE" ]; then
  SOURCE="file $(basename "$FROM_FILE")"
  say "Reading $FROM_FILE"
  # KEY=value lines (optional "export ", quotes, comments), like dotenv.
  ALL="$(jq -Rsc '
    [split("\n")[] | sub("\r$"; "") | select(test("^\\s*(export\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s*="))
     | sub("^\\s*(export\\s+)?"; "") | capture("^(?<key>[A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(?<value>.*)$")
     | .value |= (sub("\\s+$"; "") | if test("^\".*\"$") or test("^'"'"'.*'"'"'$") then .[1:-1] else sub("\\s+#.*$"; "") end)]' "$FROM_FILE")"
  info "$(printf '%s' "$ALL" | jq 'length') settings in the file"
  bad="$(printf '%s' "$ALL" | jq -r --arg p "_$PROJECT" '[.[].key | select(endswith($p))] | join(", ")')"
  [ -z "$bad" ] || die "$FROM_FILE already has names ending in _$PROJECT ($bad); give the plain names (GEMINI_API_KEY=...), or edit .env.azure directly"
fi

if [ -z "$FROM_FILE" ] && [ -z "${VERCEL_TOKEN:-}" ]; then
  printf 'Vercel access token (input hidden): ' >&2
  read -rs VERCEL_TOKEN
  printf '\n' >&2
fi
[ -n "$FROM_FILE" ] || [ -n "$VERCEL_TOKEN" ] || die "no token given"

urlenc() { jq -rn --arg v "$1" '$v | @uri'; }

# vercel_get PATH [QUERY]: GET from the Vercel API into $BODY; sets CODE. The
# token goes to curl on stdin, so it never appears in the process list.
# Stops with Vercel's own message unless the reply is a JSON object.
vercel_get() {
  local q="${2:-}" url
  [ -n "$TEAMQ" ] && q="${q:+$q&}$TEAMQ"
  url="$API$1${q:+?$q}"
  CODE="$(printf 'header = "Authorization: Bearer %s"\n' "$VERCEL_TOKEN" \
    | curl -sS -K - -H 'Accept: application/json' -o "$BODY" -w '%{http_code}' --max-time 30 "$url" 2>"$ERR_FILE")" \
    || die "could not reach $API ($(cat "$ERR_FILE"))"
  if ! jq -e 'type == "object"' "$BODY" >/dev/null 2>&1; then
    die "Vercel answered $CODE with something that isn't JSON: $(head -c 300 "$BODY" | tr '\n' ' ')"
  fi
}
vercel_fail() {  # stop with Vercel's error message
  local msg
  msg="$(jq -r '.error.message // .message // empty' "$BODY")"
  case "$CODE" in
    401|403) die "Vercel refused the token ($CODE: ${msg:-no message}). Check the token, and that its scope includes ${TEAM:-your personal account} (VERCEL_TEAM in $CONF_REL)." ;;
  esac
  die "Vercel answered $CODE: ${msg:-$(head -c 300 "$BODY" | tr '\n' ' ')}"
}

if [ -z "$FROM_FILE" ]; then   # ---- from the Vercel API ----
say "Finding Vercel project '$VPROJECT'${TEAM:+ (team $TEAM)}"
vercel_get "/v9/projects/$(urlenc "$VPROJECT")"
if [ "$CODE" = 404 ]; then
  warn "no Vercel project named '$VPROJECT' is visible to this token${TEAM:+ in team $TEAM}."
  vercel_get "/v9/projects" "limit=100"
  if [ "$CODE" -lt 400 ]; then
    say "Projects this token can see${TEAM:+ in team $TEAM} (name, id):"
    jq -r '.projects[]? | "    \(.name)  id=\(.id)"' "$BODY"
  fi
  TEAMQ_SAVE="$TEAMQ"; TEAMQ=""
  vercel_get "/v2/teams" "limit=100"
  TEAMQ="$TEAMQ_SAVE"
  if [ "$CODE" -lt 400 ] && [ "$(jq '.teams | length' "$BODY" 2>/dev/null || echo 0)" -gt 0 ]; then
    say "Teams this token can see (put the slug or id in VERCEL_TEAM in $CONF_REL):"
    jq -r '.teams[] | "    \(.slug)  id=\(.id)  (\(.name // ""))"' "$BODY"
  fi
  die "run again with the right name (bash deploy/vercel-env.sh <name>) or set VERCEL_TEAM in $CONF_REL"
fi
[ "$CODE" -lt 400 ] || vercel_fail
PROJECT_ID="$(jq -r '.id // empty' "$BODY")"
[ -n "$PROJECT_ID" ] || die "Vercel's answer has no project id: $(head -c 300 "$BODY" | tr '\n' ' ')"
info "found $PROJECT_ID"

say "Reading its environment variables"
LIST="[]"
until_q=""
pages=0
while :; do
  vercel_get "/v10/projects/$PROJECT_ID/env" "${until_q:+until=$until_q}"
  [ "$CODE" -lt 400 ] || vercel_fail
  jq -e '.envs | type == "array"' "$BODY" >/dev/null 2>&1 \
    || die "Vercel's answer has no list of variables: $(head -c 300 "$BODY" | tr '\n' ' ')"
  LIST="$(jq -c --argjson all "$LIST" '$all + .envs' "$BODY")"
  until_q="$(jq -r '.pagination.next // empty' "$BODY")"
  pages=$((pages + 1))
  [ -n "$until_q" ] || break
  [ "$pages" -lt 50 ] || die "more than 50 pages of variables; something is wrong"
done
info "$(printf '%s' "$LIST" | jq 'length') variables in total (all environments)"

# Production ones only (target "production", not tied to a git branch).
PROD="$(printf '%s' "$LIST" | jq -c '[.[] | select(((.target // []) | if type == "array" then . else [.] end | index("production")) and ((.gitBranch // "") == ""))]')"
OTHER_ONLY="$(printf '%s' "$LIST" | jq -r --argjson p "$PROD" '[.[].key] - [$p[].key] | unique | join(", ")')"
info "$(printf '%s' "$PROD" | jq 'length') for Production"

# Read each value (one request per variable returns it decrypted).
ALL="[]"
UNREADABLE=""
n="$(printf '%s' "$PROD" | jq 'length')"
i=0
while [ "$i" -lt "$n" ]; do
  e="$(printf '%s' "$PROD" | jq -c --argjson i "$i" '.[$i]')"
  i=$((i + 1))
  k="$(printf '%s' "$e" | jq -r '.key')"
  t="$(printf '%s' "$e" | jq -r '.type // ""')"
  id="$(printf '%s' "$e" | jq -r '.id // ""')"
  case "$t" in
    sensitive|secret) UNREADABLE="$UNREADABLE $k"; continue ;;
    system) continue ;;
  esac
  vercel_get "/v1/projects/$PROJECT_ID/env/$(urlenc "$id")"
  [ "$CODE" -lt 400 ] || vercel_fail
  if [ "$(jq -r '.type // ""' "$BODY")" = sensitive ] || ! jq -e 'has("value")' "$BODY" >/dev/null; then
    UNREADABLE="$UNREADABLE $k"; continue
  fi
  ALL="$(jq -c --argjson all "$ALL" --arg k "$k" '$all + [{key: $k, value: (.value // "")}]' "$BODY")"
done
fi   # ---- end of Vercel API part ----

# The browser copies of the Supabase settings are the same values the server
# reads under its own names; use them if the server names aren't on Vercel.
alias_from() {  # alias_from TARGET SOURCE
  if ! printf '%s' "$ALL" | jq -e --arg k "$1" 'any(.[]; .key == $k and .value != "")' >/dev/null \
     && printf '%s' "$ALL" | jq -e --arg k "$2" 'any(.[]; .key == $k and .value != "")' >/dev/null; then
    ALL="$(printf '%s' "$ALL" | jq -c --arg t "$1" --arg s "$2" '. + [(map(select(.key == $s)) | last | .key = $t)]')"
    info "$1: taken from $2 (same value)"
  fi
}
alias_from SUPABASE_URL NEXT_PUBLIC_SUPABASE_URL
alias_from SUPABASE_PUBLISHABLE_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY

# Which ones to leave out, and why (printed; values never are).
reason_for() {
  local k="$1" v="$2"
  case "$k" in
    PORT) echo "PORT is always 8080 on Azure"; return ;;
    VERCEL|VERCEL_*|CI|NOW_*|NX_DAEMON|TURBO_*) echo "Vercel-only"; return ;;
    NODE_VERSION|NODE_OPTIONS|NPM_*|NEXT_TELEMETRY_DISABLED|ENABLE_EXPERIMENTAL_COREPACK)
      echo "Vercel build/runtime setting (the image sets its own)"; return ;;
    NEXT_PUBLIC_*)
      echo "website build setting (public; deploy/azure.sh writes the Supabase ones into $CONF_REL as WEB_ENV_)"; return ;;
    *ADMIN*PASSWORD*|*INITIAL*PASSWORD*|*BOOTSTRAP*|*SEED*PASSWORD*|*DEFAULT*PASSWORD*)
      echo "one-time admin password"; return ;;
  esac
  [ -n "$v" ] || { echo "empty"; return; }
  case "$v" in *$'\n'*|*$'\r'*) echo "multi-line value (add it in the Azure portal)"; return ;; esac
  printf '%s' "$k" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$' || { echo "not a valid name"; return; }
  echo ""
}

say "Writing .env.azure (names end in _$PROJECT)"
FINAL="$(printf '%s' "$ALL" | jq -c 'reduce .[] as $e ({order: [], m: {}};
  (if .m[$e.key] then . else .order += [$e.key] end) | .m[$e.key] = $e) | [.order[] as $k | .m[$k]]')"
TMP_OUT="$(mktemp "$REPO_DIR/.env.azure.tmp.XXXXXX")"
chmod 600 "$TMP_OUT"
{
  echo "# Settings for Azure app $APP, imported from $SOURCE on $(date -u +%Y-%m-%d)."
  echo "# NEVER commit this file. Every name ends in _$PROJECT; deploy/azure.sh stores"
  echo "# KEY_$PROJECT as the app secret <key>-$APP and gives the app the env var KEY."
  echo "# Edit, then rerun: bash deploy/azure.sh"
} > "$TMP_OUT"
written=0
WRITTEN_KEYS=" "
LEFT_OUT=""
n="$(printf '%s' "$FINAL" | jq 'length')"
i=0
while [ "$i" -lt "$n" ]; do
  k="$(printf '%s' "$FINAL" | jq -r --argjson i "$i" '.[$i].key // ""')"
  v="$(printf '%s' "$FINAL" | jq -r --argjson i "$i" '.[$i].value // ""'; printf x)"; v="${v%x}"; v="${v%$'\n'}"
  i=$((i + 1))
  r="$(reason_for "$k" "$v")"
  if [ -n "$r" ]; then LEFT_OUT="$LEFT_OUT    $k: $r"$'\n'; continue; fi
  printf '%s_%s=%s\n' "$k" "$PROJECT" "$v" >> "$TMP_OUT"
  info "$k -> ${k}_$PROJECT"
  written=$((written + 1))
  WRITTEN_KEYS="$WRITTEN_KEYS$k "
done

if [ -f "$OUT" ]; then
  cp -p "$OUT" "$OUT.bak"
  chmod 600 "$OUT.bak"
  info "previous file kept as .env.azure.bak"
fi
mv "$TMP_OUT" "$OUT"
chmod 600 "$OUT"
TMP_OUT=""

say "Wrote $written settings to .env.azure (mode 600)"
if [ -n "$LEFT_OUT" ]; then
  say "Left out:"
  printf '%s' "$LEFT_OUT"
fi
if [ -n "$UNREADABLE" ]; then
  say "Marked Sensitive on Vercel, so nobody can read them back (add them by hand):"
  for k in $UNREADABLE; do info "  $k  ->  ${k}_$PROJECT=<value>"; done
fi
[ -z "$OTHER_ONLY" ] || info "only set for Preview/Development on Vercel (not imported): $OTHER_ONLY"

MISSING=""
found_required=0
while IFS='|' read -r keys where; do
  [ -n "$keys" ] || continue
  have=0
  for k in $(printf '%s' "$keys" | tr '/' ' '); do
    case "$WRITTEN_KEYS" in *" $k "*) have=1 ;; esac
  done
  if [ "$have" = 1 ]; then
    found_required=$((found_required + 1))
  else
    MISSING="$MISSING    $(printf '%s' "$keys" | sed "s#/#_$PROJECT or #g")_$PROJECT: $where"$'\n'
  fi
done <<EOF
$REQUIRED
EOF

if [ -n "$MISSING" ]; then
  say "Required settings still missing (add each as a line NAME=value in .env.azure):"
  printf '%s' "$MISSING"
fi
if [ "$found_required" = 0 ]; then
  printf '\n' >&2
  warn "NONE of the settings REAA needs could be read from Vercel project '$VPROJECT'."
  cat >&2 <<EOF
    Most likely they are marked "Sensitive" on Vercel (their values can't be
    read back by anyone), or this is the wrong project. Get each value from
    where it was created (the list above says where), or from whoever set up
    the Vercel project (they may still have their local .env.local), and add
    them to .env.azure by hand (nano .env.azure), one per line, with _$PROJECT
    after the name, e.g. GEMINI_API_KEY_$PROJECT=the-value
EOF
fi
info "Next: check it with 'nano .env.azure', then run: DRY_RUN=1 bash deploy/azure.sh"
