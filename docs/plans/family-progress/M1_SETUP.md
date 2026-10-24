# M1 setup and verification

Date: 2026-10-24 (Asia/Manila). The user has authorized hosted M1 setup and
family-access activation preparation. Hosted preparation is recorded in
`DEP_HOSTED_M1_PREPARATION_v2.md`; public activation remains a separate gated handoff.

## Existing project

Use the owner's existing `grade6-reviewer-old` project, reference
`hzgvhkgsxvodmdurysvf`, at `https://hzgvhkgsxvodmdurysvf.supabase.co`. The owner
created it in Tokyo (`ap-northeast-1`), so no Singapore project or region move is
needed. The project URL and publishable key in `family.html` are browser-public
configuration; neither grants access to private family tables.

The initial read-only inspection found no Auth users or application tables.
During the authorized 2026-10-24 Dep preparation, the reviewed M1 schema and
`family-api` were deployed, public signup was disabled, and the owner privately
created the confirmed parent account. The singleton family is bound to that
confirmed account. Email Auth remains enabled, anonymous sign-in remains disabled,
and email confirmation remains required. Hosted operational checks and synthetic
cleanup are complete; see the v2 preparation report for evidence and limitations.
Do not reapply the SQL blindly.

## Authorized backend setup, after gates

1. Use the Supabase CLI or dashboard for this existing project. Review the additive
   migration `supabase/migrations/202610230001_family_access.sql`. Apply it only to
   the selected project after Luna and Quinn gates; do not apply test shims.
2. In Authentication settings, disable **Allow new users to sign up** and keep
   anonymous sign-in disabled. Keep Email Auth enabled. `supabase/config.toml`
   expresses the equivalent local settings; it does not change the hosted project.
3. In Auth Users, manually create exactly one confirmed parent email/password
   account with a strong owner-chosen password. Do not use emailed invitation or
   password-reset flows; they are not part of this design. Recover the password
   through owner-controlled dashboard/admin tooling.
4. Copy that user's UUID into a private working copy of
   `supabase/bootstrap-owner.sql.example`. The confirmed-user FK and singleton
   family row bind the verified owner. Confirm one family row. Do not commit a real
   parent email, UID, password, token or private working copy.
5. Configure backend secrets: `FAMILY_PIN_PEPPER` is at least 32 random bytes
   encoded as hexadecimal, and `PAIR_CLAIM_KEY` is exactly 32 random bytes encoded
   as 64 hexadecimal characters. Supabase provides `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` to hosted functions. Keep secrets in the platform
   secret store or ignored `supabase/functions/.env`, never in HTML or the repo.
   `.env.example` lists names only. Rotating the claim key needs an explicit
   existing-receipt/pair recovery procedure, not an unplanned key replacement.
6. Deploy the `family-api` Edge Function with JWT gateway verification disabled as
   configured. The handler itself verifies every private route. Deploy the function
   and SQL together before any client is enabled. Do not grant browser roles table
   access or dispatcher execution to make an error disappear.
7. Run real integration checks below using synthetic profiles. Benchmark PIN
   hashing on the hosted Edge runtime; keep PBKDF2-HMAC-SHA256 at 600,000 iterations.
8. Keep `FAMILY_ENABLED = false` in production during preparation. The user's
   approved staged path allows M1 parent login, profiles, PINs and pairing to
   activate independently after hosted checks and a new Mason activation change,
   Luna PASS, Quinn PASS and authorized Dep release. M1 must truthfully explain
   that study history is unavailable. Every reviewer flag remains false/null until
   its hosted history contract exists and passes its own gates. M2-A currently
   supplies local fixtures only; it does not supply hosted history endpoints.
   A loopback-only M1 client may enable its response configuration for hosted
   verification while tracked and published flags remain false.

No custom SMTP, paid service, billing upgrade, child email or public registration
is needed. Free project pause/resume and manual backups follow Aria's runbook.

