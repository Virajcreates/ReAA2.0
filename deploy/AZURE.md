# Deploying REAA to Azure

REAA runs on **Azure Container Apps** as one container: the Next.js website,
its API (`/api/...`) and sign-in all come from the same address. Every push to
`main` that changes the app builds a new image in GitHub Actions and rolls it
out automatically.

Everything in Azure is named after the project name **`reaa`** (not the GitHub
repository `ReAA2.0`, not the Vercel project `re-aa-2-0`):

| What | Name |
|---|---|
| Resource group (only this project) | `reaa` |
| Container app | `reaa` (in the shared environment `purva-bot-env`) |
| Container registry | `reaa82aaf9d4` |
| Image | `reaa82aaf9d4.azurecr.io/reaa:<commit>-<attempt>` |
| Identity GitHub uses to deploy | `reaa-github` |
| Settings in `.env.azure` | `KEY_reaa` (e.g. `GEMINI_API_KEY_reaa`) |

The setup steps below run in **Azure Cloud Shell** (it already has `az`, `git`,
`gh` and `jq`). You run them once. After that, deploys happen by themselves.

---

## Before you start

**1. Your Azure account needs Owner rights.** The account that runs the
scripts must be **Owner** of subscription `82aaf9d4-d161-4dab-8ecf-dff34de35353`
(or **Contributor** plus **User Access Administrator**). Contributor alone can
create everything but can't give out access, and both scripts do that. You
would then see `AuthorizationFailed ... Microsoft.Authorization/roleAssignments/write`.

Check what you have (in Cloud Shell):

```bash
az role assignment list --assignee "$(az ad signed-in-user show --query id -o tsv)" --all -o table
```

You need a line with `Owner` (or both `Contributor` and `User Access
Administrator`) whose scope is `/subscriptions/82aaf9d4-...`. If it's missing,
the subscription's Owner adds it: Azure portal -> **Subscriptions** -> the
subscription -> **Access control (IAM)** -> **Add** -> **Add role assignment**
-> pick the role -> **Members** -> your account -> **Review + assign**.

A role that was *just* added can take a few minutes to work. Wait, or run
`az login` in the same Cloud Shell tab. You don't need to start over.

**2. Keep the Cloud Shell tab open until you're done.** Cloud Shell can forget
files when the session ends (especially an "ephemeral" session), and
`.env.azure` (your settings file) exists only there.

**3. The deploy files must already be on `main`.** Check on GitHub that the
repository has a `deploy` folder and `.github/workflows/azure.yml` on `main`.
Whoever set this up pushes those first.

**4. You need push access to the repository** (be a collaborator on
`Virajcreates/ReAA2.0`). You'll push one small file at the end. The
repository is **public**: anything committed, including the commit email, is
visible to everyone. The steps below use GitHub's private "noreply" email.

---

## Setup, step by step

Open Cloud Shell: <https://shell.azure.com> (choose **Bash**).

### 1. Get the code

Sign in to GitHub (choose GitHub.com, HTTPS, and "Login with a web browser";
copy the code it shows):

```bash
gh auth login
```

```bash
gh repo clone Virajcreates/ReAA2.0
```

```bash
cd ReAA2.0
```

The folder is named after the repository (`ReAA2.0`), not the project name.

*Already cloned it before?* Go into it and update it instead:

```bash
cd ~/ReAA2.0 && git checkout main && git pull
```

Check the deploy files are there (you should see `azure.sh`, `github-setup.sh`,
`vercel-env.sh` and others):

```bash
ls deploy
```

### 2. Set your git name and email (once)

Cloud Shell has none. These use your GitHub name and the private noreply
email, so your real email isn't published:

```bash
git config user.name "$(gh api user --jq '.name // .login')"
```

```bash
git config user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
```

### 3. Collect the settings into `.env.azure`

The app's API keys go into a file called `.env.azure` in the `ReAA2.0` folder.
It is **never committed** (git ignores it) and only you can read it.

**Option A: copy them from Vercel** (where the app runs today). You need a
Vercel access token from the account that owns the `re-aa-2-0` project:
vercel.com -> your avatar -> **Account Settings** -> **Tokens** -> **Create**.
If the project belongs to a Vercel *team*, first put the team's slug or id in
`VERCEL_TEAM=` in `deploy/azure-deploy.conf`. Then:

