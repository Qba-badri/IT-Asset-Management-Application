# UAT Readiness Audit — IT Asset Management Application

**Revision 2** · **Date:** 2026-07-15 · **Branch:** `dev` · **Auditor:** Automated technical audit (Claude Code)
**Supersedes:** Revision 1 (2026-07-14, verdict NO-GO) — remediation tracked in [UAT_REMEDIATION_REPORT.md](UAT_REMEDIATION_REPORT.md).
**Method:** Static review of the full working tree, verification greps against every Rev-1 finding, and **executed** checks: backend typecheck, 206 backend unit tests, 43 e2e tests against a migration-built disposable Postgres DB, migration drift check, frontend production build, and 141 frontend tests.

---

## 1. Executive Summary

Since Revision 1, all three Blockers and both Criticals have been remediated and are verified closed by test execution, and the codebase has grown substantially (notifications engine, currency rates, integration settings with masked secrets, permission-tier dashboard scoping, `@Observe` validation rollout, status management). The safety net is now real: **206 backend unit tests (20 suites), 43 e2e security/RBAC tests, and 141 frontend tests — all passing** — plus a migration-managed schema verified from a clean database.

**Verdict: CONDITIONAL GO.** No code-level blockers remain. The conditions are operational, not engineering: SMTP must be configured and one real reset email verified in the UAT environment, UAT accounts must be provisioned per the runbook (with `SEED_ADMIN_PASSWORD` set), and a browser smoke pass of the critical journeys must be completed on the deployed instance. CI/CD remains intentionally deferred by the project owner.

---

## 2. UAT Readiness Decision

**CONDITIONAL GO.** Conditions before opening UAT to testers:

1. **C-1** Configure SMTP in the UAT environment (Settings → Integrations or `SMTP_*` env vars) and verify one real password-reset email end-to-end. *(Email delivery is mocked in tests — never verified against a live relay.)*
2. **C-2** Provision UAT accounts per [UAT_RUNBOOK.md](UAT_RUNBOOK.md): set `SEED_ADMIN_PASSWORD`/`SEED_ADMIN_EMAIL`, distribute per-tester credentials out-of-band.
3. **C-3** Execute the browser smoke checklist (§8) on the deployed UAT instance — automated coverage exercises the API, not the rendered UI.
4. **C-4** If Azure AD sync will be used in UAT, run `POST /users/sync/azure/test` with UAT credentials first. *(Graph API behavior is not covered by automated tests.)*

---

## 3. Rev-1 Finding Closure Status (all verified against the current tree)

| Rev-1 finding | Status | Evidence (executed unless noted) |
|---|---|---|
| F-01 synchronize:true / no migrations | **Closed** | Grep: no `synchronize: true` outside dev opt-in; 7 migrations applied to clean DB; drift check ran (see N-1) |
| F-02 OTP not emailed, logged to console | **Closed** | Grep: no OTP logging; MailService + templates; 4 unit tests assert OTP never logged/returned |
| F-03 hard-coded JWT fallback | **Closed** | Grep: no `your-secret-key…`; `getOrThrow('JWT_SECRET')` in module + strategy |
| F-04/F-05 missing authorization | **Closed** | 0 controllers without `PermissionsGuard` except by-design (health, auth, schema read, scoped dashboard); 43 e2e tests incl. 23-case employee-403 matrix pass |
| F-06 no test coverage | **Closed** | 206 backend unit + 43 e2e + 141 frontend tests, all executed and passing |
| F-08 no health endpoint/logging | **Closed** | `GET /health` (DB ping) verified 200 in e2e; Nest Logger throughout; no `console.log` in modules |
| F-09 no throttling/helmet, OTP brute force | **Closed** | ThrottlerModule global + strict `@Throttle` on auth routes; helmet in main.ts; OTP attempt-lockout unit-tested |
| F-10 tracked build artifacts | **Closed** (this revision) | `backend/dist_test` untracked today; `git ls-files` now shows 0 build artifacts |
| F-11 user enumeration | **Closed** | e2e asserts identical response for known/unknown emails |
| F-12 docs/setup drift | **Closed** | UAT_RUNBOOK.md, migration scripts exist and were exercised |
| F-13 `any` DTOs / client `performedBy` | **Closed** | Grep: no `performedBy` in DTOs; typed DTOs on former `any` endpoints; e2e asserts audit identity comes from JWT |
| F-14 shared seed credentials | **Closed** | Seed refuses default password outside `NODE_ENV=development` (observed during seeding today) |
| F-16 license renewal regressions | **Closed** | 7 renewal unit tests incl. the relation-diffing 500 regression guard |
| F-17 ValidationPipe inconsistency | **Closed** | e2e pipe mirrors production pipe (verified in spec) |
| F-18 Azure placeholder password hash | **Closed** | `isSsoUser` flag; SSO users blocked from local login/reset (unit-tested); runtime Azure sync **Not Verified** (no tenant) |
| F-19 Office lock files | **Closed** | `~$*` ignored |
| F-20 default DB credentials | **Closed** | `getOrThrow` for all DB vars; unused legacy config deleted |
| F-07 CI/CD | **Excluded** | Intentionally deferred by project owner |
| F-15 JWT in localStorage | **Accepted for UAT** | Unchanged by design; revisit before production |
| F-21 a11y/perf testing | **Open (P2)** | Still no axe/Lighthouse/load tooling |

