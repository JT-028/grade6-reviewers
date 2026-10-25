# MASON PROGRESS — M2-B local first slice

Date: 2026-10-24, Asia/Manila. Status: COMPLETE for the authorized local demonstration only.
Branch: `codex/m2b-local-progress`, uncommitted. Baseline: `b34140e01ff1dceb4ca6ea3b742b048b0a6a4d61`.
Authority: ARIA_M2_BLUEPRINT_v2 section 7 first-slice packet; Alex M2 v1–v3 and Rex M2 v1–v3 by reference. No next specialist invoked.

## Delivered files

New:
- `supabase/functions/family-api/m2-progress.ts` — pure rational rounding, completion/UUID selection, matching-set comparisons, full-scope summaries, strict canonical ReportProjection validation and academic digest.
- `tests/family/m2_report_template.js` — maintenance source for duplicated inline report owner, controls, history, encrypted cache, pending overlay and lifecycle guards. Never loaded as a shared browser script.
- `tests/family/m2_build_reports.ts` — TypeScript-to-inline maintenance generator; emits apply_patch patches, supports one filename argument. Generated helpers are inspected in all eight published sources and family.html.
- `tests/family/fixtures/m2-progress-oracle.json` — fixed independent numerical and chronology expectations.
- `tests/family/fixtures/m2-projection-oracle.json` — manually specified complete expected projection; independent canonical SHA-256 `25bc60d141a6cd1d677c2682846a968ac19339d31a59712d7ac3a3b285f7dd63`.
- `tests/family/m2_progress_test.ts` — numerical, chronology, correction, matching and response-validation assertions.
- `tests/family/m2_report_test.ts` — all-eight fixed projection/digest parity, encrypted reports/AAD, scope races, authorization/offline states and delayed pending-middle-result handling.
- `docs/plans/family-progress/MASON_M2B_REPORT_v1.md` — this handoff.

Modified:
- `History6_Review_Module_v1.0.0.html`
- `History6_Q2_Review_Module_v1.0.0.html`
- `Math6_Review_Module_v1.0.0.html`
- `Math6_Q2_Review_Module_v1.0.0.html`
- `Geography6_Review_Module_v1.0.0.html`
- `Geography6_Q2_Review_Module_v1.0.0.html`
- `Language6_Review_Module_v1.0.0.html`
- `Language6_Q2_Review_Module_v1.0.0.html`

Each reviewer now has the generated canonical private-report controller inside its existing `renderReportCardMain` / `reportCardWrapMain` boundary; explicit report-quarter choice, all four subject/two-kind summaries, paged history, online bootstrap/epoch safeguards and a disabled future JPEG action. Guest rendering remains separate. Footer return links carry only the fixed nonprivate quarter.

- `family.html` — canonical selected-child/quarter report, parent profile selection, child same-tab eight-reviewer links, reports-store upgrade, scoped clearing/focus handling. Existing M1 authentication/configuration remains enabled.
- `index.html` — family link follows the selected quarter.
- `supabase/functions/family-api/m2-contract.ts` — exact integer percentage rounding and allowlisted canonical Assessment catalog projection; existing Envelope v1 preserved.
- `tests/family/m2_fixture_repository.ts` — child acceptance revisions, fixed-revision paged local reads and child/parent progress; scope-bound canonical cursor shape with fixture HMAC and an in-memory cursor registry. This is a simulator, not PostgreSQL/keyset or hosted API proof.
- `tests/family/m2_browser_fixture.ts` — dedicated loopback child/parent synthetic report transport and seeded results. Fixture injection alone enables local B; published files retain null adapters.
- `tests/family/m2_reviewer_template.js` — v3 reports store, private report boundary adapter, explicit-quarter retention and reviewer focus/visibility/inactivity/expiry integration.
- `tests/family/m2_contract_test.ts` — completion-order assertions and late-arrival/revision/cursor/parent-empty-scope tests. Prior immutable score assertions retained.
- `tests/family/browser_lifecycle_test.ts` — supplied normal browser `location` and window event APIs to the existing simulated M1 harness; no production behavior bypass.

Pre-existing untracked `docs/plans/family-progress/ARIA_M2_BLUEPRINT_v2.md` was preserved. No unrelated edits removed.

## Checklist / DoD

| Checklist | Result |
| --- | --- |
| 1.4 fixed synthetic expectations | PASS — fixed hand-calculated ratio rows and manually specified full projection/digest, separate from reducer output. |
| 2.1 / 2.1a immutable baseline and corrections | PASS — M2-A validations/replay/capture retained; raw baselines remain immutable and corrections display separately with capture dates. |
| 2.2 completion and matching | PASS — newest anchored completion + lowercase UUID order, immediately preceding same assessment/version; late t2 recomputes t3/t2; unknown chronology suppresses pair/direction. |
| 2.2a exact mathematics | PASS — percentages/pp two decimals, relative one, rational half-up; +15.71pp/+26.2% for 42/70→53/70; zero prior null, first result null, same-grade direction retained. |
| 2.3 explicit states | PASS — empty/first/improved/declined/unchanged, chronology-unavailable, request error and labeled stale/partial/device-only pending. |
| 2.4 / 4.8 scope races and privacy | PASS in simulated lifecycle checks — owner generation, child/quarter/token, sequence, revision and epoch checks, immediate old-row clearing, aborts, lock/revoke/expiry/focus checks, no cold offline unlock. |
| 2.5 / 4.2a canonical all-eight tab + family view | PASS — actual nine-page BrowserOS parity, fixed oracle parity in all eight generated blocks; guest objects never feed private summaries. |
| 2.6 / 4.4 quarter/child/error/offline | PASS — explicit quarter preserved across parent selection, empty B stays Q2, failed response is unavailable rather than successful empty, already-open offline report is stale. |
| 3.2 fixture viewer boundaries | PASS locally — child own scope, selected same-family parent scope, foreign profile denied; parent does not read child-device pending ciphertext. Real SQL/auth evidence remains bridge work. |
| 3.3 capability isolation | PASS — family M1 stays true; eight reviewer FAMILY_ENABLED=false; nine HISTORY/REPORT/JPEG gates false; adapters null. No hosted routes or capabilities added. |
| Local persistence/pending | PASS — v3 adds reports while retaining existing stores, AES-GCM/nonextractable key/fresh IV/AAD, epoch inside write transaction and transaction-complete boundary. Full fixed-revision history required before pending t2 replaces a pair; incomplete history shows pending separately and confirmed pair remains distinct. |

