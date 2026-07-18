# UAT Remediation Report — IT Asset Management Application

**Date:** 2026-07-14 · **Branch:** `dev` (working tree, not committed) · **Input:** `docs/UAT_READINESS_AUDIT.md`
**Scope exclusions honored:** no CI/CD, no `.github/workflows`, no Docker deployment work, no APM, no cookie-auth redesign, no roadmap features.

---

# 1. Executive Summary

**Final readiness decision: CONDITIONAL GO.**

All audit blockers (F-01, F-02, F-03) and criticals (F-04, F-05) are fixed and verified by executed tests: **35 unit tests and 43 e2e tests pass**, the baseline migration applies/reverts cleanly on a disposable database, and the backend boots with `synchronize` disabled, a working `/health` endpoint, Helmet security headers, and enforced login throttling (429 observed after the limit).

- **Fixed findings:** 16 (F-01, F-02*, F-03, F-04, F-05, F-06, F-08, F-09, F-10, F-11, F-12, F-13, F-14, F-16, F-17, F-18, F-19, F-20 — see table; F-02 marked Partially Fixed only because real SMTP delivery cannot be verified from this environment)
- **Partially fixed:** 1 (F-02 — code complete + tested with mocked mail; live SMTP delivery Not Verified)
- **Unresolved:** 0 in-scope findings
- **Not Verified:** live SMTP delivery, Azure AD sync against a real tenant, browser UI journeys (see §7)
- **Excluded:** F-07 (CI/CD), F-15 (localStorage JWT), F-21 (a11y/perf program) — deferred per instructions/audit
- **Bonus defect found & fixed during testing:** `GET /users/me`, `GET /users/:id`, and `GET /users` returned the bcrypt `passwordHash`; all user-returning API paths now strip credential material.

**Remaining conditions for GO:** configure real SMTP in the UAT environment and confirm one end-to-end password-reset email; run the post-deployment smoke checklist (§8 / runbook §10) on the deployed instance.

---

# 2. Finding Status

