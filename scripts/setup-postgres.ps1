# =====================================================
# Team Task Manager — local Postgres setup (Windows)
# Run after installing PostgreSQL 16 from enterprisedb.com
#
# Usage (PowerShell):
#   .\scripts\setup-postgres.ps1
#   .\scripts\setup-postgres.ps1 -SuperUserPassword "yourpass"
# =====================================================

param(
  [string]$SuperUser = "postgres",
  [string]$SuperUserPassword = "",
  [string]$AppUser = "ttm_user",
  [string]$AppPassword = "ttm_password",
  [string]$AppDatabase = "team_task_manager",
  [string]$PgHost = "localhost",
  [string]$PgPort = "5432"
)

$ErrorActionPreference = "Stop"

function Find-Psql {
  $candidates = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
  )
  foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

$psql = Find-Psql
if (-not $psql) {
  Write-Host "psql not found. Install PostgreSQL from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" -ForegroundColor Red
  exit 1
}
Write-Host "Using: $psql" -ForegroundColor DarkGray

if (-not $SuperUserPassword) {
  $sec = Read-Host "Enter your '$SuperUser' password (the one you set during PostgreSQL install)" -AsSecureString
  $SuperUserPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  )
}

$env:PGPASSWORD = $SuperUserPassword

Write-Host ""
Write-Host "==> Checking server connection..." -ForegroundColor Cyan
& $psql -h $PgHost -p $PgPort -U $SuperUser -d postgres -c "SELECT version();" *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Could not connect. Is PostgreSQL running?  Check the 'postgresql-x64-16' service in services.msc." -ForegroundColor Red
  exit 1
}
Write-Host "    Connected." -ForegroundColor Green

Write-Host ""
Write-Host "==> Creating role '$AppUser' (if missing)..." -ForegroundColor Cyan
$roleSql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AppUser') THEN
    CREATE ROLE $AppUser LOGIN PASSWORD '$AppPassword';
  ELSE
    ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';
  END IF;
END
`$`$;
"@
$roleSql | & $psql -h $PgHost -p $PgPort -U $SuperUser -d postgres -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "    Role ready." -ForegroundColor Green

Write-Host ""
Write-Host "==> Creating database '$AppDatabase' (if missing)..." -ForegroundColor Cyan
$dbExists = & $psql -h $PgHost -p $PgPort -U $SuperUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$AppDatabase'"
if ($dbExists.Trim() -ne "1") {
  & $psql -h $PgHost -p $PgPort -U $SuperUser -d postgres -c "CREATE DATABASE $AppDatabase OWNER $AppUser;"
  if ($LASTEXITCODE -ne 0) { exit 1 }
  Write-Host "    Database created." -ForegroundColor Green
} else {
  Write-Host "    Database already exists." -ForegroundColor Green
}

& $psql -h $PgHost -p $PgPort -U $SuperUser -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $AppDatabase TO $AppUser;" *> $null

Write-Host ""
Write-Host "==> Granting schema privileges..." -ForegroundColor Cyan
& $psql -h $PgHost -p $PgPort -U $SuperUser -d $AppDatabase -c "GRANT ALL ON SCHEMA public TO $AppUser; ALTER SCHEMA public OWNER TO $AppUser;" *> $null
Write-Host "    Done." -ForegroundColor Green

$dbUrl = "postgresql://$AppUser`:$AppPassword@$PgHost`:$PgPort/$AppDatabase`?schema=public"

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor Magenta
Write-Host "  All set!" -ForegroundColor Magenta
Write-Host "----------------------------------------------------------" -ForegroundColor Magenta
Write-Host "  DATABASE_URL=$dbUrl" -ForegroundColor White
Write-Host ""
Write-Host "  This value is already set in server/.env by default." -ForegroundColor DarkGray
Write-Host "  Next: run  npm run go" -ForegroundColor Cyan
Write-Host ""

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
