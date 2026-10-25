# Dep M2 backend deployment report v1

2026-10-25 · hosted Supabase backend only · COMPLETE for the authorized deployment and operational verification.

No public client activation or GitHub Pages publication occurred. No application logic changed. All nine HISTORY/REPORT/JPEG flags remain false and all nine local adapters remain null. Family M1 remains enabled; the eight reviewer integrations remain disabled. No next specialist was invoked.

## Reviewed release and installed resources

- Source implementation: `ed283cd85cacccd2a98618445c0c8a5cc4378684`.
- Reviewed/tested input HEAD: `5e7774e3869b0334e3de0194cf91cb040f5540ca`, branch `codex/m2-production-bridge`. Application bytes are unchanged from the reviewed implementation.
- Gates: `LUNA_M2_BRIDGE_REVIEW_v1.md`, `LUNA_M2_BRIDGE_PLUGIN_AUDIT_v1.md`, `QUINN_M2_BRIDGE_REPORT_v1.md`, and `LUNA_M2_BRIDGE_QA_REVIEW_v1.md`; Quinn's independent suite and Luna's committed QA follow-up were PASS before deployment.
- Project: `grade6-reviewer-old`, reference `hzgvhkgsxvodmdurysvf`, existing Lumio Free project, Tokyo. Backend: https://hzgvhkgsxvodmdurysvf.supabase.co.
- Database remains PostgreSQL 17.11 with real pgcrypto. No replacement project, billable resource, reset, key rotation, account reprovisioning, password change or Auth weakening.
- Installed migration: `202610240001_m2_attempt_history.sql`, applied at **2026-10-25T08:46:46.409Z** as the complete reviewed transaction through the signed-in dashboard's authenticated management API. Result: success, empty result set.
- Existing function ID: `b448a775-b596-45ba-9a94-6da6d6a523bf`; `family-api` advanced from ACTIVE version 1 to **ACTIVE version 2**, deployment HTTP 201. Existing `verify_jwt=false` preserved; the handler still performs authoritative parent Auth and opaque child-token authorization.
- Bundle SHA256: `c7d192b892cf06aa2f44c3ccc38922a7e4ac88ac2c7a39db88493753143cec7b`.
- Existing FAMILY_PIN_PEPPER, PAIR_CLAIM_KEY and platform service key were preserved. No test repository, fixture, credential or test source was deployed.

## Exact bytes and catalog

| Artifact | SHA256 |
|---|---|
| Original M1 migration | `ed2adcf2fa3ce024336d9243e67d319c4bcf50493c82f540bcea717045248965` |
| Applied M2 migration | `432305270e36247e9d69233997a19c513917bdef3277905e964256fffbd61ccc` |
| `index.ts` | `8bf025c1ad90395e8954bd116c9733905bd1a8913668c11a93f7aa3b9618c19b` |
| `auth.ts` | `3c8820ecf7c52278f442d0aea02cae39bb81b0a605d6573dfbbf2ee492555e95` |
| `crypto.ts` | `ba943ac49df7f45c83bd642354bac9e0bdc362801b7148121d0a540b9d54db1b` |
| `validation.ts` | `624ceb947835b994f89c229c381b18167fc53941e0e5e89d964833363a0dddaa` |
| `m2-contract.ts` | `f59155ec022593c13c79a67488de8a1ca3dbbe05bbac92bb5c4d199f2ebba357` |
| `m2-progress.ts` | `15faf53b88197a082c589922785cd06efaead8f928cc11df3eedf70920c2e05a` |
| `m2-bridge.ts` | `ef1d756060917babf39a72029277160689dd42be88382942669dd5382c202eb2` |
| `m2-catalog.json` | `f749f9a32f2d7a85628a5510e94d657a58ba8889c75bb81fa60eb11d604e0d2e` |
| `deno.json` | `a6aa0726c7af434bd982c407b059cfde236133f8280c4f5958d8dbf461d6da7d` |
| `deno.lock` | `64d7498aac8b9e77d8154d0b547088b580d5c5564699249863a95e57020e45c1` |

The table lists the exact CRLF bytes loaded into the deployment request; a final independent local hash check matched every deployed input file. The ten files form the reviewed dependency closure, using `index.ts` and `deno.json` as the entrypoint and import map. Supabase returned the bundle digest above; this was not claimed to be a source-file digest or a downloaded source attestation.

Catalog: **64 exact source-derived rows**, contract/catalog version 1; canonical semantic digest `7135e117adf31f172c1cbc0f4710374d4fd0891645e42a77eacdc69d6ce612c6`. This differs intentionally from the JSON file hash. The real hosted catalog response matched the complete frozen assessment manifest, and the actual browser production adapter accepted its digest gate.

## Mandatory preflight and backup

Fresh hosted inventory found one confirmed owner, one singleton family, two existing Auth sessions, zero children/devices/child sessions/pair requests, nine encrypted receipts and five rate-window rows. M2 was absent. The CLI migration-ledger relation was absent, as documented for the earlier dashboard-only M1 installation.

