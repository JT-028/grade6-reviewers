# QUINN TEST REPORT — M2 production bridge v1.0

2026-10-25, Asia/Manila. Status: COMPLETE. Verdict: PASS for the local production bridge at reviewed source `ed283cd85cacccd2a98618445c0c8a5cc4378684`.

Audit HEAD tested: `e7305914f0e978b327b04e700b888e3fe581526d`, branch `codex/m2-production-bridge`. Its application/test tree equals the reviewed source; only Luna's two audit documents differ. The working tree was clean before QA. At QA handoff, this report and the new queue regression file were uncommitted outputs. Luna subsequently reviewed and locally committed them; see LUNA_M2_BRIDGE_QA_REVIEW_v1.md. No application defect or application change was found.

Inputs: Rex M2 v1–v3; Alex M2 v1–v3; Aria M2 v1 schema/API and v2 production bridge/capability/queue amendment; Mason M2 bridge report/setup; Luna M2 bridge review and plugin audit. JPEG/export amendment tasks remain a separate unfinished slice.

## Summary and commands

**61 distinct executable tests passed, zero failed, zero ignored:** the independently rerun 56-test reviewed suite, including 10 actual SQL/Auth/Edge steps, plus five new transport/capability regression tests. Repeated coverage runs are not additional tests. Browser observations are reported separately below.

```powershell
$env:FAMILY_REAL_STACK='1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --allow-net --allow-run --allow-write tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts tests/family/m2_production_test.ts tests/family/m2_real_bridge_test.ts tests/family/m2_schema_test.ts tests/family/m2_transport_test.ts
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/m2_bridge_queue_test.ts
```

Ignored evidence: `test-results/quinn-m2-bridge-final.log`, `quinn-m2-queue.log`, `quinn-m2-native-evidence.json`, `quinn-m2-coverage-tests.log`, `quinn-m2-coverage.txt` and the coverage directory. Existing SQL diagnostic logs contain expected denied immutable mutations; the passing assertions verify those failures. They are not suite failures.

## Results by layer

| Layer | Tests | Result and boundary |
| --- | ---: | --- |
| M1 API | 11 | PASS; verified-parent boundary, opaque roles, strict input/CORS/idempotency, PIN/replay behavior and error minimization; injected repository tests. |
| M1 browser lifecycle | 8 | PASS; production initialization, closed invalid configuration, delayed signout/unlock and durable epoch; VM scheduling. |
| M2 contract/catalog | 9 | PASS; 64 actual inventories, immutable retakes/correction/replay/conflict, malformed/zero/chronology cases and fixture revision paging; fixture repository explicitly distinguished from SQL. |
| M2 progress | 3 | PASS; independent frozen arithmetic oracle, chronology/full-key selection, quarter isolation and strict report DTO rejection. |
| M2 capture | 12 | PASS; every actual set start and eight actual finalizer hooks, AES-GCM/AAD/tamper checks, transaction/quota/epoch guards; VM/fake IndexedDB. |
| M2 report/epoch | 8 | PASS; all-eight generated parity, delayed child/quarter responses, fixed-revision complete history overlay, typed epoch loss versus ordinary cache failure and superseded callbacks; VM/fake IndexedDB. |
| Production artifacts | 2 | PASS; metadata-only frozen inventory/digest and all-nine template/gate parity, no fixture imports/shared browser script. |
| Actual bridge | 1 + 10 steps | PASS; actual local PostgreSQL/pgcrypto, Supabase Auth, PostgREST and Edge HTTP. |
| Exact migration | 1 | PASS; complete M1 then M2 SQL in a new independent real database, grants/catalog and all relevant function definitions equal the active integration stack after CR normalization. |
| Unsupported manifest regression | 1 | PASS; actual generated transport in all nine VM contexts, version notice and exact ciphertext retained without authorization lock. |
| New queue/capability regressions | 5 | PASS; details below; real generated JS/native crypto with fake IndexedDB and controlled HTTP replies, plus actual Edge handler with injected repository. |

