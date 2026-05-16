#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-shot bootstrap for Team Task Manager (no Docker, no winget).
 *
 *   npm run go        → full setup + start dev servers
 *   npm run setup     → full setup only
 *
 * Flags:
 *   --skip-install    → skip npm install
 *   --skip-seed       → skip database seed step
 *   --skip-db-check   → don't probe Postgres before continuing
 *   --force-install   → reinstall even if node_modules looks complete
 *   --no-dev          → don't start dev servers after setup
 *
 * Required before running: a reachable PostgreSQL server. Either:
 *   - Install locally:        scripts/setup-postgres.ps1   (Windows helper)
 *   - Use a free cloud DB:    Neon / Supabase / Railway Postgres
 *
 * Set DATABASE_URL in server/.env to the connection string.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, copyFileSync, mkdirSync, readFileSync } from "node:fs";
import net from "node:net";
import { URL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const FLAGS = new Set(process.argv.slice(2));
const NO_DEV = FLAGS.has("--no-dev");
const SKIP_INSTALL = FLAGS.has("--skip-install");
const SKIP_SEED = FLAGS.has("--skip-seed");
const SKIP_DB_CHECK = FLAGS.has("--skip-db-check");
const FORCE_INSTALL = FLAGS.has("--force-install");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", magenta: "\x1b[35m",
};

const log = {
  step: (n, total, msg) => console.log(`\n${C.cyan}${C.bold}[${n}/${total}]${C.reset} ${C.bold}${msg}${C.reset}`),
  ok: (m) => console.log(`  ${C.green}✔${C.reset} ${m}`),
  info: (m) => console.log(`  ${C.dim}•${C.reset} ${C.dim}${m}${C.reset}`),
  warn: (m) => console.log(`  ${C.yellow}!${C.reset} ${m}`),
  err: (m) => console.error(`  ${C.red}✖${C.reset} ${m}`),
};

function run(cmd, args, opts = {}) {
  const isWin = process.platform === "win32";
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    stdio: opts.silent ? "pipe" : "inherit",
    shell: isWin,
    env: { ...process.env, ...opts.env },
  });
  return { code: result.status ?? 0, stdout: result.stdout?.toString() ?? "", stderr: result.stderr?.toString() ?? "" };
}

function ensureEnv(samplePath, targetPath, label) {
  if (existsSync(targetPath)) { log.info(`${label} already exists — keeping it`); return; }
  if (!existsSync(samplePath)) { log.warn(`${label}: example file missing at ${samplePath}`); return; }
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(samplePath, targetPath);
  log.ok(`${label} created from example`);
}

function parseDatabaseUrl() {
  const envFile = join(ROOT, "server/.env");
  if (!existsSync(envFile)) return null;
  const contents = readFileSync(envFile, "utf8");
  const match = contents.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  if (!match) return null;
  try {
    const u = new URL(match[1]);
    return { host: u.hostname, port: Number(u.port || 5432), full: match[1] };
  } catch { return null; }
}

function probeTcp(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let done = false;
    const finish = (ok) => { if (done) return; done = true; try { sock.destroy(); } catch {} resolve(ok); };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => finish(true));
    sock.once("timeout", () => finish(false));
    sock.once("error", () => finish(false));
    sock.connect(port, host);
  });
}

async function probeTcpWithRetry(host, port, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      process.stdout.write(`  ${C.dim}• Retrying (${i + 1}/${attempts})...${C.reset}\n`);
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (await probeTcp(host, port)) return true;
  }
  return false;
}

console.log(
  `${C.magenta}${C.bold}\n` +
    `╭───────────────────────────────────────────────╮\n` +
    `│   Team Task Manager — one-shot bootstrap      │\n` +
    `╰───────────────────────────────────────────────╯${C.reset}`,
);

const total = NO_DEV ? 5 : 6;

// 1) env files
log.step(1, total, "Preparing environment files");
ensureEnv(join(ROOT, ".env.example"), join(ROOT, ".env"), "root .env");
ensureEnv(join(ROOT, "server/.env.example"), join(ROOT, "server/.env"), "server/.env");
ensureEnv(join(ROOT, "client/.env.example"), join(ROOT, "client/.env"), "client/.env");

// 2) verify database reachability
log.step(2, total, "Checking PostgreSQL connection");
const db = parseDatabaseUrl();
if (!db) {
  log.err("Could not find DATABASE_URL in server/.env. Set it before running this script.");
  process.exit(1);
}

const isLocal = db.host === "localhost" || db.host === "127.0.0.1" || db.host === "::1";
const looksLikeCloud = /neon|supabase|aws|gcp|azure|render|railway|aiven|cockroach/i.test(db.host);

