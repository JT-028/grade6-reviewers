# Quinn M2 activation QA report v1

2026-10-25, Asia/Manila. Status COMPLETE. Activation gate PASS.

Tested checkout: `d548af559bfb32f0a2be9f05a1bf81bbdc02404a` on `codex/m2-production-bridge`. Reviewed application source: `08f0d64c164be99d52d0648ae5c586d7e099d16f`. Independently checked that only Luna's two audit documents differ between these commits. No application or tracked test changes were made during QA.

Inputs: Luna M2 activation review v1 and plugin audit v1; Mason activation report v1; Rex M2 requirements v1-v3, Alex M2 plans v2-v3 and Aria M2 blueprint v2. This gate covers the separately authorized history/report/client activation and additive storage repair. JPEG remains a deferred deliverable, not a completed requirement.

## Summary and reproducibility

65 tests passed, 10 nested actual local backend steps passed, zero failed, zero ignored. These are unique tests, not a sum of repeat runs. Ignored log: `test-results/quinn-activation-final.log`.

Executed Mason's twelve-file command with `FAMILY_REAL_STACK=1`, Deno `--no-lock`, `--config supabase/functions/family-api/deno.json` and read/env/sys/net/run/write permissions:

`api_test.ts`, `browser_lifecycle_test.ts`, `m2_contract_test.ts`, `m2_progress_test.ts`, `m2_browser_test.ts`, `m2_report_test.ts`, `m2_production_test.ts`, `m2_real_bridge_test.ts`, `m2_schema_test.ts`, `m2_transport_test.ts`, `m2_bridge_queue_test.ts`, `m2_activation_storage_test.ts`, all under `tests/family/`.

Both maintenance builders were independently run with read/env permissions. Reviewer output contains only file headers and no change hunks; report output is an empty patch. No generator drift. `git diff --check` passed before report creation. No dependency lock changed.

Line/branch coverage was not instrumented; no percentage or per-module 80% claim is available. This is a coverage-report advisory, not evidence of a failing module. VM and fake-IDB tests do not establish native-browser or real SQL behavior by themselves; the separate layers below supply those checks.

## Results by layer

Unit/contract PASS: raw-score school grades; independent ratio/delta oracle; absent/zero baseline, unchanged/decline/improvement; content identity across 64 frozen assessments; matching revisions and sets; correction versus baseline; chronology and late arrivals; strict response validation and malformed report rows.

VM/client integration PASS: actual generated finalizers in all eight reviewers; immutable encrypted records and queue; abandoned/disabled capture; AES-GCM child/store AAD rejection; quota/crypto retries; epoch/lock/expiry races; all-nine bounded 25-result own-child foreground flush; malformed acknowledgement and permanent 409/422 retention; access denial versus ordinary server failure; superseded cache writes; missing/incompatible installed catalog fails closed while M1 health remains usable. Anonymous initialization sends no private request. Active history/report gates, JPEG false, adapter null, exact all-nine transport parity and absence of browser fixture imports are asserted.

Storage PASS: each of the nine real transport copies creates five stores from pristine fake IndexedDB, additively upgrades v2 while retaining opaque credential/record/outbox sentinels, and rejects a blocked upgrade then closes its late connection so a later v4 open succeeds. No storage reset or destructive repair was used.

Actual local SQL/Auth/PostgREST/Edge PASS: ten dependent steps verify exact installed 64-row catalog/capabilities; real cryptography and transactional schema; concurrent ingest 200/201 and one immutable result; permanent duplicate after lost receipt; fixed 42/70 to 53/70 oracle (75.71%, FS rounded 76, +15.71 pp, +26.2%); parent/child summary parity; stable revision paging with late arrivals; correction separation; wrong-role/private-table denial; current/source session, revocation, expiry, archive, PIN, generation and allowlist boundaries. Existing synthetic local stack/data were preserved; suite-created isolated synthetic records remain as designed.

## Independent native BrowserOS proof

Fresh loopback origin `http://127.0.0.1:8773` served candidate files through an ignored copy of Mason's local proxy, changing only its port and synthetic banner. It proxies the actual existing local stack at 54321, substitutes local public URL/key/readiness and supplies an actual synthetic parent Auth session through official generateLink/verifyOtp without mail or password change. This simulates parent session entry; it does not test the password sign-in form. There was no child session injection, fixture adapter, mocked API response or hosted mutation.