```bash
bash deploy/vercel-env.sh
```

It asks for the token (typing is hidden; paste with right-click or
Ctrl+Shift+V, then Enter). It never prints any value. At the end it lists:
- settings it left out on purpose (e.g. `PORT`, Vercel's own settings),
- settings marked **Sensitive** on Vercel. Nobody can read those back, so
  you add them by hand,
- **required settings still missing**, and where to get each one.

**Option B: from someone's local settings file.** If the person who runs the
app locally can send you their `.env.local` (send it privately, never by
email or chat in plain text), upload it to Cloud Shell (the **Manage files**
-> **Upload** button), then:

```bash
bash deploy/vercel-env.sh --from-file ~/.env.local
```

Afterwards delete the uploaded copy: `rm ~/.env.local`.

**Option C: by hand.** Create the file and type the lines yourself (see the
table in "Settings" below):

```bash
nano .env.azure
```

and make it readable only by you:

```bash
chmod 600 .env.azure
```

**Check the file** (either way). Open it:

```bash
nano .env.azure
```

Every line looks like `NAME_reaa=value`. Fix or add lines as needed. In nano,
paste with right-click or **Ctrl+Shift+V**. Save with **Ctrl+O** then
**Enter**, and exit with **Ctrl+X**.

To see just the names (no values):

```bash
cut -d= -f1 .env.azure
```

**If it imported nothing useful:** the keys were probably marked "Sensitive"
on Vercel. Get each value from where it was created (the "still missing" list
says where: Google AI Studio, Supabase, Pinecone, DataStax Astra), or from the
app's owner, and add the lines by hand. The name always ends in `_reaa`, e.g.
`GEMINI_API_KEY_reaa=AIza...`.

### 4. Create the Azure resources

First a dry run. It shows what it would do and changes nothing (secret values
are shown as `***`):

```bash
DRY_RUN=1 bash deploy/azure.sh
```

Then for real (takes a few minutes):

```bash
bash deploy/azure.sh
```

It creates the resource group `reaa`, the registry, and the container app
(running a placeholder page until the first deploy), and loads your settings
into it. It also writes the app's address and the public website settings
into `deploy/azure-deploy.conf`.

- **`InternalServerError`**: Azure sometimes says this even though it worked.
  Just run the same command again. It picks up where it stopped.
- **`AuthorizationFailed`**: your account lacks a role (see "Before you
  start"). The script says which one. If the role was just added it keeps
  retrying for a couple of minutes; if it still fails, wait a few minutes (or
  run `az login`) and run the command again.
- **A warning that a setting is missing** tells you what won't work without it.
  Add the line to `.env.azure` and run `bash deploy/azure.sh` again.

### 5. Let GitHub deploy

```bash
bash deploy/github-setup.sh
```

This creates the identity `reaa-github` that GitHub Actions signs in with (no
password is stored anywhere: Azure trusts only GitHub runs on `main` of this
repository). It writes its IDs into `deploy/azure-deploy.conf` and, at the
end, prints **one git command**.

### 6. Publish the config file (starts the first deploy)

Run the command `github-setup.sh` printed. It looks like this:

```bash
git add deploy/azure-deploy.conf && git commit -m "Azure: deploy identity for GitHub Actions" && git push
```

If git asks for a username/password, run this once, then the command again:

```bash
gh auth setup-git
```

### 7. Watch it and open the app

```bash
gh run watch --repo Virajcreates/ReAA2.0
```

(or open the repository on GitHub -> **Actions** -> **Deploy to Azure**). It
takes about 5 minutes. When it's green, open the address it printed (also in
`BACKEND_URL=` in `deploy/azure-deploy.conf`), e.g.
`https://reaa.<something>.centralindia.azurecontainerapps.io`, and the health
page `<address>/login`.

Before people can **sign in** on the new address, do the Supabase step in
"Switching users over" below.

---

## Settings

Names follow one rule, so settings of different projects can never clash:

| In `.env.azure` | Secret in Azure (portal) | What the app reads |
|---|---|---|
| `KEY_reaa=value` | `key-reaa` (lower-case, `_` -> `-`) | `KEY` |

For example `GEMINI_API_KEY_reaa` is stored as the secret
`gemini-api-key-reaa`, and the app gets `GEMINI_API_KEY=secretref:gemini-api-key-reaa`.
`PORT` is always `8080` and set by the script.

| `.env.azure` name | Secret | Env var | Needed? | Where to get it |
|---|---|---|---|---|
| `GEMINI_API_KEY_reaa` | `gemini-api-key-reaa` | `GEMINI_API_KEY` | **required**: every answer | Google AI Studio -> Get API key |
| `GEMINI_CHAT_MODEL_reaa` | `gemini-chat-model-reaa` | `GEMINI_CHAT_MODEL` | optional (default `gemini-3.5-flash`) | |
| `GEMINI_EMBEDDING_MODEL_reaa` | `gemini-embedding-model-reaa` | `GEMINI_EMBEDDING_MODEL` | optional (default `gemini-embedding-001`) | |
| `SUPABASE_URL_reaa` | `supabase-url-reaa` | `SUPABASE_URL` | **required** | Supabase -> Project Settings -> Data API -> Project URL |
| `SUPABASE_PUBLISHABLE_KEY_reaa` | `supabase-publishable-key-reaa` | `SUPABASE_PUBLISHABLE_KEY` | **required**: sign-in | Supabase -> Project Settings -> API Keys -> Publishable key (or legacy `anon`) |
| `SUPABASE_SECRET_KEY_reaa` (or `SUPABASE_SERVICE_ROLE_KEY_reaa`) | `supabase-secret-key-reaa` | `SUPABASE_SECRET_KEY` | **required**: shared links, uploads, statistics | Supabase -> Project Settings -> API Keys -> Secret key (or legacy `service_role`) |
| `PINECONE_API_KEY_reaa` | `pinecone-api-key-reaa` | `PINECONE_API_KEY` | **required**: legal/project search | app.pinecone.io -> API Keys |
| `PINECONE_HOST_reaa` | `pinecone-host-reaa` | `PINECONE_HOST` | optional | Pinecone -> Indexes -> `newreaa` -> Host |
| `PINECONE_INDEX_reaa` | `pinecone-index-reaa` | `PINECONE_INDEX` | optional (default `newreaa`) | |
| `ASTRA_DB_API_ENDPOINT_reaa` | `astra-db-api-endpoint-reaa` | `ASTRA_DB_API_ENDPOINT` | **required**: document links | astra.datastax.com -> database -> Overview -> API Endpoint |
| `ASTRA_DB_APPLICATION_TOKEN_reaa` | `astra-db-application-token-reaa` | `ASTRA_DB_APPLICATION_TOKEN` | **required**: document links | astra.datastax.com -> database -> Generate Token |
| `ASTRA_DB_COLLECTION_reaa` | `astra-db-collection-reaa` | `ASTRA_DB_COLLECTION` | optional (default `rera_links`) | |

**Website settings** are public (they end up in the browser's JavaScript) and
live in `deploy/azure-deploy.conf`, not in `.env.azure`:

| Config line | Comes from |
|---|---|
| `WEB_ENV_NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL_reaa` (copied by `azure.sh`) |
| `WEB_ENV_NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_PUBLISHABLE_KEY_reaa` (copied by `azure.sh`; it refuses a secret/service_role key) |

### Changing a setting later

- **Easiest:** edit `.env.azure` in Cloud Shell (`nano .env.azure`), then run
  `bash deploy/azure.sh`. It updates only what changed and restarts the app
  with the new values. If it prints a git command (it does when a website
  setting changed), run that too.
- **Or in the Azure portal:** Container Apps -> `reaa` -> **Secrets** -> edit
  the secret, then **Revisions and replicas** -> **Restart**. (If you later
  rerun `azure.sh`, `.env.azure` wins, so keep it up to date.)
- **Website settings:** edit the `WEB_ENV_` lines in
  `deploy/azure-deploy.conf`, then commit and push. That rebuilds the site.
- **Size** (CPU/memory/replicas): edit `CPU=`, `MEMORY=`, `MIN_REPLICAS=`,
  `MAX_REPLICAS=` in `deploy/azure-deploy.conf`, run `bash deploy/azure.sh`,
  then commit and push the file.

---

## Switching users over to the new address

Until you switch, Vercel (`https://re-aa-2-0.vercel.app`) keeps running as
before. Both use the same Supabase, Pinecone and Astra data, so consultations
are the same on both. REAA has no background jobs, so running both at once
is harmless.

1. **Supabase sign-in (required before anyone can sign in on Azure).**
   Supabase -> your project -> **Authentication** -> **URL Configuration**:
   - **Redirect URLs**: add `https://<new address>/**` (keep the Vercel one
     for now). Without this, Google sign-in on Azure sends people back to the
     Vercel site.
   - **Site URL**: change it to the new address when you switch for good.
     It is the default place Supabase sends people to.
   Google's own settings don't change (Google redirects to Supabase, not to
   the app).
2. **Share links** are built from the address the person is using, so links
   shared from Vercel keep pointing to Vercel. They work as long as Vercel
   runs, and the same link works on Azure if you swap the address part.
   There are no printed QR codes or emailed links in the app.
3. **CORS:** nothing to do. The website and API share one address.
4. **Tell people the new address**, and update anything that links to the
   old one (e.g. the GitHub repository's "website" link).
5. **Turning Vercel off** (optional, later): once nobody uses the old address,
   remove the old Redirect URL in Supabase and disconnect or delete the
   Vercel project. Until then, pushes to `main` deploy to both.

---

## What is shared with other projects (and what isn't)

- The **Container Apps environment** `purva-bot-env` (group `purva-bot`) is
  shared: the free trial allows only one environment in total. This app only
  *joins* it. The scripts never change it. REAA's logs go to that environment's
  Log Analytics workspace. If that environment were ever deleted, this app
  would be deleted with it.
- One **custom role**, "Container Apps environment join (purva-bot-env)", is
  shared by all projects. It lets a project's deploy identity add its app to
  the environment, nothing else.
- Everything else is REAA's own, in group `reaa`: registry, app, deploy
  identity, settings. Settings can't clash with other projects' because every
  name ends in `_reaa` / `-reaa`, and `azure.sh` refuses any `.env.azure` line
  that doesn't.
- `reaa-github` may only: manage group `reaa` (Contributor), push images to
  `reaa82aaf9d4` (AcrPush), and join the shared environment (the shared role).
  Nothing on the `purva-bot` group, nothing on the subscription.

## Costs (roughly, per month)

- Container registry Basic: about **US$5**.
- The app is always on (`MIN_REPLICAS=1`), so nobody waits for it to start:
  about **US$12** at 0.5 vCPU / 1 GiB when mostly idle (about US$18 at
  0.75 vCPU / 1.5 GiB, the size to use if many people attach PDFs at the
  same time), up to about US$0.05 per hour more while busy. Setting
  `MIN_REPLICAS=0` lets it sleep when unused (much cheaper, but the first
  visit after a quiet spell waits ~10–30 s).
- Logs: pennies.
- Azure's monthly free Container Apps allowance is shared by all apps in the
  subscription, so it may already be used up by the others.

## Removing it

This deletes everything REAA has in Azure (app, registry, deploy identity):

```bash
az group delete -n reaa
```

**Never** delete the `purva-bot` group, the `purva-bot-env` environment or
the shared "Container Apps environment join (purva-bot-env)" role. Other
projects use them.

---

## Reference

- `deploy/azure-deploy.conf`: all non-secret settings (committed). The
  workflow reads only this file; there are no GitHub Actions variables or
  secrets.
- `deploy/Dockerfile`: the image (Next.js build, non-root, port 8080).
- `deploy/redirect-host.cjs`: makes the sign-in redirect use the public
  address. Next.js outside Vercel would otherwise send people to
  `https://0.0.0.0:8080/` after signing in.
- `.github/workflows/azure.yml`: build, push, roll out, then wait until the
  new version answers on `/login`.
- Health check: there's no `/api/health` endpoint, so `/login` is used. It's a
  pre-built page with no database call.
- Nothing is stored on the container's disk. Chats, uploads and logins live in
  Supabase, so restarts and deploys lose nothing.