A separately named local PostgreSQL database received the complete reviewed M1 migration, including its final ALTER statements, solely to produce the expected definitions. Actual hosted M1 matched it exactly across eight complete metadata categories: tables/RLS/ACLs; every column/type/default/nullability; all constraints and FK actions; indexes; policies; complete pg_get_functiondef bodies, SECURITY DEFINER/search_path and function ACLs; private-schema ACL; and browser/service dispatcher privileges. No mismatch was suppressed with IF NOT EXISTS.

Before the additive write, a private export saved complete rows from all eight existing owned private tables plus schema/function metadata. It is outside the repository at:

`C:/Users/jdtig/.codex/private-backups/grade6-reviewers/m2-20261025T0846Z/pre-m2-owned-data.json`

Backup length: **48,040 bytes**. SHA256: `ef0b64c9ca418fe6c0a1cc0d291caadf537dd1e5cb8d7a4f393a9fee290f8a61`. This is an owned-data/schema export, not a full cluster/PITR or Auth-password backup. Its contents were never returned to model output or committed. A temporary ignored transfer copy was moved out of the repository after verification.

After M2 installation, the same local reference database received the exact M2 migration. Hosted definitions matched the complete M1+M2 result, with an additional ninth category explicitly comparing every non-internal trigger definition. Thus the private M1 delegate, new dispatcher/helpers, immutable guards, constraints, indexes, RLS and ACLs all matched the reviewed SQL. Anon/authenticated dispatcher EXECUTE remains denied. API-exposed schemas remain `public,graphql_public`; private is not exposed.

**Migration history remains dashboard-only, with no CLI ledger reconciliation.** M1 was never rerun. M2 was applied once. Do not run generic `supabase db push` until both actual migrations have been compared and safely reconciled through the supported CLI migration-repair workflow. No migration-ledger rows were invented.

## Hosted operational evidence

**130 assertions PASS, zero failed assertions and zero unresolved backend failures.** Final evidence timestamp: **2026-10-25T08:56:44.693Z**. Sanitized evidence is ignored at `test-results/dep-m2-hosted/results-safe.json`; preflight evidence is `preflight-safe.json` in that directory. These contain pass/fail, HTTP codes, definitions metadata, deployment hashes and timings, not credentials, real owner identity, names or scores. The browser observations involved only clearly labeled synthetic learning data.

| Area | Hosted proof |
|---|---|
| Health/bootstrap | Health 200 retains family_access and advertises assessment_history_v1/progress_summary_v1; child bootstrap checks version/digest and decimal-string revision |
| Catalog | Exact 64-row frozen manifest; parent owner access 200; real confirmed nonowner 403; device/parent JWT cannot substitute for child credentials |
| Ingestion | Concurrent identical requests return one 201 and one 200, both revision 1; same-ID retry after lost acknowledgement stays duplicate |
| Permanent identity | Expired synthetic receipt plus fresh idempotency key still yields the same permanent duplicate without advancing revision; changed immutable payload 409 |
| Input/scope | Spoofed child field 422, fractional score 422, total mismatch 422, parent credential on child ingest 401; wrong child cursor scope and strict filters rejected |
| Summary math | Independent 42/70 to 53/70 oracle: 75.71%, +15.71 points, +26.2% relative, rounded 76% FS; parent/child full-scope parity and Q1 isolation |
| Paging | Revision-2 cursor excludes a later-arriving t2; refresh revision 3 selects that immediate predecessor; wrong quarter/child cursor rejected |
| Corrections | Baseline 12/20 remains 60%; separate correction 20/20; immutable baseline/delete/correction/catalog writes denied; invalid correction leaves no baseline; later attachment denied |
| Source lifetime | Expired original authorization can upload via current valid session; revoked source and out-of-source time window rejected; revoked-source duplicate disclosure denied |
| Current access | Expired/revoked current session, archive, device generation, PIN version, removed allowlist and revoked device all deny reads and duplicate replay before disclosure |
| Direct browser DB | Anon and real owner Auth tokens cannot execute service RPC or read private history tables |
| Chronology | Unverified time is accepted with explicit quality; summary suppresses latest/direction when chronology is unavailable |
| M1 regression | Actual owner family/profile creation, pair creation/replay, approval, encrypted claim replay, allowed roster, wrong/sibling PIN denial and correct unlock; child lock invalidates token; PIN reset invalidates prior token and fresh unlock works; device revoke denies access |
| Preservation | Original family row and all nine prior receipts are hash-identical; original owner/family and two original Auth sessions retained; full hosted Auth config unchanged |

These are actual hosted PostgreSQL/pgcrypto/Auth/Edge operations, not fixture responses or local-only repository tests. The test owner session used official admin-generated magiclink plus verifyOtp, without sending any email or changing a password. A separately confirmed synthetic nonowner tested ownership denial. This administrative test login is separate from the owner's earlier private password sign-in; a new password-entry UI flow was not claimed.