The ten real bridge steps independently passed: owned synthetic environment without reset; actual capabilities/bootstrap/full catalog; concurrent acceptance/permanent replay after delivery-receipt removal; full-scope independent arithmetic and parent/child parity; strict filters/revision cursors/tampering; atomic optional correction/immutable guards; expired original session versus revoked source/window denial; browser grants denied; source revocation before duplicate disclosure; current expiry/revocation/archive/device-generation/PIN/allowlist checks before reads/replays.

The fixed real oracle is 42/70 then 53/70: latest 75.71%, +15.71 percentage points, +26.2% relative, FS. Expected constants are independent of the implementation reducer. The pure frozen oracle additionally covers improving/declining, equal displayed percentages, changed score with same grade, missing baseline and zero-prior relative-unavailable cases. An unverified completion invalidates directional chronology without losing the retained result.

New `tests/family/m2_bridge_queue_test.ts` closes previously unexercised delivery boundaries:

- All nine actual generated transports send serially at most 25 selected-child entries from 26 pending results; exactly 25 encrypted records become confirmed together with outbox deletion. The 26th and foreign-child entry remain byte-identical, and the UI requests Sync remaining.
- Wrong-ID acknowledgement, permanent 409 and 422 each send once, retain exact complete record/outbox ciphertext and do not lock valid authorization or spin. Permanent validation/conflict errors explain that the saved result needs attention.
- A durable metadata epoch advance during the POST reply causes acknowledgement-transaction abort, a lock callback, and exact encrypted retention in all nine transports.
- 401/403 invoke lock; ordinary 500 retains valid authorization. All retain pending ciphertext.
- Missing capability operation, malformed installed status, incompatible contract/count/digest each preserve M1-only public health while child catalog returns 503 M2_UNAVAILABLE before a private read. These are injected backend incompatibility cases, not a claim that the installed SQL was removed or corrupted.

## Fresh BrowserOS evidence

Used BrowserOS neo, desktop Chromium, against the already-owned loopback production-mode host on 8767. It injects static test gates and public local configuration, supplies a labeled synthetic session, and forwards to actual local SQL/Auth/Edge with **null fixture adapters**. Neither hosted services nor real family identities were used. The host's old epoch-0 injected session correctly failed against retained durable epoch 1. QA aligned only that synthetic tab's injected session to the existing epoch; it did not reset epoch/history/storage. Synthetic exam answers were supplied through page instrumentation to the actual production finalizer; this is integration proof, not a demonstration of manually answering 70 questions.

1. **Lost acknowledgement:** actual Math Q2 exam finalizer persisted encrypted records/outbox before POST. Attempt `b4f887f2-d38f-460d-9fbe-581724271818` received real 201; a browser fetch seam discarded the acknowledgement. Both stores remained present. Explicit retry returned real 200 for that same UUID, exactly one server row existed, the decrypted encrypted record was confirmed/server, and only its outbox was removed. Baseline remained 42/70.
2. **Same-tab resume:** a second finalized 53/70 exam, `3c3a46af-0678-4671-add0-9d6d4fec21e4`, remained encrypted when its delivery seam simulated offline failure. The actual Family progress link navigated the same tab to `family.html#q2`; resume performed real 201 acceptance. Exactly one server row, deleted pending entry and server projection with pending_count 0 were observed at revision 9.
3. **All-nine parity:** family.html and every named History/Math/Geography/Language Q1 and Q2 reviewer displayed Q2/revision 9, server provenance and null adapters. Each academic digest was `50d89ff846dccce46515751fb0d041e3bd6e8b009e058bde297339e2b185eb41`. Actual Report Card buttons opened the reviewer reports; selecting Q2 in a Q1 reviewer affected report scope only. The later race attempt advances the backend revision after this parity checkpoint; revision 9 remains the recorded fixed snapshot.
4. **Access loss during held acknowledgement:** a Language Q2 actual finalizer persisted attempt `8710264e-7a56-4f95-a0f6-977de70928d7`. Its real 201 reply was held after server acceptance while a private projection existed. Calling the existing invalidation boundary cleared credentials and projection. Releasing the reply left record and outbox byte-identical. Durable epoch was not rewritten for this native test; the separate all-nine VM test exercises the durable epoch transaction race. The browser tab remains locked with encrypted pending work retained, intentionally.
5. **Guest PNG regression, all eight:** served unmodified gated files on an owned 8766 static server. Opened each guest Report Card, invoked its existing export function and intercepted only the toBlob callback to inspect the actual native PNG while suppressing download side effects. All eight returned image/png, signature `137,80,78,71,13,10,26,10`, and decoded successfully with createImageBitmap. Width was 680; height 520 except the existing populated Math Q1 guest state at 594. FAMILY_ENABLED/HISTORY/REPORT/JPEG were false and adapters null in all eight. This proves native encoding/decoder compatibility, not filesystem saving, mobile sharing or visual JPEG readability.

