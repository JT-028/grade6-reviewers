# MASON M1 REPORT v1.0

Date: 2026-10-23 (Asia/Manila). Project: Grade 6 Reviewers.

**Status: COMPLETE for local M1 implementation; live integration and release pending.**
Ready for Luna review. No commit, push, remote migration/function deployment, Auth
account creation, remote settings change or public activation was performed.

## What changed

- Added self-contained `family.html`: parent password sign-in and refresh, child
  creation/edit/archive/PIN reset, parent device approval/revocation, approved
  profile roster, online child PIN unlock/lock, browser session/IndexedDB storage,
  inactivity/cross-tab locking, and private access revalidation when returning.
- Implemented the M1 Supabase Edge API and service-only transactional Postgres
  dispatcher: owner allowlisting, scoped hashed device/child tokens, salted and
  peppered PBKDF2 PINs, pre-derivation throttles, expiring pairing, encrypted claim
  and mutation receipts, retry/conflict checks, revocation and PIN-version checks.
- Added a Family progress link to the hub and each of the eight reviewers. Each
  reviewer diff is exactly one added footer link; lesson content, scoring,
  constants, unlocks, grades, guest localStorage and published filenames are unchanged.

`FAMILY_ENABLED` remains **false**. The UI says private access is unavailable and
links to the public reviewers. The child's enabled M1 view explicitly says study
history is not yet available and reviewers do not yet record to the family profile.
No fake grades or study totals are displayed. M2–M5 remain unimplemented.

## Checklist / definitions of done

| Item | Local evidence | Live status |
|---|---|---|
| 1.1 Free-tier service configuration | Existing public project URL/publishable key configured; safe-disabled HTML, local Supabase config and ignored env template | Project exists; no parent/account/API/migration provisioning yet |
| 1.2 Parent authentication | Official SDK verifies each parent JWT; SQL allowlists provisioned owner; browser login/refresh/management works against synthetic fixture | Needs confirmed parent and singleton UID binding |
| 1.3 Approved device and child PIN | Expiring pair/claim retry, scoped roster, server PIN derivation/throttling, eight-hour session, 90-day device approval; fixture flow exercised | Needs real hosted end-to-end test |
| 1.4 Ownership/private boundary | RLS/non-exposed private schema, revoked browser grants, service-only RPC; owner/sibling/device/revocation/replay tests pass | Real pgcrypto and hosted Auth/Edge still unverified |
| 1.5 Public reviewer access | Nine additive entry links; original guest lesson/scoring behavior retained; disabled private actions verified in BrowserOS | Live site unchanged |

## Files produced

Client:

- `family.html` — self-contained private family entry and access management.
- `index.html` and all eight existing reviewer HTMLs — one Family progress link each.

Backend/config:

- `supabase/config.toml` — local private Auth defaults and explicit Edge gateway setting.
- `supabase/functions/family-api/index.ts` — bounded validation, route auth, CORS, safe errors.
- `supabase/functions/family-api/auth.ts` — official SDK user verification and service-only dispatcher wrapper.
- `supabase/functions/family-api/crypto.ts` — random tokens, PIN derivation, digest/constant-time compare.
- `supabase/functions/family-api/validation.ts` — strict IDs/fields/size limits and safe API errors.
- `supabase/functions/family-api/deno.json`, `deno.lock` — strict settings and pinned SDK dependency graph.
- `supabase/migrations/202610230001_family_access.sql` — M1 private schema, constraints, RLS and transactional RPC.
- `supabase/bootstrap-owner.sql.example` — manual confirmed-owner binding template, not an automatic migration.
- `supabase/functions/.env.example`, `.gitignore` — backend secret names and ignored local state.

Verification/docs:

- `tests/family/api_test.ts` — ten focused Edge/auth/crypto tests with a mocked repository.
- `tests/family/database_test.ts` — embedded real PostgreSQL/PLpgSQL authorization tests with isolated pgcrypto shims.
- `tests/family/browser_fixture_server.ts` — local-only synthetic UI fixture and static HTML preview.
- `README.md`, `docs/plans/family-progress/M1_SETUP.md`, this report — setup, commands, prerequisites and evidence.
- Existing `ARIA_BLUEPRINT_v1.md` was preserved.

