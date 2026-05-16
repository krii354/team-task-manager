<div align="center">

# Team Task Manager

**A production-grade, full-stack collaborative project & task manager.**

Single-service deploy. **Express + Next.js 14 in one process**, backed by
**PostgreSQL + Prisma**, deploys to **Railway in one click**.
UI inspired by Linear, Notion and Vercel.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-4-blue?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io)
[![Postgres](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Railway](https://img.shields.io/badge/deploy-Railway-0B0D0E?logo=railway)](https://railway.com)

</div>

---

## Why this design

Most full-stack starters deploy the frontend and backend as two separate
services. This repo runs **both inside one Node process on one port** —
Express handles `/api/*`, then forwards every other request to Next.js. That
gives you a single Railway service, a single domain, and zero CORS config in
production.

```
┌────────────────────────────────────────────────────┐
│  Railway service (Node 20, port = $PORT)           │
│                                                    │
│   Express middleware (helmet, CORS, rate limit)    │
│         │                                          │
│         ├──  /api/*  ──►  Express route handlers   │
│         │                                          │
│         └──   /*     ──►  Next.js getRequestHandler│
└────────────────────────────────────────────────────┘
                       │
                       └────►  Railway Postgres plugin
```

---

## Features

**Auth & Security**
- JWT with **access + refresh** token rotation, bcrypt (12 rounds)
- Cookie + Bearer support, role-based middleware (`ADMIN` / `MEMBER`)
- Helmet, HPP, xss-clean, rate-limit, Zod validation, centralized errors

**Projects**
- Full CRUD with deadline, status, custom color, team membership
- Auto-computed progress %, activity timeline per project

**Tasks**
- 4 priorities × 4 statuses, drag-and-drop Kanban (`@dnd-kit`)
- Comments, attachments (Cloudinary), per-task activity history
- Search + filter by status, priority, project, assignee, overdue

**Dashboard**
- Recharts area (completion trend), bar (priorities), radar (pipeline)
- Productivity score, totals, pending & overdue counts
- Live recent-activity feed

**UX**
- Dark / light mode, Framer Motion animations
- Skeleton loaders, empty states, error boundaries, toast notifications
- Mobile-responsive sidebar + topbar

---

## Tech stack

| Layer       | Stack |
| ----------- | ----- |
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind, ShadCN-on-Radix, Framer Motion, TanStack Query, Zustand, Axios, RHF + Zod, Recharts, dnd-kit, sonner |
| Backend     | Node 20, Express 4, TypeScript, Zod, Pino, Helmet, CORS, rate-limit |
| ORM / DB    | PostgreSQL 16, Prisma 5 |
| File store  | Cloudinary (optional) |
| Tests       | Jest, ts-jest, supertest, @testing-library/react |
| Deploy      | Railway + Nixpacks (no Docker, no docker-compose) |

---

## Quick start (local)

### Prerequisites

- Node.js **>= 18.18** (Node 20 recommended)
- PostgreSQL **>= 14** running locally **OR** a free cloud DB
  (Neon / Supabase / Railway Postgres)

### Path A — Local Postgres on Windows (no Docker)

1. Download & install PostgreSQL 16:
   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Set a password for the `postgres` superuser (remember it).
   - Keep the default port `5432`.

2. From `D:\kritika` in PowerShell, create the app database & user:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-postgres.ps1
   ```

   It will ask for the `postgres` superuser password, then create the
   `ttm_user` role and `team_task_manager` database that `server/.env`
   already points at.

3. Bootstrap everything:

   ```powershell
   npm run go
   ```

   That single command:
   - copies `.env` files from the examples
   - **verifies Postgres is reachable** (early-exits with help if not)
   - installs all workspace deps
   - runs Prisma migrations
   - seeds demo data
   - starts both dev servers

### Path B — Free cloud Postgres (no install)

1. Sign up at https://neon.tech (or Supabase / Railway).
2. Create a project, copy the connection string.
3. Paste it into `server/.env` → `DATABASE_URL=...`.
4. Run `npm run go`.

### Once it's running

| Service   | URL                              |
| --------- | -------------------------------- |
| Frontend  | http://localhost:3000            |
| API       | http://localhost:4000/api        |
| Health    | http://localhost:4000/api/health |

Demo credentials (after seed):
- **Admin**:  `admin@taskmanager.dev`  /  `Password123`
- **Member**: `maya@taskmanager.dev`  /  `Password123`

> Local dev runs the API on `:4000` and Next.js on `:3000` for fast HMR.
> Production runs **both on the same port** (the Railway $PORT).

---

## Deploy to Railway (single service)

The full step-by-step is in **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**. TL;DR:

1. Push the repo to GitHub.
2. Railway → **Deploy from GitHub repo** → pick this repo.
3. **+ New** → **Database** → **Add PostgreSQL**.
4. Set env vars on the app service:
   - `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (48+ random bytes)
   - `CORS_ORIGIN` / `CLIENT_URL` = your Railway domain (after step 5)
   - `NODE_ENV=production`
5. **Settings → Networking → Generate Domain**, then put it into `CORS_ORIGIN`.

Railway picks up `nixpacks.toml` + `railway.json`, runs `npm install && npm run build`,
then `npm start` — which executes `prisma migrate deploy` and boots the
combined Express + Next.js server on `$PORT`.

---

## Environment variables

### Backend / unified server

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` |  | `development` | `development` \| `production` \| `test` |
| `PORT` |  | `4000` (dev) / Railway-injected (prod) | Server port |
| `DATABASE_URL` | ✓ | — | Postgres connection string |
| `JWT_ACCESS_SECRET` | ✓ | — | ≥ 16 chars, longer is better |
| `JWT_REFRESH_SECRET` | ✓ | — | ≥ 16 chars |
| `JWT_ACCESS_EXPIRES_IN` |  | `15m` | TTL for access tokens |
| `JWT_REFRESH_EXPIRES_IN` |  | `7d` | TTL for refresh tokens |
| `CORS_ORIGIN` |  | `http://localhost:3000` | Comma-separated allowed origins |
| `CLIENT_URL` |  | `http://localhost:3000` | Public app URL |
| `SERVE_FRONTEND` |  | `true` in prod | Force on/off the Next.js host inside Express |
| `CLOUDINARY_*` |  | — | Required for task attachments |
| `RATE_LIMIT_WINDOW_MS` |  | `900000` | 15 minutes |
| `RATE_LIMIT_MAX` |  | `300` | Requests per window per IP |
| `LOG_LEVEL` |  | `info` | Pino log level |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` |  | Set to `http://localhost:4000/api` for local dev. **Leave unset in production** — the unified server uses a relative `/api` on the same origin. |
| `NEXT_PUBLIC_APP_NAME` |  | App brand name |

---

## API reference

Full request/response examples → **[`docs/API.md`](docs/API.md)**

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/users/me
PUT    /api/users/profile
POST   /api/users/change-password
GET    /api/users              (admin)
PUT    /api/users/:id          (admin)
DELETE /api/users/:id          (admin)

GET    /api/projects
POST   /api/projects           (admin)
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/attachments

POST   /api/comments
GET    /api/comments/:taskId
DELETE /api/comments/:id

GET    /api/dashboard/stats
GET    /api/health
```

Response envelope:
```json
{ "success": true, "message": "...", "data": <payload>, "meta": <pagination?> }
```

---

## Folder structure

```
.
├── client/                       # Next.js 14 frontend
│   ├── app/
│   │   ├── (auth)/               # login, signup
│   │   ├── (app)/                # protected layout: dashboard, projects, tasks, settings
│   │   ├── unauthorized/
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/{ui,layout,dashboard,projects,tasks}/
│   ├── hooks/                    # TanStack Query hooks
│   ├── lib/                      # api client, utils, types, constants
│   ├── providers/
│   ├── store/                    # Zustand
│   └── tailwind.config.ts
│
├── server/                       # Express + Prisma
│   ├── src/
│   │   ├── config/               # env, prisma, logger, cloudinary
│   │   ├── controllers/
│   │   ├── middleware/           # auth, validate, error, rateLimit, upload
│   │   ├── routes/
│   │   ├── services/             # token, activity, upload
│   │   ├── utils/                # ApiError, ApiResponse, jwt, password, pagination
│   │   ├── validators/           # Zod schemas
│   │   ├── app.ts                # Express factory
│   │   └── index.ts              # boots Express + Next.js (single port)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/
│
├── scripts/
│   ├── bootstrap.mjs             # `npm run go` — one-shot local setup
│   └── setup-postgres.ps1        # Windows helper to create role + DB
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md             # Railway step-by-step
│
├── nixpacks.toml                 # Railway build instructions (no Docker)
├── railway.json                  # Railway runtime config
├── package.json                  # workspace root
└── README.md
```

---

## Testing

```bash
npm test                                  # all workspaces
npm test --workspace=server               # backend (needs test DB)
npm test --workspace=client               # frontend
```

---

## Scripts cheat sheet

| Command | What it does |
| --- | --- |
| `npm run go` | One-shot setup: env files → DB check → install → migrate → seed → dev |
| `npm run setup` | Same as `go` but skips starting dev servers |
| `npm run dev` | Start API (`:4000`) + frontend (`:3000`) in parallel |
| `npm run build` | Prisma generate → Next.js build → TypeScript compile |
| `npm start` | Production: `prisma migrate deploy` → unified server |
| `npm run db:migrate` | Create / apply new migration (dev) |
| `npm run db:deploy` | Apply pending migrations (prod) |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:studio` | Open Prisma Studio in the browser |
| `npm test` | Run all workspace tests |

---

## Roadmap

- [ ] Real-time updates with Socket.io
- [ ] Email notifications (Resend / SES)
- [ ] Team invitations via signed links
- [ ] Advanced analytics: cycle time, burndown, throughput
- [ ] CSV / PDF export of reports
- [ ] OpenAPI spec + auto-generated SDK
- [ ] E2E tests with Playwright

---

## License

MIT © 2025 — Built as a portfolio project to demonstrate Silicon-Valley-grade
full-stack engineering: clean architecture, security, performance, DX, and
deployability.