## Executed checks

Final combined local command:

```
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
```

Result: **44 passed, 0 failed**. After adding the direct complete-versus-partial pending-middle-result assertion, targeted `m2_report_test.ts`: **3 passed, 0 failed**. These runs cover **45 distinct passing tests**. API tests use injected repositories; browser lifecycle tests use VM/fake IndexedDB, not real Supabase or native browsers. No hosted M1 checks were rerun.

Existing M2-A all-64 reviewed assessment identities/digests and all-eight actual capture/finalizer tests passed. Guest PNG/export function-to-file-end text is byte-equivalent after newline normalization against HEAD in all eight sources (8/8); no actual PNG download/decoder claim is made. No question pools, published names or content constants changed. `git diff --check` passed.

Actual BrowserOS neo: Windows desktop, browser user-agent Chrome/155.0.0.0. Local server only: `npx --yes deno run --allow-read --allow-net --allow-env tests/family/browser_fixture_server.ts` at 127.0.0.1:8766.

Final browser sweep selected Q2 in each of the eight existing reviewer Report Card tabs and family.html, at the same fixture revision and same five earlier synthetic encrypted pending records on that local origin. **All nine showed eight cards, pending_count=5, and digest `b9ecbe86693bc1c95b4f6c9e1c9289a94a7e6ab667e99ee690c66fe5b1fb99a2`.** This dynamic fixture digest differs from the fixed independent test oracle by design. All JPEG buttons remained disabled.

Browser parent fixture A→B: Q2 retained, old A report absent, all B cards honestly empty, pending_count=0 for parent. Family links were same-tab with no query/private URL parameters. Actual displayed score checks included 12/20→16/20 with +20.00pp/+33.3%, separate 20/20 correction, and 42/70→53/70 with +15.71pp/+26.2% and DNME→FS. Browser emulation at viewport390 measured report clientWidth=370 / scrollWidth=370, eight cards; this is layout evidence, not Android/iOS native evidence.

## Boundaries, limitations and remaining bridge

This is **local demonstration**, not usable live private statistics. No SQL migration, production catalog deployment, real ingestion/progress/history route, capability bootstrap, production encrypted queue flusher, hosted account change, service mutation, commit, push or deployment was performed. Fixtures run only on the dedicated loopback paths and do not fall back from production API errors.

The existing open authorized page retains an in-memory projection marked stale during connection loss. Encrypted report snapshots are written; a cold reload/navigation must authenticate online, and there is no offline cache/PIN unlock. Ciphertext survives lock. JS physical memory erasure is not claimed. Local fixture cursors/revision heads simulate the specified contract with an ephemeral in-memory registry; durable SQL ownership, atomicity, keyset paging and real auth must be independently proved in the production bridge.

No JPEG encoder/preview/save/share or native mobile/Messenger work belongs to this slice. No export/upload/public report URL was created. New Prepare JPEG action is disabled with an explanation until M2-C. Native Android/iOS/OS handoff, JPEG bytes/decoder/readability and real production SQL are explicitly untested here.

Separately authorized Mason production bridge remains necessary: reviewed additive catalog/attempt/correction/progress-head migration, exact production catalog artifact, authenticated routes/query parser and per-request child/source-session ownership, permanent replay, real capability/manifest bootstrap, strict response validation, bounded encrypted queue replay/ack/error handling and bridge setup/reconciliation runbook. M1 schema is already hosted and must not be recreated. Dep may deploy only reviewed/committed and Quinn-passed bridge/client artifacts later. Keep all M2 gates off until that release.

Deviations: no product or production-activation deviation. Numerical oracle rows were fixed during reducer implementation; the complete manually specified projection/digest was added during parity verification, rather than being frozen before the first reducer edit as the packet requested. They are independent fixed expectations now, not expected values generated with the reducer. This sequencing difference is disclosed for Luna. Fixture simulation is intentionally not real backend proof.

Ready for: **Luna review when the user authorizes the next handoff**. No downstream agent invoked. Requested focus: exact matching/rounding/projection validation, all-eight generated diff, encrypted overlay/cache epoch races, unchanged M1 availability and explicit production-bridge gate. Local server and synthetic browser page may be used for review; no private production credentials are needed.

[MASON] M2-B v1.0 — 2026-10-24
Status: COMPLETE (authorized local first slice)
Key outputs: Canonical family/all-eight summaries; fixed ratio/projection oracles; revision-stable fixture paging and encrypted scoped lifecycle.
Blockers: None for local B; production statistics require the separate bridge and release gates.
Next recommended: Await user; Luna review.