## Verification results

- `npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts` — PASS.
- `npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family` — **11 tests passed, 7 database steps, 0 failures**.
- API cases: unsigned/missing parent, untrusted ownership fields, parent-as-device
  token rejection, limited device roster operation, cooldown before derivation,
  successful unlock replay, restricted CORS, bounded/idempotent mutation input,
  sanitized provider errors, salted/peppered derivation and comparison.
- Embedded SQL cases: denied browser table/RPC privileges, unprovisioned Auth user,
  create/replay/conflict, pairing/claim retry, child-only scope, device-as-child
  rejection, PIN-reset session invalidation, old-receipt invalidation, PIN throttle,
  revocation without deleting retained cache keys.
- BrowserOS neo: real disabled page has all private entry actions disabled; enabled
  local fixture exercised pairing → parent sign-in → child creation → approval →
  parent sign-out → wrong-PIN rejection → correct child unlock. Desktop did not
  overflow. The own QA tab is left on the real disabled preview.
- Inline browser JavaScript parses successfully; all eight reviewer links found;
  changed/new text normalized to CRLF; `git diff --check` PASS. No lesson/scoring
  changes were needed, so no unrelated full content test expansion was performed.
- Local native PBKDF2 benchmark: 600,000 iterations in approximately **111 ms** on
  this machine. This is not a hosted Edge CPU measurement.

**Test limitations:** Docker Desktop's Linux engine did not become usable. PGlite
does not bundle pgcrypto, so its test-only identity crypto shims do not verify
encryption, pgcrypto packaging, real Supabase Auth, hosted Edge CPU or real network
integration. Deployable SQL still uses real pgcrypto; no shim is imported by server
sources. The browser fixture is synthetic and not a security backend substitute.
During final reload verification, the running fixture initially retained its old
pre-format substitution code; it was restarted to load the corrected local-only
configuration. No remote writes or real-user credentials were involved.

## Architecture adaptations for Luna

- Reuse the owner's existing **Tokyo** Free project `grade6-reviewer-old`, rather
  than creating the architecture's originally proposed Singapore project.
- `devices.allowed_child_ids` holds the current permission list while historical
  `device_children` rows remain for session FKs/cache-key recovery. Every unlock
  checks the active list; permission changes increment generation/revoke sessions.
- M1 pairing review verifies the displayed label with the child; no extra parent
  pairing-preview API was added outside the approved route contract.
- The Edge SDK is pinned to `@supabase/supabase-js@2.118.0` (npm-verified during
  implementation). Browser native fetch follows Aria's approved architecture.
- M1 does not implement future study queues, timing, attempts, dashboards or reward
  transactions. The schema includes only the access foundation required now.

## Setup prerequisites / remaining gates

The main agent's read-only Supabase inspection found the project healthy but with
no Auth users and no application migrations. Hosted public signup is still enabled.
Before integration: disable public/anonymous signup, create one confirmed parent,
bind its Auth UUID, configure backend secrets, apply reviewed SQL/Edge code, and run
real pgcrypto/Auth/Edge checks. Follow `M1_SETUP.md`; never paste secrets into chat
or commit parent credentials/private setup values.

Luna must review this implementation and adaptations, run the prescribed gate and
create a local feature-branch commit. Quinn then verifies that reviewed commit.
Dep may push/deploy only after both PASS gates and the user's handoff. Do not enable
the production family flag before the later required capabilities are complete.

Preview server remains available at `http://127.0.0.1:8766/family.html` (real disabled
configuration). Synthetic fixture: `http://127.0.0.1:8766/__family_m1_fixture__.html`.

## Compressed handoff

[MASON] v1.0 — 2026-10-23
Status: COMPLETE local M1; live integration pending
Key outputs: private family access UI/API/SQL foundation; 11 passing tests with
7 database steps and BrowserOS fixture evidence; setup/report with production flag disabled.
Blockers: owner provisioning/secrets and real hosted integration remain release prerequisites.
Next recommended: Await user review, then Luna only when authorized.