## Security boundaries

- Parent password/refresh uses Supabase Auth. Every parent API request calls
  `auth.getUser` and binds that verified UUID to the provisioned family owner.
- Device credentials return only permitted profile IDs/names and allow PIN unlock.
  They cannot read private child bootstrap data. Tokens are random 256-bit opaque
  credentials; only token hashes are stored in the database.
- PIN verification is online, salted and peppered, with database-reserved rate
  limits before derivation. Child sessions expire after eight hours, parent-device
  approval after 90 days. PIN reset, device revocation and membership changes
  invalidate existing private sessions.
- The private schema has RLS and no browser grants. Only the service-role Edge
  Function can call `public.family_dispatch`. Do not expose the private schema.
- Parent/child tab credentials use sessionStorage; the device token uses IndexedDB.
  No PIN or PIN verifier is stored by the browser. Private UI locks on inactivity,
  profile switch and cross-tab lock messages, and rechecks access after hiding.
- M1 provisions each child/device cache key but does not write study caches or
  queues yet. Those encrypted stores and offline replay arrive in M2/M3. Offline
  cold unlock is not supported. Do not claim M1 already records cloud study work.
- Existing client-side reviewer admin passcodes remain guest conveniences and do
  not authorize family records. Trusted household browser/devtools limits in the
  architecture still apply.

The pairing screen displays the device label next to its code; the parent review
asks the owner to verify that label with the child before confirming. This version
does not add an unplanned parent pairing-preview API.

## Local commands

```powershell
npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family
npx --yes serve . -p 8766
```

Optional local synthetic browser fixture (use instead of `serve`, same port):

```powershell
npx --yes deno run --allow-read --allow-net=127.0.0.1:8766 tests/family/browser_fixture_server.ts
```

- `http://127.0.0.1:8766/family.html` shows the real disabled configuration.
- `http://127.0.0.1:8766/__family_m1_fixture__.html` serves an enabled, visibly
  labeled synthetic fixture. No requests reach Supabase. Fixture parent email and
  password may be arbitrary test values; the child PIN fixture is `123456`.
- The fixture transforms configuration only in its HTTP response. The real file
  remains disabled. It serves only root HTML documents, not `.env`, `.git`, server
  sources or credentials. Never deploy or expose this development server publicly.
- Deno's SDK import is pinned to npm `@supabase/supabase-js@2.118.0`; its lockfile
  records resolved dependencies. Browser calls use native fetch as Aria specified.

## Required real integration before release

Verify real pgcrypto encryption/decryption and secure receipt replay; SQL privileges
for anon/authenticated/service-role; provisioned versus other valid Auth users;
pair expiration and lost responses; wrong PIN/cooldowns; permitted versus sibling
profiles; child expiry, PIN reset and device revoke/reapprove; production-origin
CORS; storage failures and unavailable backend. No test should use real children
or print credential-bearing responses.

The portable tests execute real PL/pgSQL/RLS/ownership logic through PGlite, replacing
only unavailable pgcrypto functions with test-only shims. Those shims are confined
to `tests/family/database_test.ts`. They do not validate encryption strength,
pgcrypto packaging, hosted Auth, Edge deployment or network integration.

## Implementation notes for review

M1 introduces `devices.allowed_child_ids` as the current permission allowlist.
Historical `device_children` rows/cache keys are retained because child sessions
reference them and future encrypted pending work must survive permission changes.
Every unlock checks the active allowlist; permission changes bump the generation
and revoke sessions. Parent views use the active list rather than historical rows.

Encrypted receipt responses and pair claims use pgcrypto AES-256 PGP encryption
under the backend-only claim key inside the service-only transaction. Raw tokens
are returned only to the authorized caller and not persisted unencrypted.

Root docs will become public when eventually pushed. Keep only synthetic records,
public configuration and templates here. Luna reviews/commits locally, Quinn tests
that commit, and Dep handles the later deployment and compatible rollback.
