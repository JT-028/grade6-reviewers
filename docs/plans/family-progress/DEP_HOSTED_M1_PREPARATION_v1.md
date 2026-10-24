# Dep hosted M1 preparation v1

Date: 2026-10-24 (Asia/Manila). Status: **PARTIAL — backend installed; authenticated
hosted lifecycle checks await the owner's private sign-in.** This is not an
activation gate PASS. Reviewed release source: `0392879f6db3a15e89e8d3d4b4ec4e465224fd58`.

## Authorization and boundaries

The user authorized hosted M1 setup and family-access activation preparation.
Existing Luna and Quinn passes establish the reviewed backend source and disabled
static release; this report does not extend those passes to an enabled public UI.
No application logic, production flag, reviewer configuration, M2 schema, hosted
history endpoint, statistics or reward implementation was changed. Nothing was
pushed to GitHub Pages.

## Fresh inventory and installed resources

BrowserOS neo inspected the existing `grade6-reviewer-old` project in Lumio Free,
reference `hzgvhkgsxvodmdurysvf`, main production branch, Tokyo. The initial SQL
inventory confirmed PostgreSQL 17.11, zero Auth users, zero public/private
application tables, and no `supabase_migrations` schema. No functions or custom
secrets existed. Dashboard access was authenticated; Supabase CLI 2.122.0 was
available but had no saved access token. No token was requested or extracted.

- Applied the reviewed `202610230001_family_access.sql` directly through the
  dashboard SQL editor. Original file SHA256:
  `ED2ADCF2FA3CE024336D9243E67D319C4BCF50493C82F540BCEA717045248965`.
  This is a direct SQL deployment, not a CLI migration-ledger entry. Reconcile the
  migration ledger explicitly before any future CLI `db push`; never reapply this
  non-idempotent creation migration to an existing schema.
- Confirmed eight private tables: `families`, `children`, `devices`,
  `device_children`, `pair_requests`, `child_sessions`, `rate_windows`,
  `api_receipts`; all eight have RLS enabled. Real pgcrypto 1.3 is present.
- Deployed `family-api` using the reviewed `index.ts`, `auth.ts`, `crypto.ts`,
  `validation.ts`, and `deno.json`. Each dashboard draft was compared with its
  source before deployment (editor line endings/terminal whitespace normalized).
  The configuration pins `@supabase/supabase-js@2.118.0`. M2 contract files and
  fixtures were not deployed. Gateway **Verify JWT with legacy secret = false**
  was saved and verified; the handler enforces each private route.
- Generated two independent 32-byte cryptographic secrets using browser Web
  Crypto and saved them directly in the platform secret form as 64-character
  hexadecimal values: `FAMILY_PIN_PEPPER`, `PAIR_CLAIM_KEY`. Only names and blank
  post-save form state were inspected. Values were never returned, printed or
  written to files. Hosted platform defaults provide `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`; no service key was copied or replaced.
- Disabled public signup. Hosted `/auth/v1/settings` confirms
  `disable_signup=true`, Email provider enabled, anonymous users disabled and
  `mailer_autoconfirm=false`. Other providers and unrelated settings were retained.
- The user privately created the chosen parent account with auto-confirm enabled.
  SQL verified one matching confirmed account, one total Auth account, then
  provisioned exactly one singleton family bound to that account. The password,
  user UUID and email are omitted here. No invitation or password-reset email was
  sent. There are no real child records.

## Hosted checks completed