Temporary fetch, flusher and Canvas seams were restored. No unknown server or other agent's tab was stopped/changed. The 8766 server started by Quinn was stopped after checks; the pre-existing 8767/local database stack was preserved. Existing synthetic Auth/history was never reset or truncated. The suite adds bounded fresh synthetic profiles/sessions/accounts; native checks add three new synthetic attempt identities and intentionally retain their immutable history.

## Acceptance criteria and DoD traceability

| Requirement | Alex tasks / bridge contract | Executed evidence |
| --- | --- | --- |
| US-201 immutable eligible attempt | v2 1.2, 2.1, 2.1a, 4.1a; Aria 2/5 | Eight-hook capture suite; actual concurrent/permanent replay SQL steps; native finalized save/lost ack. |
| US-202 correction separate from baseline | v2 1.2, 2.1a, 4.4 | Actual same-transaction correction, update/delete/later-insert denial, invalid correction leaves no baseline; frozen reducer/capture cases. |
| US-203 separate subjects and selected quarter | v2 4.2; v3 2.5 | Four-subject projection tests; actual Q1-empty/Q2-populated server scope; all-nine Q2 browser snapshot. |
| US-204 authorized child/parent scope | v2 3.2, 2.4, 4.3 | Actual owner/non-owner Auth, wrong token roles, foreign child, service/table grants; source/current invalidation matrix; delayed child-selection VM cases. |
| US-205 comparable dated latest/prior | v2 1.1, 2.2, 2.2a; Aria revision paging | Independent fixed 42/70→53/70 oracle, completion versus receipt late arrival, immutable accepted revision traversal, matching set/revision and HMAC role/child/filter tampering. |
| US-206/207 baseline and precision | v2 2.2a, 2.3 | Frozen positive/reverse/zero/equal/same-grade oracle and unknown-chronology cases; no invented zero baseline. |
| US-208 honest empty states | v2 2.1, 2.3, 4.2, 4.4 | Empty selected quarter, subject and rejected-only contract/report cases; no cross-quarter fallback. |
| US-209 delayed/offline/error state | v2 2.4, 4.4; Aria 5 | Full matching fixed-revision history overlay; all-nine epoch/cache/supersession regressions; new permanent/version/auth/ordinary-server error tests; native offline resume/access-loss ack. |
| US-210 existing tabs / parity | v3 1.5, 2.5, 4.2a | All eight actual Report Card buttons plus family view at identical server quarter/revision/digest; contradictory guest separation in report tests. |
| C1–C4 identity, calculations, lifecycle, privacy | v2 matrix / Aria 2–5 | Contract/progress/capture/actual SQL/Auth/Edge and native boundaries above, metadata-only source catalog and strict DTO sentinel rejection. |
| Gated local bridge / release report | v2 3.3, 5.2–5.4 superseded M1 boundary | Committed Luna PASS; independent QA at exact SHA; all-nine closed M2 gates and null adapters, family M1 true/eight reviewer access false; no hosted action. |
| M1 and guest behavior | v2 4.1; v3 4.2a | 11 M1 API + 8 lifecycle tests, exact preserved M1 delegate definition; all-eight native gated guest PNG decoding. |
| US-211/212 and export part of US-213 | v3 2.6, 4.6–4.8, 5.1a | Outside bridge slice. JPEG implementation/mobile/share/save/privacy export evidence remains required later; no completion claimed. Existing broader 390px/accessibility evidence was not re-certified by this bridge pass. |