### Native browser transport and report

BrowserOS neo exercised the reviewed production browser adapter through an owned, loopback-only response configuration server at port 8770. Only response-time flags/URLs/readiness and a prominent synthetic-hosted-test banner changed; source files stayed unchanged, FAMILY_LOCAL_ADAPTER stayed null and JPEG stayed false. The transparent proxy forwarded to actual production Supabase with the already reviewed localhost Origin, without mocked responses. Separate HTTP checks used the production Origin.

The reviewer capture used actual catalog/bootstrap authorization, real native IndexedDB and AES-GCM. A deliberate network exception occurred only **after the real hosted POST returned 201**. Both encrypted record and outbox ciphertext stayed byte-identical. Retrying reached the real hosted endpoint, returned 200 duplicate, changed the decrypted record to pending=false/provenance=server and atomically removed its outbox entry. The real report displayed 56/70, 80.00%, rounded 80% S and prior 53/70, 75.71%, rounded 76% FS. JPEG remained disabled.

Setup limitation: directly injecting a child session into a pristine reviewer origin before native database initialization let foreground flushing create an empty version-3 DB, so the first artificial reviewer-first capture could not find metadata. The owned empty test DB was removed, then the reviewed native five-store initializer ran before the ephemeral child session was transferred. The hosted capture/outbox/report checks above then passed. This reproduces the storage ordering used by family-first access, but it is **not a fresh full family-page navigation/password UI run**. It warrants a fresh-storage flow check during later client activation review; Dep made no application patch and does not approve unsupported session injection as a product entry path.

Network timing samples for asserted HTTP responses ranged from 78 to 2,882 ms; the first health probe after deployment took 5,167 ms. These are end-to-end network samples, **not CPU measurements or capacity benchmarks**. No CPU-limit termination or service error appeared in this scoped sample. The existing Retry-After CORS exposure advisory remains; backend CORS/application logic was not changed.

## Cleanup and final owned state

No immutable history was deleted and no trigger was disabled. The synthetic test profiles were clearly labeled `DEP M2 synthetic ...`; both are archived. Their one device is revoked. Source rows needed by immutable history remain. No actual learning profile existed at preflight and none was altered.

| Resource | Final count |
|---|---:|
| Actual owner Auth users | 1 |
| Original owner Auth sessions | 2 |
| Singleton family | 1 |
| Archived synthetic profiles | 2 |
| Active profiles | 0 |
| Revoked synthetic devices | 1 |
| Active devices | 0 |
| Retained synthetic child-session rows | 5 |
| Immutable synthetic attempts | 8 |
| Correction snapshots | 1 |
| Synthetic primary child revision | 8 |
| Frozen assessments | 64 |

Both admin-generated test sessions were signed out with scope=local (204), preserving the actual owner's other sessions. The exact synthetic nonowner Auth identity was deleted (200). Parent-principal test receipts remain under existing expiry rules; the original nine receipts remain unchanged. Shared rate metadata continues its existing expiry behavior; no global rate reset occurred.

The synthetic browser session and owned native test database were cleared. Thirty-one operational browser globals holding temporary credentials/helpers were deleted; no credential memory remained under their namespace. Owned loopback listeners 8769/8770 were stopped and verified absent. The original local QA services/tabs were left alone. The useful signed-in project dashboard remains available.

## Rollback and remaining release gate

All public M2 client gates are already off. If backend containment becomes necessary, redeploy the previous compatible reviewed M1 family-api closure (the version-1 M1 release recorded in DEP_HOSTED_M1_PREPARATION_v2, source `0392879f6db3a15e89e8d3d4b4ec4e465224fd58`) using the existing platform secrets and verify_jwt=false. The installed additive dispatcher continues forwarding M1 operations to the preserved private delegate. Verify family_access health and owner/device/child access after containment.

Do not rerun M1, drop M2 tables, remove the private delegate, disable immutable triggers, purge attempts/corrections, rotate cache/claim keys or reset Auth. Preserve pending encrypted work and actual applied migration state. Recovery requires a reviewed additive correction and new tests before backend/client activation.

Backend readiness: **ready for a separately reviewed client activation**. The next authorized slice must keep JPEG separate, address applicable fresh-storage entry checks, intentionally enable appropriate history/report/reviewer gates, and receive Luna local-commit and Quinn PASS gates before Dep publishes it. No such activation, push or next-agent invocation occurred here.

[DEP] v1.0 — 2026-10-25

Status: COMPLETE for backend deployment and hosted operational verification.
Key outputs: exact additive migration and ACTIVE Edge version 2; 130 hosted assertions PASS; private backup, preserved owner/session state and isolated archived immutable test history.
Blockers: none for the backend scope. Client activation remains separately gated; fresh-storage browser entry coverage is recorded above.
Next recommended: awaiting user go-ahead for the reviewed client activation slice.