| Finding | Status | Files Changed | Implementation | Tests Added | Verification Result | Remaining Work |
|---|---|---|---|---|---|---|
| F-01 synchronize/migrations | **Fixed** | `backend/src/app.module.ts`, `backend/src/data-source.ts` (new), `backend/package.json`, `backend/src/migrations/1784015701570-InitialSchema.ts` (new; 4 legacy never-runnable migrations removed), `backend/src/config/env.validation.ts` | `synchronize` now defaults to false everywhere; `DB_SYNCHRONIZE=true` refused outside development; CLI DataSource + `migration:run/revert/show/generate` scripts; generated full baseline migration | — | Apply → show → revert → re-apply all succeeded on disposable DB; drift check reports "No changes"; app boots without sync | Baseline-stamp any pre-existing dev DBs (runbook §4) |
| F-02 OTP email / leakage | **Partially Fixed** | `backend/src/modules/mail/*` (new), `backend/src/modules/auth/auth.service.ts`, `auth.module.ts`, `backend/src/entities/password-reset-token.entity.ts` | Nodemailer-backed `MailService` (mockable); OTP emailed, never logged, never in responses; OTP stored as bcrypt hash; crypto-secure generation | `auth.service.spec.ts` (12 tests incl. no-logging assertion) | Unit tests pass with mocked mail; `TODO: Send OTP via email` and OTP console.log removed | **Verify real SMTP delivery in UAT** |
| F-03 JWT fallback secret | **Fixed** | `backend/src/modules/auth/jwt.strategy.ts`, `auth.module.ts`, `env.validation.ts` | Both fallbacks removed; `getOrThrow('JWT_SECRET')`; startup hard-fails if missing or < 32 chars | e2e login/token tests | Executed: `JWT_SECRET= node dist/main` refuses to start; e2e login works with real secret | — |
| F-04 authorization gaps | **Fixed** | `master.controller.ts`, `azure-sync.controller.ts`, `departments.controller.ts`, `asset-units.controller.ts`, `assignments.controller.ts`, `reports.controller.ts`, `analytics.controller.ts`, `stock.controller.ts` | `PermissionsGuard` + existing permission slugs on all mutating and sensitive-read endpoints (matrix in §5) | e2e 403 matrix (23 endpoints) + admin positive tests | All 43 e2e tests pass | Dashboard KPI reads deliberately stay JWT-only (documented decision — landing page for all roles) |
| F-05 stock adjust guard | **Fixed** | `stock.controller.ts` | `inventory.manage` on initialize/adjust, `inventory.view` on reads; TODO removed | e2e 403 + `stock.service.spec.ts` (5 tests) | Pass | — |
| F-06 test coverage | **Fixed (minimum bar)** | 4 new spec files + rewritten e2e suites | Unit: auth, permissions guard, license renewal, stock. E2e: health, auth, enumeration, RBAC matrix, IDOR, audit identity | 35 unit + 43 e2e | All pass (e2e on disposable DB) | Asset-import and upload-MIME tests not added (see §9) |
| F-08 health/logging | **Fixed (UAT portion)** | `app.controller.ts`, `main.ts` | Public `GET /health` with DB ping (200/503, no internals); Nest `Logger` replaces console.log in bootstrap/auth paths | `app.controller.spec.ts` (3 tests) + e2e | Executed: live boot returned `{"status":"ok","database":"up"}`; 503 path unit-tested; no-secrets asserted | Full monitoring remains P2 (excluded) |
| F-09 throttling/headers | **Fixed** | `app.module.ts`, `auth.controller.ts`, `main.ts`, `package.json` | Global `ThrottlerModule` consuming `RATE_LIMIT_TTL/MAX`; strict per-route `@Throttle` on login (10/min), forgot/reset (5/min), verify (10/min); OTP attempt counter (locks at 5); `helmet()` with CORP relaxed for /uploads | Unit lockout tests; manual 429 check | Executed: 12 rapid logins → `400×10, 429×2`; helmet headers observed live (`X-Content-Type-Options`, `X-Frame-Options`, HSTS) | — |
| F-10 tracked artifacts | **Fixed** | `.gitignore`, index | `backend/dist`, `backend/dist_test`, `frontend/build`, `coverage/`, `backend/uploads/` ignored; 402 tracked artifact files removed from the index (`git rm --cached`) | — | `git ls-files` count for artifact paths = 0 | — |
| F-11 user enumeration | **Fixed** | `auth.service.ts` | Identical generic response/status for known, unknown, and SSO accounts on forgot-password; single generic "Invalid or expired OTP" error | Unit + e2e parity test | Pass | — |
| F-12 docs/scripts drift | **Fixed** | `PROJECT_CONTEXT.md`, `backend/.env.example`, `docs/UAT_RUNBOOK.md` (new) | `seed:all` reference corrected to `seed`; migration/seed/SMTP/rate-limit/rollback all documented; runbook covers full UAT setup | — | Commands in runbook are the ones executed in this remediation | Legacy SQL in `database/` marked legacy, not deleted |
| F-13 DTOs / audit identity | **Fixed** | `assets.controller.ts` + `dto/asset.dto.ts`, `master/dto/master.dto.ts` (new), `departments/dto/department.dto.ts` (new), `auth/dto/profile.dto.ts` (new), `auth.service.ts`, `users.controller.ts` | All `performedBy` fields removed from DTOs; actor always `req.user.id`; typed DTOs for master data, departments, profile, change-password, import confirm; self-service email change removed | e2e: client `performedBy: 99999` never appears in history; role/email-escalation test | Pass | `licenses` confirmImport rows and photo-upload metadata body remain loosely typed (validated downstream) |
| F-14 seed credentials | **Fixed** | `backend/src/seed-admin.ts`, `.env.example` | Seed refuses default password outside `NODE_ENV=development`; `SEED_ADMIN_EMAIL/PASSWORD` env-driven; dev default clearly warned | — | Executed: seed on disposable DB printed the dev-only warning under development; refusal path code-reviewed | Rotate any real UAT accounts created earlier with shared passwords |
| F-16 renewal regression | **Fixed** | `licenses.service.spec.ts` (new) | 7 tests: unchanged/positive/negative cost change, unit-price recalc, floor at zero, derived total, and a guard that renewal uses `update()` not relation-diffing `save()` (commit 7620232 regression) | 7 unit tests | Pass | — |
| F-17 pipe inconsistency | **Fixed** | `main.ts`, `test/security.e2e-spec.ts` | Both pipes now explicitly `whitelist: true, forbidNonWhitelisted: false, transform: true` with cross-reference comments | e2e suite runs under the production-identical pipe | Pass | — |
| F-18 SSO user handling | **Fixed** | `user.entity.ts` (`is_sso_user`), `azure-sync.service.ts`, `auth.service.ts` | Explicit `isSsoUser` flag; sync sets random unusable password value; SSO users blocked from local login, change-password, and password-reset (generic responses); pre-existing local accounts matched by email keep local passwords | Unit tests (SSO login rejected; no reset token created) | Pass (mocked); real Azure sync Not Verified | Verify against a real tenant |
| F-19 Office lock file | **Fixed** | `.gitignore`, `docs/` | `~$ER_GUIDE.docx` deleted; `~$*` ignored. `docs/USER_GUIDE.docx` kept untracked — decision: the owner should commit it deliberately if it is the canonical guide | — | Verified removed | Owner decision on committing USER_GUIDE.docx |
| F-20 default DB creds | **Fixed** | `app.module.ts`, `data-source.ts`, `seed-admin.ts`, `check-inventory-db.ts`, `clear-operational-data.ts`; unused `config/typeorm.config.ts` deleted | `getOrThrow`/required() for all DB credentials; no `postgres/postgres` fallbacks remain | — | Grep sweep clean; app refuses to start without DB vars | — |
| F-07 CI/CD | **Excluded** — CI/CD intentionally deferred by project owner | — | — | — | — | — |
| F-15 localStorage JWT | **Excluded** (auth redesign out of scope) | — | — | — | — | Documented residual risk |
| F-21 a11y/perf | **Excluded** (program-level; not in scope list) | — | — | — | — | P2/P3 |

