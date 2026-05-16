# Deploy to Railway (single service, no Docker)

Team Task Manager is built so that **one Node process serves the entire app** —
Express handles `/api/*` and forwards every other request to the Next.js
handler on the same port. That means Railway sees this as a single service:

```
Railway Service  →  Node 20  →  Express + Next.js (port from $PORT)
        │
        └─────  Railway Postgres (separate plugin, auto-wired via $DATABASE_URL)
```

You'll deploy **one app service + one Postgres plugin** — no Docker, no
Dockerfiles, no docker-compose. Railway's Nixpacks builder reads `nixpacks.toml`
and `package.json` to install + build + start.

---

## Step-by-step

### 0. Prerequisites

- A GitHub account
- A Railway account → https://railway.com  (sign in with GitHub)
- This repo pushed to GitHub:

```powershell
cd D:\kritika
git init
git add .
git commit -m "Initial commit: Team Task Manager"
git branch -M main
# Create an empty repo at https://github.com/new (call it "team-task-manager")
git remote add origin https://github.com/<your-username>/team-task-manager.git
git push -u origin main
```

### 1. Create the Railway project

1. Go to https://railway.com/new
2. Click **Deploy from GitHub repo**
3. Pick `team-task-manager`
4. Railway will start auto-detecting a build. Let it create the service —
   we'll configure it in the next steps.

### 2. Add Postgres

In the project canvas:
1. Click **+ New** (top right) → **Database** → **Add PostgreSQL**
2. Wait ~30 seconds for it to provision.
3. Click the new **Postgres** service → **Variables** tab → confirm
   `DATABASE_URL` is auto-populated (you don't need to copy it).

### 3. Configure the app service

Click your app service (the GitHub-deployed one), then:

**Settings tab**
- **Service Name**: `app` (or anything you like)
- **Builder**: Nixpacks (default — leave it)
- **Watch Paths**: leave blank (deploy on every push)

**Variables tab** → click **Raw Editor** and paste this whole block:

```ini
NODE_ENV=production
PORT=8080

# Wires this service to the Postgres plugin in the same project
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Generate these on your machine with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_ACCESS_SECRET=replace-with-a-long-random-hex-string
JWT_REFRESH_SECRET=replace-with-another-long-random-hex-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# In unified mode the frontend lives on the same origin as the API,
# so CORS_ORIGIN can be the Railway-generated domain (set in step 5).
CORS_ORIGIN=https://example.up.railway.app
CLIENT_URL=https://example.up.railway.app

# Optional: Cloudinary for task attachments (otherwise uploads fail gracefully)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional tuning
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
LOG_LEVEL=info

# Frontend build-time vars. Leave NEXT_PUBLIC_API_URL UNSET — the client
# defaults to /api on the same origin, which is what we want.
NEXT_PUBLIC_APP_NAME=Team Task Manager
```

**Two-step JWT secret generation** (so you don't paste placeholders):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run it twice; paste each result into `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### 4. Generate a public domain

1. Service → **Settings** → **Networking** → **Generate Domain**
2. Copy the assigned URL — e.g. `https://team-task-manager-production-xxxx.up.railway.app`
3. Go back to **Variables** and update both `CORS_ORIGIN` and `CLIENT_URL` to
   that URL. Railway redeploys automatically.

### 5. Watch it deploy

Open the service **Deployments** tab. You'll see Nixpacks:

1. Install Node 20 from `nixpacks.toml`
2. Run `npm install --include=dev`
3. Run `npm run build` →
   - `prisma generate`
   - `next build` (frontend)
   - `tsc` (backend)
4. Run `npm start` →
   - `prisma migrate deploy` (creates schema on first boot)
   - `node server/dist/index.js` (boots Express + Next.js)

When the green **Active** badge appears, hit your public URL. Sign up for the
first account — it auto-becomes `ADMIN` because that's how the seed/login flow
is wired.

> Want demo data on first deploy? In the **Deployments** tab pick **Run
> Command** and run: `npm run db:seed --workspace=server`. This seeds the
> admin (`admin@taskmanager.dev` / `Password123`) plus 4 members and 12 tasks.

---

## What's running under the hood

When Express boots in production (`NODE_ENV=production`), it:

1. Sets up all security middleware (helmet, CORS, rate limits, validation).
2. Mounts API routes at `/api/*`.
3. Imports `next` and calls `next({ dev: false, dir: <client>/, customServer: true })`.
4. Calls `nextApp.prepare()` to load the Next.js build manifest.
5. Adds a catch-all `app.all("*")` that forwards every non-`/api` request to
   Next's request handler — so SSR, static routes, App Router, image
   optimization, all keep working.

One port. One process. One Railway service.

---

## Common operations

### Trigger a fresh deploy
Just push to `main`. Railway redeploys automatically.

### Reset the demo data
Service → **Run Command** → `npm run db:seed --workspace=server`

### View live logs
Service → **Deployments** → click a deployment → **Logs**

### Open a psql shell
Postgres plugin → **Data** → **Query** (or click **Connect** for psql credentials).

### Roll back
Service → **Deployments** → pick a previous green deploy → **Redeploy**.

---

## Hardening checklist

- [ ] Strong, random `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (48+ bytes)
- [ ] `CORS_ORIGIN` set to your exact frontend domain (no wildcards)
- [ ] Cloudinary keys configured (or accept that attachments will be disabled)
- [ ] Postgres backups enabled in Railway (Postgres plugin → Settings → Backups)
- [ ] Add an uptime monitor (UptimeRobot, BetterStack) pinging `/api/health`
- [ ] Configure a custom domain (Service → Settings → Domains → Custom Domain)

---

## Alternative cloud DBs

If you'd rather use **Neon**, **Supabase**, **Aiven**, etc. instead of the
Railway Postgres plugin:

1. Skip step 2 (don't add the Postgres plugin).
2. In step 3 set `DATABASE_URL` directly to that provider's connection string
   (with `?sslmode=require` if applicable).
3. Make sure outbound connections from Railway aren't IP-restricted on the
   provider side (most cloud DBs accept any IP by default).

---

## Troubleshooting

**"P1001: Can't reach database server"** during build
→ The Postgres plugin isn't in the same Railway project, or the `${{Postgres.DATABASE_URL}}`
reference is misspelled. Re-check the variable.

**"Module not found: 'next'"** at startup
→ Make sure the build phase actually ran (Deployments → Logs). The build
command in `nixpacks.toml` must succeed. If you removed `next` from
`server/package.json`, restore it.

**Frontend loads but API calls return 404**
→ `NEXT_PUBLIC_API_URL` was set at build time. Remove it (or set to `/api`),
then trigger a fresh deploy — env changes only apply at the next build.

**Health check failing**
→ The default health check path is `/api/health`. If you exposed the service
on a non-default port (not `$PORT`), the Express server binds to `env.PORT`
which Railway injects automatically — don't override it.