| Check | Observed result |
|---|---|
| Production-origin health | HTTP 200, API v1, `family_access` capability |
| Production-origin CORS | Exact `https://jt-028.github.io`; `Vary: Origin` handler policy |
| Production preflight | HTTP 204 |
| Untrusted GET and preflight | HTTP 403 `ORIGIN_NOT_ALLOWED`, no allow-origin header |
| Private response caching | `Cache-Control: no-store` |
| Missing parent credential | HTTP 401 `AUTHENTICATION_REQUIRED` |
| Forged parent credential | HTTP 401 `PARENT_SIGN_IN_REQUIRED` |
| Forged device / child credentials | HTTP 401 `DEVICE_REQUIRED` / `UNLOCK_REQUIRED` |
| Browser dispatcher RPC | Denied; HTTP 404 `PGRST202` |
| SQL dispatcher execute privilege | service_role true; anon/authenticated false |
| Private schema USAGE | anon/authenticated false |
| Public Auth signup | HTTP 422 `signup_disabled`; no account created |
| M2 history route | HTTP 404 `NOT_FOUND`, correctly unavailable |
| Actual AES256 PGP round trip / randomized ciphertext | Both true with synthetic probe key |
| Actual persisted receipt with wrong decryption key | Expected SQLSTATE 39000, wrong key/corrupt data |
| Public synthetic pair creation | HTTP 201 |
| Identical mutation replay | HTTP 201, same approval code |
| Conflicting intent with same mutation ID | HTTP 409 `IDEMPOTENCY_CONFLICT` |
| Claim before approval | HTTP 200 pending |
| Expired synthetic pair claim | HTTP 410 `PAIR_EXPIRED` |

The only pair probe used an explicit synthetic label and known generated request
ID. Its pairing row and pair-principal receipt were deleted by that exact scope
after expiration verification. Rate-limit metadata follows the existing expiry
policy. No unknown account, row, device or credential was deleted or reset.
Ignored `test-results/` contains the temporary operational tooling and probe
polling credential; it must never be committed or published.

## Required private step and remaining checks

The owner's confirmed account is provisioned. Private parent sign-in is still
needed at `http://127.0.0.1:8766/__hosted_m1_smoke__.html` in BrowserOS neo, then a
text confirmation that sign-in finished. The owner enters the password directly
in that page, never in chat. Dep must not inspect the page while the owner types.

The loopback-only process serves the actual reviewed `family.html` with an enabled
configuration only in its HTTP response and a visible hosted-check banner. It
serves one exact path, exposes no workspace files or credentials, and connects to
the real backend. The tracked HTML stays disabled. The process is deliberately
left running for the private sign-in; stop it after the remaining smoke checks.

After sign-in, use the session only in browser memory to verify real parent
ownership, synthetic profile creation, 600,000-iteration hosted PBKDF2 latency/CPU,
pair approval and encrypted claim replay, allowed/sibling PIN behavior, child
bootstrap/session replay, PIN cooldown/reset, session expiration and device
permission/revocation/reapproval. Valid non-owner Auth behavior also remains
unverified on hosted Auth; forged credentials are not a substitute. Retain only
sanitized pass/fail/timing evidence and remove/revoke owned synthetic test data.
Local thirteen-step integration evidence remains historical and does not stand
in for these hosted results. No authenticated hosted PASS is claimed yet.

## Activation handoff and rollback

The approved staged path is M1-only access, with truthful unavailable-history
wording and all reviewer integrations disabled. After hosted readiness is proven,
the next separately authorized seat is Mason for that activation change, then
Luna review/local commit, Quinn verification, and authorized Dep release. No seat
was auto-invoked. Existing gates remain scoped to the disabled public release.

During preparation, keep public flags disabled. If the backend needs containment,
disable/delete the owned `family-api` function through its dashboard settings;
leave the additive private schema and owner account intact while investigating.
Do not rotate claim keys or remove family data as a generic rollback. Rotating
keys needs the existing receipt/pair recovery procedure.

[DEP] v1.0 — 2026-10-24

Status: PARTIAL. Key outputs: reviewed M1 schema/function deployed, platform
secrets and closed Auth configured, confirmed owner bound, independent hosted
boundary/crypto/pair probes passed. Blocker: owner private sign-in and authenticated
hosted lifecycle checks. Next recommended: finish Dep hosted verification after
private sign-in; only then consider the separately gated Mason activation handoff.