## 4. New Findings (surface added since Rev 1)

| ID | Sev | Finding | Location | Recommendation |
|---|---|---|---|---|
| N-1 | Low | Migration↔entity drift: `users.department_id` FK is `ON DELETE SET NULL` in migration `1784900000000` but the entity omits `onDelete`, and two constraint/index names differ from TypeORM defaults, so `migration:generate` always emits a cosmetic diff | `backend/src/entities/user.entity.ts` vs migrations | Add `onDelete: 'SET NULL'` to the entity relation and name the constraints explicitly, or accept and document; behavior today is correct — SET NULL is the safer runtime rule |
| N-2 | Info | Dashboard endpoints are JWT-only at the guard level by design; data restriction is enforced inside services via permission-tier scoping (`dashboard.view.all` / `.department` / self) | [backend/src/common/dashboard-scope.ts](../backend/src/common/dashboard-scope.ts) | None — verified pattern; keep new dashboard endpoints going through `resolveScope` |
| N-3 | Info | Integration secrets (Azure client secret, SMTP password) now live in `integration_settings` with `is_secret` masking in the admin listing | `backend/src/modules/settings/integration-settings.service.ts:94` | Values are stored plaintext in the DB — acceptable for UAT; consider at-rest encryption before production |
| N-4 | Info | `@Observe` validation rules record-not-reject until reviewed (`VALIDATION_ENFORCE_OBSERVED` flips them) | `backend/src/common/validation/` | Review `validation_observations` during UAT and enforce before production |

## 5. Evidence — commands executed today (all passing)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | clean |
| Backend unit tests | `npx jest` | **20 suites, 206 tests, 0 failures** |
| Clean-DB migrations | `DB_NAME=itam_uat_disposable npm run migration:run` | 7 migrations applied |
| Drift check | `migration:generate` on migrated DB | cosmetic-only diff (N-1) |
| Seed | `npm run seed` (disposable DB) | idempotent, refused-default warning shown |
| e2e security/RBAC | `npm run test:e2e` (disposable DB) | **2 suites, 43 tests, 0 failures** |
| Frontend build | `npx react-scripts build` | success |
| Frontend tests | `CI=true npx react-scripts test` | **10 suites, 141 tests, 0 failures** |
| Legacy-finding greps | see §3 | 0 hits on all Rev-1 patterns |

**Not Verified (requires environment):** live SMTP delivery; Azure AD Graph sync against a real tenant; browser rendering of the SPA (build+component tests only); load/performance; accessibility.

## 6. Security Posture Summary

Auth: JWT (no fallback secret, fail-fast startup), bcrypt(10), token-version session invalidation, SSO-account isolation. Password reset: hashed OTP, 15-min expiry, 5-attempt lockout, single-use, enumeration-safe, email-only delivery. Transport/API: helmet headers, CORS allow-list, global + per-route throttling, whitelist ValidationPipe, typed DTOs on all mutating endpoints, server-derived audit identity. Authorization: PermissionsGuard on every restricted endpoint (e2e-verified 403 matrix), permission-tier data scoping on dashboards/assets/licenses, `passwordHash` stripped from all user-facing responses. Residual (accepted for UAT): localStorage tokens, plaintext integration secrets at rest, no CSP on the SPA host.

## 7. Remaining Work After UAT Entry

- **Before UAT sign-off:** review `@Observe` observations and enforce (N-4); monitor UAT logs for throttling false-positives.
- **Before production:** F-15 token storage strategy; N-3 secret-at-rest encryption; N-1 drift cleanup; a11y/perf passes (F-21); penetration test; CI/CD (currently excluded by owner decision).

## 8. Post-Deployment Smoke Checklist (run on the UAT instance)

1. `GET /health` → 200 `{status:ok, database:up}`.
2. Admin and employee can log in; employee gets 403 on `POST /masters/brands` and `POST /api/stock/adjust`.
3. Forgot-password: real email arrives; OTP works once, fails on reuse; unknown email gets the identical response.
4. Asset create → deploy → return → delete; history shows the correct authenticated actor.
5. License create → renew with cost change; total cost and unit price correct.
6. Stock adjust as admin → ledger entry matches; dashboard KPIs load for all three scope tiers.
7. Report export opens; notification (low-stock or expiry) fires and is logged.
8. Server logs contain no OTPs, passwords, secrets, or unexpected errors.
