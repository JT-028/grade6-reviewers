# QUINN TEST REPORT — M2-B v1.0

Historical failure report. Luna reviewed the subsequent repair in `LUNA_M2B_REVIEW_v2.md`.
The original BLOCKED verdict and reproduction below remain evidence for the tested baseline.
Luna's repair review does not replace Quinn's required rerun on the repaired commit.

Date: 2026-10-25, Asia/Manila. Verdict: **BLOCKED for local M2-B acceptance** by one reproducible HIGH access-invalidation defect. QA execution is complete; no application repair, commit, push, deployment, or next agent invocation occurred.

Tested HEAD: `99682df786c19c4732206dd491048ebdb0b432c3`, branch `codex/m2b-local-progress`. Verified HEAD changes only Luna's two review documents relative to reviewed implementation `f2561d44be2611dae5db06a9a2d1eb92d7ac8d87`. Initial working tree was clean. The final run adds only Quinn's uncommitted regression to that source.

Inputs by reference: REX_M2_REQUIREMENTS_v2/v3, ALEX_M2_PLAN_v2/v3, ARIA_M2_BLUEPRINT_v2 (including its baseline references), M2_CONTRACT_FIXTURES_v1, MASON_M2B_REPORT_v1, LUNA_M2B_REVIEW_v1 and LUNA_M2B_PLUGIN_AUDIT_v1. Quinn and BrowserOS neo skills applied. Local B excludes the production bridge and M2-C JPEG; their absence is not the reason for this verdict.

## Test summary and reproduction

Baseline run: **47 passed / 0 failed / 0 skipped**. Final combined run: **48 tests, 47 passed / 1 failed / 0 skipped**. Focused regression also failed independently, 0 passed / 1 failed / 4 filtered. Filtered tests are not counted as skips. Final command:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
```

Focused reproduction:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --filter "Quinn epoch" tests/family/m2_report_test.ts
```

Layer counts: API/auth 11 PASS; M1 lifecycle 8 PASS; M2 repository/contracts 9 PASS; pure numerical/projection 3 PASS; reviewer capture 12 PASS; report controller 4 PASS, 1 FAIL. API and repository tests use injected local repositories. Controller tests execute actual inline code in a VM with fake IndexedDB and real WebCrypto. These are not native-browser or SQL integration tests.

## HIGH — report redraw after durable access epoch invalidation

Failing test: `Quinn epoch advance during report encryption clears private projection before redraw`, `tests/family/m2_report_test.ts:107`. Assertion at line 127:

```text
Expected null private projection and no 80.00% after epoch advanced; actual projection=true visible80=true
```

Reproduction timing: begin authorized child A Q2 report load at epoch 0; allow bootstrap, pending read, progress and response-epoch checks to complete; suspend WebCrypto encryption at the cache boundary; write epoch 1 through a separate IndexedDB transaction, representing an access invalidation whose broadcast was missed; resume encryption. The cache transaction sees epoch 1 and aborts its write. This durable-write protection PASSes. However, `load` catches that abort as an ordinary cache failure and calls `draw` with the old private projection. The key/projection remain in the owner, 80.00% is visible, and the notice says the report loaded but the cache was not saved.

Expected: fail closed and clear decrypted private state when the cache transaction discovers epoch mismatch; no report redraw or retained private projection from that invalidated owner. Actual: no saved report, but private projection and score redraw survive. This is a local controller access failure, not a claim of a production incident or cross-family network disclosure. All production M2 gates remain off.

Root boundary: `tests/family/m2_report_template.js:57` aborts on epoch mismatch; line 184 catches every cache error without distinguishing access invalidation; line 186 redraws. Representative generated owner: `Math6_Q2_Review_Module_v1.0.0.html:5145` and `:5272`. All nine report blocks are byte-identical (SHA-256 `dfeb965695b47b2efb16648da58b10bd35fab0cc921bf4d1e388fcc893dbdc7d`), so family.html and all eight reviewer owners share the defect. Test execution reproduces the race in Math Q2; nine-owner blast radius follows from verified identical code, not nine separate native-browser race runs.

Recommended Mason repair: distinguish access/epoch failure from ordinary cache persistence failure, invalidate/clear the owner on access mismatch before any later callback can draw, and propagate the fix through all nine owners. Keep ordinary quota/cache failure outcomes honest. Retain the red test unchanged as the regression; Luna reviews the repair and QA additions, followed by Quinn rerunning the affected checks. No repair was silently applied by Quinn.

