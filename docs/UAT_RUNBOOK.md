# UAT Runbook — IT Asset Management Application

Everything needed to install, deploy, verify, and roll back the application for UAT.
Last updated: 2026-07-14 (post-remediation, see `docs/UAT_REMEDIATION_REPORT.md`).

---

## 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with a dedicated, **empty** database for UAT
- An SMTP account for outgoing password-reset emails
- (Optional) Azure AD app registration for user sync

## 2. Environment configuration

Copy `backend/.env.example` to `backend/.env` and set every value. Key rules:

| Variable | Rule |
|---|---|
| `DB_HOST/PORT/USERNAME/PASSWORD/NAME` | Required; the app refuses to start without them. No defaults exist. |
| `DB_SYNCHRONIZE` | Leave `false`. `true` is rejected unless `NODE_ENV=development`. |
| `JWT_SECRET` | Required, ≥ 32 chars. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRATION` | Token lifetime, e.g. `8h` for UAT. |
| `SMTP_HOST/PORT/SECURE/USER/PASSWORD`, `EMAIL_FROM` | Required for password reset emails. If `SMTP_HOST` is unset, email is disabled and a warning is logged at startup. |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` | Global rate limit window (seconds) and request cap per IP. Auth endpoints additionally enforce 5–10 requests/minute. |
| `CORS_ORIGIN` | Comma-separated list of allowed SPA origins. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Required by `npm run seed` outside development. Use a unique strong password; distribute out-of-band. |

Frontend: set `REACT_APP_API_URL` in `frontend/.env` to the backend URL.

**Never commit `.env` files.** They are git-ignored.

## 3. Install and build

```bash
# backend
cd backend
npm install --legacy-peer-deps
npm run build            # outputs dist/

# frontend
cd ../frontend
npm install
npm run build            # outputs build/ for static hosting
```

## 4. Database setup (migrations, not synchronize)

```bash
cd backend
npm run migration:run    # applies all migrations to DB_NAME from .env
npm run migration:show   # verify: every migration shows [X]
```

- The schema is created exclusively by TypeORM migrations in `backend/src/migrations/`.
- `database/init.sql` and the loose SQL scripts under `database/` are legacy; do **not** run them for a new environment.
- To generate a new migration after entity changes:
  `npm run migration:generate src/migrations/<Name>`
- **Existing development databases** that were created by the old `synchronize: true`
  behavior already contain the schema. Baseline them once instead of re-running
  the initial migration:
  ```sql
  CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, timestamp bigint NOT NULL, name varchar NOT NULL);
  INSERT INTO migrations ("timestamp", name) VALUES (1784015701570, 'InitialSchema1784015701570');
  ```
  (Adjust to the actual migration timestamps present in `src/migrations/`.)
  Note: such databases may lack the newest columns (`users.is_sso_user`,
  `password_reset_tokens.otp_hash` / `attempts`); for dev DBs the simplest path
  is to recreate the DB from migrations, or set `DB_SYNCHRONIZE=true`
  (development only) for one boot.

## 5. Seeding UAT safely

```bash
cd backend
NODE_ENV=production SEED_ADMIN_EMAIL=<uat-admin-email> SEED_ADMIN_PASSWORD=<unique-strong-password> npm run seed
```

- Seeds permissions, roles (Admin, IT, IT Helpdesk, Manager, Auditor, Standard User), master data, and one admin account.
- The seed **refuses to run** with a default password outside `NODE_ENV=development`.
- Create additional UAT tester accounts via the Admin UI (User Management) with per-user credentials. Do not share one account.
- Never print or email generated passwords through shared channels.

## 6. Start the services

```bash
# backend (from backend/)
NODE_ENV=production node dist/main   # or: npm run start:prod

# frontend: serve frontend/build/ from any static host (nginx, IIS, serve)
```

## 7. Health check

- `GET http://<backend-host>:<PORT>/health` → `200 {"status":"ok","database":"up"}`
- Returns `503` if the database is unreachable. No credentials or internals are exposed.
- Point the UAT uptime monitor at this endpoint.

## 8. Running tests

```bash
cd backend
npm test                 # unit tests (no database needed)

# e2e tests — DISPOSABLE database only, never a shared one:
#   1. createdb itam_uat_disposable   (or CREATE DATABASE via psql)
#   2. DB_NAME=itam_uat_disposable npm run migration:run
#   3. DB_NAME=itam_uat_disposable NODE_ENV=development npm run seed
#   4. DB_NAME=itam_uat_disposable npm run test:e2e
```

Frontend: `cd frontend && npm run build` must pass; there are no frontend unit tests yet.

## 9. Rollback procedures

**Application rollback** (code-level issue):
1. Stop the backend service.
2. Redeploy the previous known-good build of `backend/dist` and `frontend/build` (keep the two prior releases on the host).
3. Start the backend; verify `GET /health` and login.

**Migration rollback** (only for a migration added after the baseline):
```bash
cd backend
npm run migration:revert   # reverts the single most recent migration
npm run migration:show     # confirm the state
```
Do **not** revert the baseline `InitialSchema` migration on a database containing data — it drops the schema. Take a `pg_dump` backup before every migration run:
```bash
pg_dump -Fc -f uat-backup-$(date +%Y%m%d).dump "<DB_NAME>"
```
Restore with `pg_restore --clean --if-exists -d <DB_NAME> <file>`.

## 10. Post-deployment smoke tests

1. `GET /health` returns 200 with `database: up`.
2. Admin can log in; employee (Standard User) can log in.
3. Employee gets **403** on `POST /masters/brands`, `POST /api/stock/adjust`, and `POST /users/sync/azure`.
4. Admin creates → deploys → returns → deletes an asset; asset history shows the admin as the actor.
5. Admin creates and renews a license with a cost change; total cost and unit price update correctly.
6. Admin adjusts stock; ledger entry shows the correct change and running balance.
7. Forgot-password sends an email; the OTP works once and is rejected on reuse; an unknown email gets the same response.
8. A report export (Excel/PDF) opens.
9. Server logs contain no OTPs, passwords, or unexpected stack traces.

## 11. Support notes

- Backend logs go to stdout — capture them with your process manager (pm2, systemd, NSSM on Windows) and retain for the UAT period.
- Auth endpoints are rate-limited; repeated 429s from one tester usually mean scripted retries, not an outage.
- SSO-synced users (Azure AD) cannot log in with a local password or use the local password-reset flow by design.