The historical Alex v1 global false condition is superseded by Aria v2: family M1 is already enabled; new M2 gates remain false. Requirements are evaluated against that approved boundary.

## Coverage validity and limits

To measure the locally instrumentable layer, independently ran API, M2 contract, M2 progress and the first four new queue tests with `--coverage=test-results/quinn-m2-coverage` (27 passing tests), then `deno coverage test-results/quinn-m2-coverage`. The fifth added incompatibility test passed afterward in the final five-test queue run; the following captured percentages deliberately describe the 27-test instrumented checkpoint.

| Production module | Lines | Branches |
| --- | ---: | ---: |
| auth.ts | 21.3% | 100.0% |
| crypto.ts | 91.4% | 83.3% |
| index.ts | 54.9% | 75.9% |
| m2-bridge.ts | 13.4% | 33.3% |
| m2-contract.ts | 91.4% | 91.9% |
| m2-progress.ts | 89.6% | 86.5% |
| validation.ts | 75.6% | 79.3% |

Tool total, including test helpers: 69.7% lines / 85.6% branches; it is not a production-system coverage percentage. Below-80% advisory modules: auth, index, m2-bridge and validation. Auth's apparently 100% branches with 21.3% lines illustrates why this restricted metric cannot establish backend confidence. The actual Edge process, PostgreSQL functions, browser and VM-evaluated inline strings are separate runtimes and absent from this coverage collector. Browser transport/HTML and SQL line/branch coverage are N/A; explicit executed behavior is recorded instead. No synthetic 80% gate, inflated full-system percentage, CPU/performance benchmark or PGlite-as-real-database claim is made.

## Artifact checks, findings and release notes

Report builder emitted an empty patch after granting TypeScript's required env read; the first missing --allow-env invocation was a harness permission error, corrected without source changes. Reviewer builder emitted eight file headers and no change hunks. Exact migration SHA256 is `432305270E36247E9D69233997A19C513917BDEF3277905E964256FFFBD61CCC`; catalog file SHA256 is `F749F9A32F2D7A85628A5510E94D657A58BA8889C75BB81FA60EB11D604E0D2E`, matching the release packet. The generator's incidental TypeScript lockfile discovery was inspected and restored. New tracked-intended outputs use CRLF/no BOM. No published HTML, migration, Edge implementation, catalog or existing test was modified. No secrets or raw runtime credentials entered QA outputs.

No HIGH/MED/LOW application defect was found. There are no retained red application assertions. Five new tests are behavior gaps closed, not bug fixes. Native parent interactive login, cold offline unlock, Android/iOS, 390px, JPEG generation/share, hosted M1 preflight, deployment and production activation were not performed. Actual local owner Auth was exercised safely by the integration suite without email sending or password output.

**Notes for Dep:** this PASS certifies the reviewed local bridge only. Luna follow-up review and local commit are recorded in LUNA_M2_BRIDGE_QA_REVIEW_v1.md. The five affected tests must pass on that committed QA addition before release use. Hosted schema equivalence/backup/ledger reconciliation, exact reviewed additive migration/Edge deployment, real authorized operational checks and separately reviewed client activation remain release work. Use M2_BRIDGE_SETUP_v1 backend-before-client sequence; preserve existing M1 account/schema/history and encrypted queue. All nine M2 flags remain false, all adapters null, family M1 true and eight reviewer access flags false. JPEG stays false/unimplemented. Do not infer production activation or permission to push from this report. No Dep seat was invoked.

[QUINN] M2 bridge v1.0 — 2026-10-25
Status: COMPLETE / PASS.
Key outputs: 61 distinct passing tests plus 10 actual bridge steps; fresh native delivery/resume/access-loss and nine-view parity; all-eight native guest PNG regression and honest coverage report.
Blockers: none in the reviewed bridge. Luna follow-up now records the QA review/local commit. Hosted deployment/activation and JPEG remain separate gates.
Next recommended: main agent relays results and awaits the user's next specialist authorization.