## Acceptance and DoD traceability

| Requirement / Alex task | Evidence and result |
| --- | --- |
| US-201/202; 1.2, 2.1, 2.1a, 4.1a | PASS: immutable baseline, correction, distinct retake, duplicate/concurrent/conflicting delivery, finalized zero, abandoned/malformed exclusions; actual eight finalizers and 64 starts pass. Corrections retain their date and do not improve baseline. |
| US-203/208; 4.2, 4.4 | PASS locally: four subjects/eight type cards, honest empty subject/quarter, no quarter fallback, error is not successful empty. Parent B native-browser Q2 stays Q2, all eight summaries empty and pending_count 0. |
| US-204; 3.2, 4.3 | PASS local fixture ownership/forged scope checks and parent selected-child transition. Browser A-to-B removes A heading/scores immediately; no child selector on child report. Real hosted identity/SQL isolation remains bridge evidence. |
| US-205/206/207; 1.1, 1.3, 2.2, 2.2a, 2.3 | PASS: fixed literals verify raw fractions, grade policy, first result, same-grade change, equality, zero-prior including 0-to-0, UUID tie, late t2, revised assessment and unknown chronology. Exam 42/70 to 53/70 gives 75.71%, +15.71pp, +26.2%, FS. |
| US-209/C3; 2.4, 4.4 | PARTIAL/FAIL: delayed child/quarter response, ordinary clear, revoke, offline stale label and response-time epoch mismatch pass. Newly added cache-time epoch race fails as above. |
| History/revision; 2.2, 4.4 | PASS fixture fixed-revision traversal excludes late arrivals; fresh refresh advances revision; malformed history rejected. Complete history allows pending middle result; failed/incomplete history retains confirmed pair separately with partial label; acknowledged pending detail disappears on refresh. No production keyset/large-history performance certification. |
| US-210; 1.5, 2.5, 2.6, 4.2a, 5.1a | PASS local canonical parity: fixed complete projection/digest in all eight inline owners; actual BrowserOS family plus eight existing Report Card tabs agree on Q2 digest with real retained synthetic pending ciphertext. Guest values do not replace private rows. |
| Privacy/US-213 B subset; 1.6, 4.8 | PASS strict field rejection, assessment/catalog binding, unknown private-field exclusion, text-node display, encrypted cache and child/store AAD tests. FAIL access epoch at cache transaction boundary. JPEG-specific artifact/metadata tests deferred to C. |
| Capability isolation; 3.3, 4.1 | PASS source check: nine history/report/JPEG flags false and adapters null; eight reviewer FAMILY_ENABLED false, family M1 true. No public URL/query fixture bypass added. Local fixture resources observed only on loopback. Existing M1 anonymous-request regression passes. |
| Accessibility/regression; 4.5, 5.1 | PASS observed 390px family report width 390/no horizontal overflow, keyboard quarter change and Enter refresh, visible solid focus outline, Report loaded text status. Eight reviewer navigation and real all-eight report rendering pass. Native mobile and complete assistive-tech audit not claimed. |
| US-211/212 and US-213 export subset; 4.6–4.8 | DEFERRED by authorized B scope: JPEG preview/encode/share/save/native-phone/metadata/error and pending-image invalidation belong to M2-C. Disabled Prepare button verified. |
| Bridge/release tasks | DEFERRED: schema/authenticated routes, production catalog/capabilities, durable acceptance cursors, real queue replay and hosted synthetic checks. None silently enabled. |

Independent oracle audit: reviewed literal expected rows using ordinary fraction arithmetic, not the reducer/generator to create new expectations. For example, 53/70 is 75.714285…%; the change from 42/70 is 110/7=15.714285… points; relative change is 11/42=26.190476…%. The other literal rows give +20/+33.3, +15/+25.0, -15/-20.0, zero-prior unavailable, and -100.0 on nonzero-to-zero. Grade mapping uses the existing rounded percentage descriptors. The frozen full projection/digest assertion passes unchanged. Mason's late oracle freeze remains the disclosed accepted process deviation, not retroactively fixed sequencing.

## Actual browser evidence and scope

BrowserOS neo: Windows desktop Chrome 155.0.0.0, existing loopback fixture server at port 8766. Used one owned tab; left user's tab untouched. Reused server, did not stop another process. No hosted credentials, real child data, remote mutations or password requests.