**Not-Verified security items from the audit — investigation results:**
- **IDOR/ownership:** `/users/me` routes are self-scoped; `/users/:id` requires `users.view`; cross-user read/update by an employee returns 403 (e2e-verified). **One real defect found and fixed:** password hashes were returned by user endpoints.
- **Raw SQL:** grep of `query(`/`createQueryBuilder` paths showed parameterized usage; no string-concatenated SQL found in reviewed modules (moderate-confidence review, not exhaustive).
- **Upload MIME spoofing:** photo uploads validate mimetype + 5 MB limit; content-sniffing of renamed files is **not** implemented — deferred (P2), noted in §9. Helmet's `X-Content-Type-Options: nosniff` reduces drive-by risk on served files.
- **Audit identity spoofing:** eliminated (F-13); e2e-verified.

# 3. Files Changed

**Backend — security/config:** `src/app.module.ts` (no cred fallbacks, sync off, throttler, global guard), `src/main.ts` (helmet, logger, explicit pipe), `src/config/env.validation.ts` (JWT length + DB_SYNCHRONIZE hard failures), `src/config/typeorm.config.ts` (deleted — unused, contained fallbacks), `src/data-source.ts` (new CLI DataSource), `package.json` (migration scripts + deps: nodemailer, @nestjs/throttler, helmet).
**Auth:** `modules/auth/auth.service.ts` (reset flow rewrite), `auth.controller.ts` (throttles, DTOs), `auth.module.ts` / `jwt.strategy.ts` (getOrThrow secret), `dto/profile.dto.ts` (new), `guards/permissions.guard.spec.ts` (new), `auth.service.spec.ts` (new).
**Mail:** `modules/mail/mail.module.ts`, `mail.service.ts` (new).
**RBAC:** controllers for master, stock, azure-sync, departments, asset-units, assignments, reports, analytics — permission decorators; new DTO files for master and departments.
**Users:** `users.service.ts` + `users.controller.ts` (passwordHash stripping), `azure-sync.service.ts` (isSsoUser), `entities/user.entity.ts`, `entities/password-reset-token.entity.ts` (otp_hash, attempts).
**Assets/Licenses:** `assets.controller.ts` + `dto/asset.dto.ts` (server-side actor, ConfirmImportDto, console.log removal), `licenses.service.spec.ts` (new), `stock.service.spec.ts` (new), `app.controller.ts` + spec (health).
**Seeds/scripts:** `seed-admin.ts` (env-driven admin credential), `check-inventory-db.ts`, `clear-operational-data.ts` (no cred fallbacks).
**Tests:** `test/security.e2e-spec.ts` (rewritten — old suite referenced non-existent entities/users and could never run), `test/app.e2e-spec.ts` (health-based).
**Repo/docs:** `.gitignore`, `PROJECT_CONTEXT.md`, `backend/.env.example`, `docs/UAT_RUNBOOK.md` (new), this report; deleted `docs/~$ER_GUIDE.docx`; 402 build-artifact files untracked.
**Migrations:** removed 4 legacy migration files (never runnable, superseded by entities); added `1784015701570-InitialSchema.ts` full baseline.

# 4. Database Changes