if (SKIP_DB_CHECK) {
  log.info(`--skip-db-check set; skipping probe of ${db.host}:${db.port}`);
} else {
  log.info(`Probing ${db.host}:${db.port} ${looksLikeCloud ? "(cloud — may take a moment to wake)" : ""}...`);
  const reachable = await probeTcpWithRetry(db.host, db.port, looksLikeCloud ? 5 : 3);
  if (!reachable) {
    if (isLocal) {
      log.err(`Could not reach Postgres at ${db.host}:${db.port}.`);
      console.log(`\n  ${C.bold}How to get Postgres ready:${C.reset}`);
      console.log(`  ${C.cyan}1.${C.reset} Install locally: ${C.dim}https://www.enterprisedb.com/downloads/postgres-postgresql-downloads${C.reset}`);
      console.log(`     then:  ${C.cyan}powershell -ExecutionPolicy Bypass -File .\\scripts\\setup-postgres.ps1${C.reset}`);
      console.log(`  ${C.cyan}2.${C.reset} Or use a free cloud DB (Neon, Supabase, Railway).`);
      console.log(`\n  Then re-run:  ${C.cyan}npm run go${C.reset}\n`);
      process.exit(1);
    }
    log.warn(`Couldn't open a raw TCP connection to ${db.host}:${db.port}.`);
    log.warn("This often happens with serverless DBs (Neon scales to zero, takes a few seconds to wake up).");
    log.warn("Prisma will retry with proper TLS — continuing anyway.");
    log.info(`If migrations fail next, re-run with: ${C.cyan}npm run go -- --skip-db-check${C.reset}`);
    log.info(`Or wake Neon by opening: ${C.cyan}https://console.neon.tech${C.reset} → your project → SQL Editor → run \`SELECT 1\``);
  } else {
    log.ok(`Postgres is reachable at ${db.host}:${db.port}`);
  }
}

// 3) install deps
log.step(3, total, "Installing dependencies");
const markers = [
  join(ROOT, "node_modules", ".package-lock.json"),
  join(ROOT, "node_modules", "tailwindcss", "package.json"),
  join(ROOT, "node_modules", "@prisma", "client", "package.json"),
  join(ROOT, "node_modules", "next", "package.json"),
  join(ROOT, "node_modules", "express", "package.json"),
];
const fullyInstalled = markers.every((p) => existsSync(p));
if (SKIP_INSTALL) {
  log.info("--skip-install set; skipping.");
} else if (fullyInstalled && !FORCE_INSTALL) {
  log.info("Dependencies already present — skipping. Use --force-install to reinstall.");
} else {
  log.info("Running `npm install` (this can take a minute)...");
  const r = run("npm", ["install"]);
  if (r.code !== 0) { log.err("npm install failed."); process.exit(r.code); }
  const missing = markers.filter((p) => !existsSync(p));
  if (missing.length) {
    log.err(`Install reported success but some packages are missing:\n    ${missing.join("\n    ")}`);
    log.err("Try: remove node_modules + package-lock.json, then re-run with --force-install");
    process.exit(1);
  }
  log.ok("Dependencies installed");
}

// 4) migrations
log.step(4, total, "Running Prisma migrations");
if (db.host.includes("-pooler.")) {
  log.warn("Detected Neon connection pooler in DATABASE_URL.");
  log.warn("Migrations work better against the direct (non-pooled) endpoint.");
  log.warn("Tip: in Neon's dashboard, copy the connection string WITHOUT 'Pooled connection' toggled,");
  log.warn("     OR just remove '-pooler' from the hostname for now. We'll try anyway.");
}
log.info("Using `prisma db push` (faster than migrate dev for first-time setup)...");
let migrate = run("npx", ["prisma", "db", "push", "--accept-data-loss"], { cwd: join(ROOT, "server") });
if (migrate.code !== 0) {
  log.info("Retrying with `prisma migrate deploy`...");
  migrate = run("npx", ["prisma", "migrate", "deploy"], { cwd: join(ROOT, "server") });
}
if (migrate.code !== 0) {
  log.err("Failed to sync the database schema. Verify DATABASE_URL and user permissions.");
  if (db.host.includes("-pooler.")) {
    log.err("Likely cause: you're using Neon's pooled endpoint. Switch to the direct one for setup.");
  }
  process.exit(migrate.code);
}
log.ok("Database schema is up to date");

// 5) seed
log.step(5, total, "Seeding the database");
if (SKIP_SEED) {
  log.info("--skip-seed set; skipping.");
} else {
  const seed = run("npm", ["run", "db:seed", "--workspace=server"]);
  if (seed.code !== 0) {
    log.warn("Seed step failed — you can re-run with: npm run db:seed --workspace=server");
  } else {
    log.ok("Seed data loaded");
    console.log(`  ${C.dim}Admin: ${C.reset} admin@taskmanager.dev  /  Password123`);
    console.log(`  ${C.dim}Member:${C.reset} maya@taskmanager.dev   /  Password123`);
  }
}

if (NO_DEV) {
  console.log(`\n${C.green}${C.bold}✓ Setup complete.${C.reset} ${C.dim}Run \`npm run dev\` to start.${C.reset}\n`);
  process.exit(0);
}

// 6) dev servers
log.step(6, total, "Starting dev servers (Ctrl+C to stop)");
console.log(
  `  ${C.dim}Frontend:${C.reset} ${C.cyan}http://localhost:3000${C.reset}\n` +
    `  ${C.dim}API:${C.reset}      ${C.cyan}http://localhost:4000/api${C.reset}\n`,
);

const isWin = process.platform === "win32";
const dev = spawn("npm", ["run", "dev"], { cwd: ROOT, stdio: "inherit", shell: isWin });
dev.on("exit", (code) => process.exit(code ?? 0));