Visited all eight named reviewers, existing `#report` boundary, explicitly selected Q2 where originating Q1 defaulted differently; family child report also Q2. Each has eight report cards and pending_count 5. All nine academic digests equal `250b996d34d2caa6829e2e79a09b9b4e5f54dc4fa5e9df89da856be94d6175c2`. Family document has additional unrelated articles; the report region itself has eight. Pending records were already present synthetic encrypted records and were neither deleted nor rewritten. Dates/timezone, baseline/correction separation and raw/grade/deltas appeared in real DOM. Same-tab family Math Q2 link reached its existing tab; asynchronous bootstrap required waiting for the actual report selector before reading projection. An initial premature read of null was a tooling timing failure, not counted as a defect.

390x844 desktop emulation observed family report document width 390, eight cards, keyboard quarter change to Q1, focused Refresh report with solid outline and Enter activation, text status Report loaded. Emulation was cleared afterward. This is responsive-layout/keyboard evidence only, not Android/iOS native evidence. Parent fixture selected A then B: old A rows disappeared immediately; B remained Q2, pending_count 0, all eight empty. Browser storage and DOM are real here; the HIGH race reproduction uses controlled VM/fake-IDB scheduling, not mutation of the shared real-browser epoch.

Generator dry run with allow-read/allow-env emitted an empty patch. Initial dry run lacked env permission and failed before execution; corrected command passed. TypeScript dependency discovery temporarily touched deno.lock; Quinn restored only that incidental lockfile change. Nine sources CRLF/no BOM; git diff --check passes. Report blocks identical across nine. M2-A 64 catalog/inventory checks and guest/finalizer regressions pass. Guest PNG source preservation is prior Luna evidence plus unchanged application source at tested SHA; Quinn did not download/decode eight PNGs. No fresh full Q2 string-leak scan or exhaustive question-content audit claimed.

## Coverage and remaining limits

Coverage measured on baseline 47-test run with `--coverage=.quinn-m2b-coverage`; final added red run did not recalculate coverage. Percentages concern imported Deno modules; VM inline HTML execution is not attributed by these percentages.

| Module | Lines | Branches |
| --- | ---: | ---: |
| auth.ts | 21.3% | 100.0% |
| crypto.ts | 91.0% | 83.3% |
| index.ts | 54.5% | 78.1% |
| m2-contract.ts | 91.4% | 91.9% |
| m2-progress.ts | 89.6% | 86.5% |
| validation.ts | 75.6% | 80.0% |
| m2_browser_fixture.ts | 69.5% | 75.5% |
| m2_catalog_inventory.ts | 96.6% | 83.3% |
| m2_fixture_repository.ts | 86.1% | 92.5% |
| All measured files | 75.3% | 86.0% |

Below-80 line coverage advisory: auth, index, validation and browser fixture. High branch percentage with sparse executed lines, especially auth, is not full auth assurance. Hosted SupabaseRepository/real_stack and database suites were not run in this local B check. Report cache decryption/wrong quarter-schema AAD, blocked native IndexedDB upgrade/versionchange, missing report key, long retained-history stress, native mobile, saved PNG decoding and exhaustive focus/expiry combinations lack fresh dedicated B evidence; existing M2-A storage regressions do not certify every report-cache path. Cache currently stores encrypted reports but does not cold-load them to bypass online bootstrap. No measured percentage certifies unimplemented SQL/bridge or JPEG. Generated-inline coupling makes direct coverage attribution limited; no refactor was undertaken.

## Notes for Dep and handoff

Do not publish enabled M2 or treat this report as PASS. The HIGH defect blocks local B acceptance until repaired/reviewed and affected QA passes. Production M2 flags remain disabled, so this finding does not establish a live incident. Later production bridge and M2-C each need their own applicable verification; no publication is authorized by this report. Preserve immutable rows/ciphertext and M1 behavior.

Working-tree deliverables: this report and the intentionally red `tests/family/m2_report_test.ts` addition only. Automatic policy rejected recursive deletion of temporary coverage output; the orchestrator preserved it instead at ignored `test-results/quinn-m2b-coverage-20261025/` using an exact-path move. No coverage evidence was deleted. Recommended next: user-directed Mason repair, Luna review/local commit including QA additions, then affected Quinn rerun. No automatic handoff.

[QUINN] M2-B v1.0 — 2026-10-25
Status: BLOCKED
Key outputs: 47 passing checks; one retained HIGH regression; real nine-surface parity and local QA traceability.
Blockers: private report redraw after cache-time epoch invalidation.
Next recommended: Await user-directed Mason repair; no deploy.