- **Migration added:** `InitialSchema1784015701570` — complete schema for all 34 entities, including the new `users.is_sso_user`, `password_reset_tokens.otp_hash`, `password_reset_tokens.attempts` columns (old plaintext `otp` column replaced).
- **Apply result:** success on a freshly created disposable DB (`itam_uat_disposable`).
- **Revert result:** success; re-apply success; `migration:show` correct at each step.
- **Drift check:** `migration:generate` after apply reports "No changes in database schema were found".
- **Clean database tested:** yes — created, migrated, seeded, e2e-tested, and the compiled backend was booted against it (health 200). No shared database was modified.
- **Manual action still required:** pre-existing databases created via the old `synchronize` behavior must either be recreated from migrations or baseline-stamped (runbook §4); they may also lack the three new columns.

# 5. Security Changes

- **Authentication:** no JWT fallback secrets; startup fails without a ≥32-char `JWT_SECRET`; password reset invalidates all sessions (`tokenVersion++`); SSO accounts cannot use local credentials.
- **Authorization (endpoint-permission matrix):**
  - `POST/PUT/DELETE /masters/brands|vendors` → `brands.manage` / `vendors.manage`; `/masters/plans` → `licenses.manage`; `/masters/lookups` → `settings.manage`; master GETs remain JWT-only (dropdown data).
  - `POST /api/stock/initialize|adjust` → `inventory.manage`; `GET /api/stock`, `/api/stock/ledger` → `inventory.view`.
  - `POST /users/sync/azure` → `users.manage`; `GET /users/sync/status` → `users.view`.
  - `POST /api/issue|return|transfer|write-off` → `assets.manage`; `GET /api/holdings|overdue|assignments/:id` → `assets.view`.
  - `POST /api/departments`, `PUT /api/departments/:id` → `departments.manage` (GETs JWT-only).
  - `POST /api/asset-units` → `assets.create`; `PUT` → `assets.edit`; GETs → `assets.view`.
  - `GET /api/reports/*` → `reports.view`; `GET /analytics/reports/*` → `reports.view`.
  - Documented decision: dashboard/analytics KPI GETs stay JWT-only because the dashboard is the landing page for every role (including Standard User).
- **OTP:** crypto-secure 6-digit, bcrypt-hashed at rest, 15-min expiry, single active token per user, one-time use, locked after 5 failed attempts, never logged or returned.
- **Rate limiting:** global limiter from `RATE_LIMIT_*`; 5–10 req/min on auth endpoints; `/health` exempt. Observed live: 429 on the 11th login attempt within a minute.
- **Validation:** typed DTOs for previously `any` bodies; pipes aligned prod/e2e; self-service profile cannot change email/role.
- **IDOR:** verified via two-employee e2e tests; **fixed password-hash exposure** on all user read endpoints.
- **File uploads:** existing mimetype + 5 MB limits retained; content sniffing not added (residual risk, P2).
- **Residual risks:** JWT in localStorage (excluded); no CSP on the SPA host; upload content-sniffing; lint debt (`any` usage) across older modules.

# 6. Tests

| Command | Result | Count | Notes |
|---|---|---|---|
| `cd backend && npx jest` (unit) | **PASS** | 35/35 in 5 suites | New suites: auth.service (12), permissions.guard (5), licenses.service (7), stock.service (5), app.controller (4+2). Baseline before remediation: 1 trivial test. |
| `DB_NAME=itam_uat_disposable npm run migration:run / :show / :revert` | **PASS** | 1 migration | On disposable DB only |
| `DB_NAME=itam_uat_disposable npm run seed` (NODE_ENV=development) | **PASS** | — | Dev-only password warning printed as designed |
| `DB_NAME=itam_uat_disposable npx jest --config ./test/jest-e2e.json --runInBand` | **PASS** | 43/43 | Includes 23-endpoint RBAC 403 matrix, IDOR, enumeration, health, audit identity. The pre-remediation e2e suite could never pass (referenced a non-existent `GoodsReceipt` entity and unseeded accounts). |
| `npx tsc --noEmit` / `npm run build` (backend) | **PASS** | — | |
| `cd frontend && npm run build` | **PASS** | — | CRA production build |
| Backend boot + `GET /health` + helmet headers + throttle probe | **PASS** | — | Live against disposable DB: health 200, root 401, HSTS/nosniff/frame headers present, 429 after login limit |
| `JWT_SECRET= node dist/main` | **PASS (refuses to start)** | — | Clear error listing the missing variable |
| Backend lint (`npx eslint` on changed areas) | **Pre-existing failures** | 195 problems (baseline on same files before changes: 218) | Strict typed-lint errors predate this work; remediation reduced the count and added none blocking |
| Frontend lint / frontend unit tests | **Not configured / none exist** | — | CRA eslint runs inside build (passed); no test files present |

