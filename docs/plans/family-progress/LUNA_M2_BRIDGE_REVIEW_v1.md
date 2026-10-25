# Luna M2 production bridge review v1

2026-10-25, Asia/Manila. Verdict: PASS for the local bridge review.
Reviewed source commit: `ed283cd85cacccd2a98618445c0c8a5cc4378684`.
Base: `a43b98ed58c41053eb773e3b19be50ddea14c6cf`.
Branch: `codex/m2-production-bridge`.
The documentation-only child commit records this review and its plugin audit. Resolve its audit SHA with `git log -1 --format=%H -- docs/plans/family-progress/LUNA_M2_BRIDGE_REVIEW_v1.md`.

## What this change does

The bridge stores immutable finalized attempts and optional companion corrections through authenticated production routes. The browser delivers encrypted pending work with stable attempt identities, then reads the canonical private history and quarter summary. M1 remains enabled in family.html. All M2 client gates remain closed, fixture adapters remain null, and all eight reviewer FAMILY_ENABLED flags remain false.

Reviewed inputs were Mason's bridge report/setup, Aria M2 v2 and its retained v1 schema, Rex/Alex M2 requirements, prior M2-B review and Quinn evidence, the complete current diff, and connected auth/contract/progress/report code. The expected load is one household, with bounded foreground delivery and retained retakes. This is a bridge gate, not JPEG, activation, hosted deployment or a repository-wide release audit.

## Findings and resolution

No unresolved CRITICAL, HIGH, MED or LOW finding remains in the reviewed change.

1. MED, resolved. `tests/family/m2_transport_template.js` treated incompatible bootstrap/catalog versions as a connectivity failure. The flush catch told an already connected learner to connect online. Aria section 5 requires retaining ciphertext and explaining the version issue. The catch now says family history or the assessment version is unavailable and the saved result is retained. It uses the existing M2_UNAVAILABLE distinction; it does not change the public API, queue identity or authorization policy.
2. LOW, resolved. The production adapter exported an unused `record()` method that repeated the flusher's POST/ack validation. Repository caller search found no call. Luna deleted it and retained the actual flusher boundary.
3. LOW, resolved. `familyBridgeAdapter()` had one caller in family.html and unused copies in eight reviewers. Luna inlined its existing adapter choice at that caller and deleted the helper from the template and all nine pages.

The fresh Comment Sicko pass identified 31 narration lines across templates, generated copies, SQL and tests. Luna removed them. Generator sentinels, PostgreSQL MVCC/CRLF explanations and the local relay's CORS rationale remain. No suppressions, root-cause reshape flags or unenforced constraint comments remain from that pass. SQL comment cleanup changes the exact migration bytes. The setup packet now records M2 SHA256 `432305270E36247E9D69233997A19C513917BDEF3277905E964256FFFBD61CCC`. The catalog file remains `F749F9A32F2D7A85628A5510E94D657A58BA8889C75BB81FA60EB11D604E0D2E`.

## Correctness and boundary review

- SQL is additive and transactional. History/catalog/corrections have restrictive foreign keys, RLS and no browser grants. The public SECURITY DEFINER dispatcher has an empty search_path, service-only execution and qualified private helpers. The original M1 implementation is preserved as a private delegate.
- Current parent ownership uses authoritative Auth getUser. Every child read/insert/replay checks current session, child/archive/PIN, device expiry/revocation/generation and allowlist. Original source ownership/generation/PIN/revocation checks precede permanent duplicate disclosure. Expired original sessions can recover through a current same-child/device session; revoked sources cannot.
- Per-child head locking and permanent attempt UUID locking serialize concurrent ingest without incrementing revisions for duplicates. Delivery receipt identity and permanent normalized Envelope identity remain separate. The baseline, optional correction, revision and delivery receipt commit atomically. Restrictive source-session foreign keys preserve attribution.
- Filters reject duplicate/unknown keys and invalid scopes. HMAC binds the role/family/child/quarter/filter scope. Cursor shape, head revision and actual ordering-tuple membership are checked before keyset reads. Fixed accepted revisions exclude late arrivals until refresh.
- Summary candidates cover the complete selected revision and quarter, with bounded rows per assessment and exact uncertain-chronology counts. The existing pure reducer selects matching latest/prior results, computes the fixed arithmetic policy, validates DTOs and suppresses unsupported chronological direction. No single detail page substitutes for a complete summary.
- The production manifest equals the independent inventory of all 64 actual assessments and includes metadata only. Browser bootstrap validates the bounded manifest and compatible authenticated capability response. Production imports no fixture repository.
- Queue delivery is serial and capped at 25 per foreground pass. It scans the selected child only, decrypts with the child key, preserves the attempt ID and checks complete acknowledgements. The records/outbox/metadata acknowledgement transaction verifies the durable epoch before replacing encrypted status and deleting pending work. Access loss clears credentials/projection while preserving ciphertext. Existing typed epoch errors and superseded async guards remain intact.
- M1 routes retain their query rejection and original behavior. Health remains compatible when M2 is unavailable. The real backend is required for production; no fixture fallback or URL/storage activation toggle was added.

## Executed evidence

The first affected suite passed 55 tests, including all 10 real bridge steps. After the review fix and cleanup, the final combined command passed **56 tests, 10 steps, zero failures and zero ignored tests**:

