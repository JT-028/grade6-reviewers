# Dep hosted M1 preparation v2

Date: 2026-10-24 (Asia/Manila).

**COMPLETE for hosted M1 backend operational preparation.** No functional blocker
was reproduced in the scoped hosted checks. This is not approval to enable the
public UI and does not expand the earlier Luna/Quinn disabled-release gates.
The user authorized hosted setup and activation preparation only.

This report supersedes the pending-sign-in checkpoint in
`DEP_HOSTED_M1_PREPARATION_v1.md` (local documentation commit `a23bf90`). V1 retains
the initial inventory and independent hosted probes. Application source remains
the reviewed release at `0392879f6db3a15e89e8d3d4b4ec4e465224fd58`.

## Installed backend and configuration

Existing project: `grade6-reviewer-old`, Lumio Free, main production branch,
reference `hzgvhkgsxvodmdurysvf`, Tokyo (`ap-northeast-1`), API URL
`https://hzgvhkgsxvodmdurysvf.supabase.co`. Initial inventory was empty: no Auth
users, application tables, functions, custom secrets or migration-ledger schema.
No existing owner or application data was replaced.

| Resource | Installed and verified |
|---|---|
| Database | PostgreSQL 17.11; real pgcrypto 1.3 |
| Schema | Reviewed `202610230001_family_access.sql`; eight private tables, all with RLS |
| Browser privileges | No private schema USAGE or dispatcher EXECUTE for anon/authenticated |
| Dispatcher | `public.family_dispatch(text,jsonb,jsonb)`; service_role EXECUTE only |
| Edge function | `family-api`; reviewed index/auth/crypto/validation sources plus `deno.json` |
| SDK dependency | `npm:@supabase/supabase-js@2.118.0` from reviewed configuration |
| JWT gateway | `verify_jwt=false`; actual handler validates private-route credentials |
| Custom secrets | Independent cryptographic 32-byte `FAMILY_PIN_PEPPER` and `PAIR_CLAIM_KEY`, hexadecimal, platform secret store |
| Platform defaults | Hosted `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; no replacement |
| Hosted Auth | Signup disabled; Email enabled; anonymous disabled; email confirmation required |
| Owner | Exactly one confirmed owner account bound to exactly one singleton family |
| Public configuration | Family flag remains false; every reviewer integration remains disabled/null |

The original migration SHA256 is
`ED2ADCF2FA3CE024336D9243E67D319C4BCF50493C82F540BCEA717045248965`.
The deployment used the signed-in BrowserOS neo dashboard because CLI 2.122.0 had
no saved access token. SQL was applied directly, with source-matched editor
contents; no CLI migration-ledger entry was fabricated. Reconcile migration
history before a future CLI `db push`; do not rerun the creation migration.
Dashboard function contents were compared with reviewed source before deployment,
with editor line endings/terminal whitespace normalized. No application logic,
M2 schema, history API or fixture backend was deployed during this follow-up.

## Authentication evidence and test session boundaries

The owner privately created the confirmed account and completed password sign-in.
Hosted Auth recorded a recent owner sign-in before the administrative test session
was generated. The earlier BrowserOS target had no matching client session or
request history, and later the check tabs disappeared across the interruption.
That did not establish an application sign-in defect, and the lost browser state
was not treated as a failed password login.

To avoid asking the user to sign in repeatedly, Dep used the documented trusted
administrator route: [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
with `magiclink`, followed by [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp).
Both returned HTTP 200. No invitation, recovery message, magic-link email or other
message was sent. The owner's password, identity and family binding were not
changed. The existing administrator key was consumed only in place in the
trusted dashboard; neither it, the generated link, token hash nor session token
was returned to model output or written to a file.

The resulting short-lived owner test session passed directly between browser
windows with origin/source checks and remained in memory. It was not persisted
as the application's parent session. A clearly synthetic confirmed non-owner was
created for the negative ownership test and deleted afterward. The tests below
use actual hosted Auth/Edge/PostgreSQL, not a mocked Auth repository. They prove
backend authorization under a real admin-generated test session; they do not
constitute a fresh end-to-end owner password-entry UI test.

## Hosted operational results

**51 operational assertions passed; zero unresolved failures.** This count
includes the test-session logout check. Sanitized machine evidence is ignored at
`test-results/dep-hosted-authenticated-final-safe.json`; it contains pass/fail,
HTTP codes and selected timings, not credentials or real child data. Independent
public-boundary and crypto probes from V1 supplement these authenticated checks.

| Area | Result |
|---|---|
| Owner / valid non-owner | Owner family GET 200; confirmed non-owner 403 `PARENT_NOT_PROVISIONED` |
| Browser database boundary | Valid owner direct dispatcher RPC 403; private REST schema 406 |
| Profile creation | Concurrent identical mutations returned 201/201 and one child; conflicting intent 409 |
| Parent roster | Expected synthetic profiles; no PIN salt/verifier exposed |
| Pairing | Creation 201; lost-response replay preserves code; wrong polling secret 401; pending claim stays pending |
| Approval / claim | Owner approval succeeds; encrypted claim replay preserves the device credential |
| Device scope | One allowed profile; sibling excluded; device credential cannot read child bootstrap |
| PIN / child scope | Wrong or sibling PIN 401; correct PIN unlock 200; scoped child bootstrap and receipt replay pass |
| Reset race | Concurrent old-PIN unlock/reset can finish before reset, but both racing and prior sessions are rejected afterward |
| Membership | Permission changes invalidate sessions; restoring membership permits fresh unlock |
| Cooldown | Five wrong PIN attempts 401; next attempt 429; wire `Retry-After: 900` confirmed |
| Expiry / lock | Expired child session 401; expired approved pair 410; explicit lock then bootstrap 401 |
| Revocation | Stored device credentials rejected with 403; existing child session rejected |
| Explicit reapproval | Same device reapproved; credential rotates; old credential stays denied; recovery cache key retained |
| Error behavior | Invalid field 400 with safe API error; error body omits test credentials |
| Crypto | Actual AES256 PGP round trip/randomization, wrong-key rejection and encrypted response replay pass |
| Production CORS / proxy | Health/preflight permit exact production origin; untrusted GET/preflight 403 with no allow-origin header |
| Closed Auth | Public settings confirm required flags; signup attempt 422 `signup_disabled` |
| Unimplemented history | M2 history route remains 404 `NOT_FOUND` |

The crypto checks use production pgcrypto and the real function receipts. No SQL
crypto shim, weakened PIN derivation, browser table grant or temporary public
signup override was used. Controlled time changes affected only known synthetic
pair/session rows. Rate-limit resets targeted only the known synthetic child and
device keys, not global owner or unrelated counters.

Observed network latencies included concurrent child creation at 629/646 ms,
sibling creation at 370 ms, correct PIN unlock at 325 ms, new-PIN unlock at 364 ms
and a racing PIN reset at 731 ms. These are **end-to-end latency samples, not CPU
benchmarks**. The reviewed 600,000-iteration PBKDF2 workload completed on the
hosted runtime, including concurrent work and repeated wrong-PIN requests,
without a CPU-limit termination or service error in this sample. Per-request CPU
time was not available; no load/capacity or worst-case CPU claim is made.

One advisory remains: `Retry-After` is present on the actual HTTP 429 response,
but no `Access-Control-Expose-Headers` exposes it to browser JavaScript. Cooldown
enforcement and its user-facing error work. A future UI that displays a precise
retry countdown will need that header exposed (or equivalent response data).
Dep did not modify application code to address this advisory.

## Cleanup and preserved user state

Only the exact synthetic marker's child profiles, device, pair requests, sessions,
device-child keys and device/child/pair receipts were removed. The synthetic
non-owner identity was verified by its exact test-email format before deletion
(HTTP 200). Parent-principal encrypted idempotency receipts were conservatively
left to the existing 24-hour expiry policy because their principal is the real
owner; no broad owner receipt deletion occurred. Shared rate metadata follows
its existing expiry policy.

Both ephemeral Auth sessions were signed out with `scope=local` (HTTP 204/204),
which targets those test sessions. No global owner logout, password reset or
identity update was used. Final database inventory:

- Auth users: 1; singleton families: 1; confirmed owner binding: true.
- Child profiles, devices, child sessions and pair requests: all 0.
- Existing owner Auth sessions retained: 2.

Ephemeral browser credential memory was cleared and no application parent session
was persisted. The administrator-key popup and temporary check tab were closed.
Both loopback test servers on ports 8766/8768 were stopped; probes confirmed both
ports unavailable. The temporary polling-secret file was deleted. Ignored
operational scripts and sanitized results remain local, never part of Pages.

## Remaining activation prerequisites

No additional user credential or hosted provisioning action is required for this
preparation scope. Activation still requires a separately authorized Mason change
for M1-only family access, including truthful unavailable-history wording. Keep
all reviewer integrations false/null because M2-A is local fixture capture and
has no hosted history endpoints. Then obtain Luna review/local commit, Quinn
verification, and authorized Dep release. Existing disabled-release passes do not
approve this future enabled UI. No next seat was invoked, no public flag was
changed, and no commit was pushed during preparation.

Rollback remains containment rather than data deletion: keep public flags off;
disable the owned function if necessary; preserve the schema, owner and family
while investigating. Do not rotate claim keys without the documented receipt/
pair recovery procedure. No additional infrastructure was provisioned or billed.

[DEP] v2.0 — 2026-10-24

Status: COMPLETE for hosted M1 operational preparation. Key outputs: installed
backend and confirmed owner; 51 authenticated operational assertions plus prior
independent probes; synthetic data and ephemeral sessions cleaned up. Blockers:
none in preparation scope. Limitations: CPU time unavailable, latency samples
only; Retry-After browser exposure advisory; public activation needs new gates.
Next recommended: awaiting user go-ahead for the Mason M1 activation handoff.