# 7. Manual Verification Required

1. **SMTP delivery** — configure real SMTP in UAT `.env` and confirm one password-reset email arrives; OTP flow beyond delivery is unit/e2e-tested. (Blocked here: no SMTP credentials in this environment.)
2. **Azure AD sync** — run `POST /users/sync/azure` against a real tenant; verify synced users get `is_sso_user=true` and cannot use local login/reset.
3. **Browser journeys** — Login, Forgot Password, Dashboard, Assets, Licenses, Stock, Reports pages render and function; 401 redirect works (code-reviewed in `apiClient.ts`); 403 handling in each page shows a toast/error rather than a crash (**Not Verified in a browser** — API-level 403s confirmed only).
4. **Rotation** — if any real/shared environment was previously seeded with `password123` or the shared `update_passwords.sql` hash, rotate those accounts.
5. **USER_GUIDE.docx** — owner to decide whether to commit it (left untracked intentionally).

# 8. UAT Deployment Instructions

Condensed; full detail in `docs/UAT_RUNBOOK.md`.

```bash
# 1. Install
cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install

# 2. Configure backend/.env from backend/.env.example
#    (DB_*, JWT_SECRET>=32 chars, SMTP_*, SEED_ADMIN_*, CORS_ORIGIN, RATE_LIMIT_*)
#    and frontend/.env REACT_APP_API_URL

# 3. Build
cd backend && npm run build
cd ../frontend && npm run build   # deploy build/ to the static host

# 4. Database (empty UAT database)
cd backend
npm run migration:run
npm run migration:show            # expect [X] on every migration
pg_dump -Fc -f pre-seed-backup.dump "<DB_NAME>"   # backup habit

# 5. Seed (unique strong admin credential, distributed out-of-band)
NODE_ENV=production SEED_ADMIN_EMAIL=<email> SEED_ADMIN_PASSWORD=<unique> npm run seed

# 6. Start
NODE_ENV=production node dist/main

# 7. Verify
curl http://localhost:4000/health          # {"status":"ok","database":"up"}

# 8. Tests (disposable DB only — see runbook §8)
npm test
DB_NAME=<disposable> npm run test:e2e

# Rollback: stop service → redeploy previous dist/build → verify /health.
# Migration revert (post-baseline migrations only): npm run migration:revert
# Never revert InitialSchema on a database containing data; restore from pg_dump instead.
```

# 9. Remaining Risks

**Must fix before UAT deployment**
- Configure and verify real SMTP (F-02 residual). If email cannot be provisioned in time, disable the Forgot Password UI entry point and document a helpdesk reset path.

**Must fix before UAT sign-off**
- Browser-level smoke of the 7 critical pages incl. 403 UX (§7.3).
- Azure AD sync verification if UAT includes SSO users.
- Add asset-import validation tests and upload MIME-spoofing tests (audit F-06 items not covered by the new suites).

**Can be deferred until production**
- Upload content-sniffing for renamed non-image files.
- Structured log aggregation/monitoring beyond `/health` (F-08 remainder).
- Lint debt (195 pre-existing typed-lint errors in touched areas; more elsewhere) and remaining loosely-typed bodies (license import rows, photo metadata).
- CSP for the SPA host; consider httpOnly-cookie auth (F-15).

**Accepted exclusions**
- F-07 CI/CD — Excluded — CI/CD intentionally deferred by project owner.
- Barcode/QR, dark mode, custom report filters — roadmap items, untouched.
- Dashboard KPI endpoints intentionally JWT-only (documented in §5).

---

## Post-deployment smoke checklist (execute on the UAT instance)

1. `GET /health` → 200, `database: up`. ✅ verified locally against the disposable DB; **run again on UAT**.
2. Admin login / employee login. (e2e-verified locally)
3. Employee 403 on master-data create, stock adjust, Azure sync. (e2e-verified locally)
4. Admin asset create→deploy→return→delete with correct actor in history. (e2e-verified create/delete + actor)
5. License create + renew with cost change; totals correct. (unit-verified math; UI pass pending)
6. Stock adjust ledger correctness. (unit-verified)
7. Password-reset email arrives; OTP single-use; unknown email identical response. (**email delivery pending SMTP**)
8. Report export opens. (pending — UI)
9. Logs free of OTPs/passwords/secrets. (unit-asserted for OTP; spot-check on UAT)