```powershell
$env:FAMILY_REAL_STACK='1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --allow-net --allow-run --allow-write tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts tests/family/m2_production_test.ts tests/family/m2_real_bridge_test.ts tests/family/m2_schema_test.ts tests/family/m2_transport_test.ts
```

Breakdown: 11 API, 8 M1 lifecycle, 9 M2 contract, 3 progress, 12 capture, 8 report/epoch, 2 production artifact, 1 real bridge with 10 steps, 1 exact migration and 1 new transport regression. Evidence is in ignored `test-results/luna-m2-bridge-final.log`. The fixed arithmetic assertion remains independent of implementation-generated expected values.

Before the fix, the new regression failed with `family.html must explain unsupported assessment version`, zero passed and one failed. Evidence is `test-results/luna-m2-version-red.log`. After the fix, the same test executes each of the nine generated transports against an incompatible synthetic catalog. It observes the truthful notice, no authorization lock, and exact retained record/outbox byte arrays. This is VM/fake IndexedDB evidence, not a real database or native encryption claim. Green evidence is `test-results/luna-m2-version-green.log`. A final three-test transport/catalog/gate rerun passed after whitespace normalization.

The real bridge suite uses the existing owned local PostgreSQL/Auth/PostgREST/Edge stack. It adds isolated synthetic accounts/profiles/devices/sessions, never resets or truncates previous history, and verifies actual owner/non-owner Auth, grants, concurrent ingestion, permanent duplicate after receipt removal, conflicts, source expiry/revocation, immutable atomic correction, full summaries and revision paging. All 10 steps passed again after review changes. Exact complete M1 then M2 migrations applied in a separate real PostgreSQL/pgcrypto proof database. Its function definitions matched the integration database with only CR normalization. SQL narration cleanup required replacing the local dispatcher definition only; no hosted migration or retained-row mutation was performed for that cleanup.

The Edge entry, integration server, exact-schema test and new transport test passed Deno strict checking. The report builder emitted an empty patch. The reviewer builder emitted only its existing per-file headers, with no change hunks. All nine transport blocks match the template; all eight capture blocks match their generated content. All nine HISTORY/REPORT/JPEG flags are false, all adapters null, family M1 true and eight reviewer access flags false. CRLF/no-BOM and diff checks passed for all 27 source-commit files. Incidental Deno lockfile discovery was inspected and restored before commit.

## Fresh BrowserOS observations and limits

Luna started the owned loopback production-mode host on port 8767 because the prior host had stopped. It uses the real local service, a visibly labeled synthetic session and null fixture adapters. Existing durable epoch state was preserved. The synthetic session's epoch was aligned to that state in the owned browser tab; no stored epoch, ciphertext, user history or hosted state was reset. This is an authorized synthetic browser fixture, not a newly demonstrated parent login or cold offline unlock.

At selected Q2 and revision `7`, fresh BrowserOS reads across family.html and all eight named reviewers returned server provenance, null local adapter and canonical academic digest `5e1e0f534916b721c2f2eebdc1c20ad90bf5c8ce7001d08511b66dd4a2fd8837`. Both Q1 and Q2 reviewer pages displayed the selected Q2 report without changing question scope. In a fresh Language reviewer page, a temporary browser response seam changed the catalog version to 2. The actual Sync path displayed the repaired version notice and retained credentials/projection. The fetch seam was restored immediately. The subsequent same-tab family navigation returned the same real-server digest.

Mason's earlier native exam finalizer, lost-ack retry, offline resume and delayed-ack epoch evidence remains separately labeled in MASON_M2_BRIDGE_REPORT_v1. Luna freshly reran real service duplicate/revocation tests and all-nine deterministic epoch scheduling tests, but did not repeat those native capture races. No fresh native parent-login, Android/iOS, mobile sharing, JPEG, decoded export, hosted operational profile, performance benchmark or production readiness claim is made.

## Plugin gate and Quinn packet

ponytail-review verdict: Ship for the reviewed local bridge. Both independent Thermos passes completed; the quality findings above are resolved. The mandatory plugin audit is `LUNA_M2_BRIDGE_PLUGIN_AUDIT_v1.md`. Local source commit is recorded above with the repository-required Grok attribution. No push, preview deploy, hosted call, activation, account recreation, secret rotation or JPEG work occurred.

Quinn should test source commit `ed283cd85cacccd2a98618445c0c8a5cc4378684` or the documentation-only audit child, confirming their application/test trees match. Independently rerun the 56-test command, inspect the manifest regression and exact retained ciphertext assertions, confirm generator/gate parity, and inspect the actual SQL/Auth/Edge negative cases. Keep real-stack, VM scheduling and fresh native-browser claims distinct. Retain the existing synthetic rows and ignored credentials; do not run the old destructive M1 reset-fixture suite against M2 history. The owned 8767 host may remain available for review; no unknown process was stopped.

Ready for the user-authorized Quinn bridge gate. No downstream seat was invoked by Luna. Deployment and client activation remain blocked pending Quinn PASS and a separately authorized release with the setup preflight. JPEG remains a separate unfinished slice.

[LUNA] M2 bridge v1.0, 2026-10-25.
Status: COMPLETE.
Key outputs: reviewed and locally committed gated bridge; one MED fix and two lean cuts; 56 passing checks plus fresh nine-page server parity.
Blockers: none for Quinn. Deployment and activation remain blocked.
Next recommended: authorized Quinn bridge tests.