1. Opened family.html first. Created `QA Quinn activation fresh` with the actual parent profile form. In a new child tab requested `QA Quinn activation tablet`, selected only the new profile, reviewed approval and confirmed through the actual controls.
2. Before PIN unlock, native IDB contained credentials=1, metadata=0, records=0, outbox=0, reports=0; child session was absent. This independently proves family-first five-store initialization on a new origin, without deleting a database.
3. Actual PIN form unlocked the approved profile. Its Q2 Math link navigated the same tab to the real reviewer Report Card. Actual bootstrap/catalog/progress returned 200. Family/history/report were true, JPEG false and adapter null.
4. Synthetic answers passed through actual exam starters/finalizers and real encrypted production capture. Three immutable attempts were accepted and survived reload: native records=3, outbox=0, credentials=1, metadata=2, reports=1; server projection revision 3, quarter 2, provenance server. The first instrumentation call finalized immediately before its asynchronous clock authorization completed, so it correctly became client_unverified; two subsequent captures explicitly awaited authorization and received clock anchors. The retained unknown-order attempt correctly makes the subject report say chronology unavailable, with no invented directional comparison. Native trend arithmetic is therefore not claimed for this profile; the independent real-stack fixed arithmetic test above passed. No attempt was deleted to change that outcome. A post-finalizer instrumentation read encountered an already-cleared `exam`; persistence and reload verification established the successful result.
5. Switched the actual report quarter selector to Q1: server projection quarter 1, all subject exam/pop results empty. Q2 attempts did not leak into Q1.
6. On an independent sessionless static-origin guest tab, navigated every History/Math/Geography/Language Q1/Q2 reviewer, clicked its actual Report Card tab and waited for Save as Image. All eight exposed the visible PNG control with zero family-api resource requests and no child session. Immediate reads initially preceded rendering; waiting on the actual control resolved that observation timing issue.
7. Language Q2 actual Save as Image click produced native image/png, PNG signature 137,80,78,71,13,10,26,10 and native decoded 680 by 520. Only the Canvas callback was intercepted to inspect bytes and avoid a download; its prototype was restored. No filesystem-save claim is made.
8. Native Language Q2 stale private-score injection (99/100 plus private-capture flag, no session) was cleared by the real report renderer: no 99/100 leak, capture flag false, PNG control retained, zero private API requests. The existing all-eight VM regression independently passed the equivalent clearing and valid-session routing cases.
9. At a 390 by 844 desktop browser viewport, keyboard focus/Enter navigated Home then Report Card and kept the PNG control visible. Metrics were restored afterward. This is a narrow responsive/keyboard smoke check, not certification on a physical phone or a full accessibility/visual audit.

## Acceptance criteria and DoD traceability

| Requirement / checklist | Evidence | Result |
|---|---|---|
| US-201/202; Alex 1.2, 2.1/2.1a, 4.1a: eligible immutable baseline, correction and retake separation | All-eight generated finalizers, frozen catalogs, real concurrent/replay/correction API tests, native capture/reload | PASS |
| US-203/204; Alex 4.2/4.3: scoped subjects, authorized parent/child report, no sibling mix | Real parent-child parity and wrong owner denial; delayed scope tests; native authenticated report and Q1 empty selection | PASS |
| US-205/206/207; Alex 1.1/1.3, 2.2/2.2a/2.3: matching comparison, truthful missing/zero/unknown chronology | Independent fixed arithmetic tests, actual 42/70 to 53/70 SQL oracle, revision/cursor tests; native unknown chronology preserved | PASS |
| US-208/209; Alex 4.4: empty/error/offline/pending states preserve privacy and data | Delayed report/cache/epoch/error tests; native empty Q1 and reload/outbox checks | PASS |
| US-210; Alex v3 4.2a: all-eight existing Report Card integration and guest access | All-eight generated private/guest routing tests; native same-tab private report; all-eight guest UI reachability | PASS for activation slice |
| Alex activation gate, 5.1/5.3: tested reviewed source, active gates, safe storage, guest regression | Exact SHA verification, 65-test rerun, native family-first and guest checks, no generator drift | PASS |
| US-211/212/213; Alex v3 4.6-4.8: JPEG preparation/share/save/privacy | JPEG disabled in all clients; future slice | DEFERRED, not certified |

No finding requires an application code change. No new tracked tests were needed. Existing immutable local data, unrelated browser tabs and services were preserved.

## Notes for Dep

Luna committed PASS plus this Quinn PASS satisfy the technical client publication gates under the recorded user authorization. Publish the reviewed source and documentation using the established release process, then verify the exact Pages SHA and deployed capability/catalog/report behavior. The backend version 2 was already deployed and verified in Dep's earlier report; this QA made no fresh hosted verification or deployment claim. No backend deployment, generic schema push, account reset, history deletion, cache-key rotation or Auth change is needed for this client slice.

Keep history/report enabled in all nine clients, family capture enabled in all eight reviewers, M1 enabled, JPEG false and adapters null. Public fixture or query-toggle fallback is not a release mechanism. Do not publish ignored test runtime files/logs, temporary proxy scripts, credentials or browser artifacts. JPEG/mobile sharing remains explicitly unfinished. Retain Luna's safe additive initializer on any reviewed UI rollback.

Services left running: Quinn-owned proxy on 8773, exec session 80239; Luna static server on 8772 left untouched; existing local Supabase 54321 left untouched. Useful Quinn tabs remain parent 85, child 87 (Math Q2 with Q1 selected), guest 84 (Language Q2). Parent tokens are ephemeral. Tracked working-tree change: this report only. No commit, push, client publication or hosted mutation performed.

[QUINN] M2 activation v1 — 2026-10-25
Status: COMPLETE / PASS.
Key outputs: 65 tests plus 10 actual-stack steps passed; independent native fresh-family/storage/capture and all-eight guest UI checks passed; exact source/audit SHA verified.
Blockers: none for activation. JPEG remains deferred.
Next recommended: Dep under existing authorization.
