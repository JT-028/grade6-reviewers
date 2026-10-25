# Mason M2 client activation report v1

2026-10-25, Asia/Manila. Status: COMPLETE for implementation and local validation; ready for Luna. Base: `6f810dc0bff45172d13de00d440e2496c3114c4a`, branch `codex/m2-production-bridge`. No commit, push, hosted operation or next-agent invocation occurred.

## Result and scope

All nine production HTML files now enable HISTORY/REPORT. All eight reviewers now enable FAMILY access; family.html M1 stays enabled. JPEG remains false and every local adapter remains null. Actual bootstrap/capability/contract/catalog/digest validation still controls access; activation adds no query/hash/storage bypass. M1 owner/profile/PIN/pairing/approval flows and the guest PNG path remain in place. JPEG preparation/sharing, study timers and rewards are outside this slice.

The public notice now asks users to unlock online to check report availability, distinguishes guest progress and says study time/JPEG sharing are unavailable. The unlocked notice directs users to validated report/sync status rather than promising unverified availability. The authenticated report alone renders confirmed results after the existing capability/catalog checks. The disabled JPEG control now says sharing is not available yet, without the obsolete local-demonstration claim.

## Initialization repair

The production transport's foreground flusher previously opened IndexedDB version 3 without an upgrade handler. On pristine storage, it could create an empty v3 database before another initializer ran. It now uses the identical additive five-store list as the family/reviewer/report initializers: credentials, records, outbox, metadata, reports. No store is dropped or cleared; version remains 3, keys/AAD/queue shape and epoch checks are unchanged.

A blocked upgrade rejects without authorizing private access. If that open later succeeds after old tabs close, its unused connection closes immediately. Active transport connections close on versionchange. Existing incompatible or malformed storage still fails closed; no destructive repair/reset of an existing v3 database was introduced.

## Exact changed files

Production files (published names preserved):

- `family.html`
- `History6_Review_Module_v1.0.0.html`
- `History6_Q2_Review_Module_v1.0.0.html`
- `Math6_Review_Module_v1.0.0.html`
- `Math6_Q2_Review_Module_v1.0.0.html`
- `Geography6_Review_Module_v1.0.0.html`
- `Geography6_Q2_Review_Module_v1.0.0.html`
- `Language6_Review_Module_v1.0.0.html`
- `Language6_Q2_Review_Module_v1.0.0.html`

Maintenance/test/documentation files:

- `tests/family/m2_reviewer_template.js` — reviewer access gate.
- `tests/family/m2_report_template.js` — history/report gates and truthful disabled JPEG text.
- `tests/family/m2_transport_template.js` — additive initializer and blocked-open cleanup, duplicated in all nine HTML files.
- `tests/family/m2_activation_storage_test.ts` — three new all-nine storage behavior regressions.
- `tests/family/m2_production_test.ts` — active history/report/family artifact expectations; JPEG closed, adapter null, exact transport parity and metadata manifest checks retained.
- `tests/family/m2_contract_test.ts` — historical closed capture assertion now checks active family/no fixture adapter. Frozen catalog/content assertions remain.
- `tests/family/m2_browser_test.ts` — explicitly configures the requested enabled/disabled harness state, preserving the disabled capture test after production activation.
- `docs/plans/family-progress/M2_BRIDGE_SETUP_v1.md` — current-state annotation above the historical bridge packet.
- `docs/plans/family-progress/MASON_M2_ACTIVATION_REPORT_v1.md` — this handoff.

No index, assessment content, migration, Edge function, catalog, API or backend dependency file changed. Generator discovery briefly touched deno.lock; its exact original bytes were restored. Changed files use CRLF without BOM. Both maintenance builders produce zero change hunks; `git diff --check` passes.

## Executed tests

**64 tests PASS, 10 nested actual-stack steps, zero failed/ignored.** This is the prior 61-test bridge suite plus three new storage tests. Repeat runs are not additional tests. Evidence: ignored `test-results/mason-activation-full.log`; targeted log `mason-activation-targeted.log`; storage log `mason-activation-storage.log`.

```powershell
$env:FAMILY_REAL_STACK='1'
npx --yes deno test --no-lock --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --allow-net --allow-run --allow-write tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts tests/family/m2_production_test.ts tests/family/m2_real_bridge_test.ts tests/family/m2_schema_test.ts tests/family/m2_transport_test.ts tests/family/m2_bridge_queue_test.ts tests/family/m2_activation_storage_test.ts
```

The new tests run each actual generated transport in a VM with fake IndexedDB and controlled valid bootstrap/catalog replies. They independently require all five stores plus a completed empty-queue read from pristine storage; additive v2-to-v3 upgrade preserving opaque credentials/record/outbox sentinels; and blocked upgrade failure followed by released old connection and a successful later v4 upgrade (proving no abandoned v3 connection remains). These storage tests are not claimed as real SQL or native-browser evidence.

The unchanged bridge suite additionally executes real local PostgreSQL/pgcrypto/Auth/PostgREST/Edge checks, immutable replay, complete-history arithmetic/cursors, M1 lifecycle, current/source access loss, actual AES-GCM queue handling, selected-child bounded flushing, permanent errors, unsupported catalogs and epoch races. The first full run had two red historical gate assumptions, corrected in the two test files described above. An earlier patch assembly duplicated an epoch declaration; targeted verification caught it and it was removed before all final passing checks. No unresolved red assertion remains.

## Native BrowserOS fresh family-first proof

Used a new loopback browser origin, `http://127.0.0.1:8771`, with real existing local stack `http://127.0.0.1:54321`. The ignored `test-results/mason-activation-server.ts` serves actual candidate HTML and a transparent proxy. Response-only substitutions are local public URL/key/readiness and a prominent synthetic-local banner. Actual production flags are used; no fixture adapters, mocked API responses or child-session injection. Parent Auth only uses a test-only injection of an actual local owner token obtained through official admin.generateLink plus verifyOtp without sending mail or changing a password. This is simulated parent session entry, not a password-form UI claim. No hosted project or real owner password was accessed.

1. Family first: the new origin's first page was family.html. Its normal `deviceStore()` initialization produced all five native stores. Before child unlock/session creation, observed counts were credentials=1 (new approval), metadata=0, records=0, outbox=0, reports=0 and child session absent. No database was removed or reset to obtain this result.
2. Through actual family forms, created one clearly synthetic `QA Mason activation fresh` profile and `QA Mason activation tablet` pairing. Parent selected that one profile, reviewed and confirmed approval. Child received the actual device credential in native IDB, chose the allowed profile and entered its synthetic PIN. Real child unlock/bootstrap/catalog/progress returned 200, with an empty Q2 revision-0 server report.
3. Clicked the family page's actual Q2 Math link. The same BrowserOS tab navigated to `Math6_Q2_Review_Module_v1.0.0.html#report`, carrying the legitimately created child session. Bootstrap/catalog/report returned 200, adapter null, JPEG false.
4. Started actual exam set 1 and finalized 42/70, then a separate retake 53/70. Synthetic answers were set by page instrumentation before the actual finalizers; this is not a claim of manually answering 140 questions or completing the guest prerequisite quizzes. Each actual production capture encrypted record/outbox and sent a real POST that returned 201. The confirmed report advanced revision 0→1→2. Native stores afterward contained two records, zero outbox entries and two encrypted report scopes.
5. Confirmed fixed independent expectations: latest 53/70=75.71%, rounded 76% FS; prior 42/70=60.00%, rounded 60% DNME; +15.71 percentage points and +26.2% relative. Server provenance, pending_count 0. Actual reviewer reload retained authorized same-child access only after online bootstrap/catalog checks and showed revision 2/latest 53.
6. Navigated that same legitimate session through family.html and every one of the eight reviewers. For Q1 reviewers, changed only the report quarter selector to Q2; module questions/capture remained Q1. Every view returned Q2/revision 2/server provenance and academic digest `7bb75b9fae03ce05d6cbb4678646da1e292ebc8f4a1a96b7702eda3e6a607346`, adapters null, JPEG false. Q1's initially empty report did not borrow Q2 results before selecting Q2.
7. In an independent guest tab with no child session, exercised each of the eight actual Report Card buttons and `downloadScorecardImage`. Intercepted only the native toBlob callback to inspect the produced blob without initiating downloads: all eight image/png, exact signature 137,80,78,71,13,10,26,10, native createImageBitmap decode 680×520. Restored the Canvas prototype in finally. This proves guest encoding/decoding, not filesystem-save/mobile-sharing behavior.

No tests deleted existing encrypted queues/history or unknown synthetic records. The actual-stack suite creates additional isolated synthetic profiles/sessions as before and retains immutable attempts. The one activation profile/device and its two immutable attempts remain locally for reviewer/QA inspection. Hosted original family/profile/history state was not touched.

## Local service state and handoff

The owned loopback test server remains running on 8771, exec session 32202, for Luna/Quinn reuse. It rereads candidate files per request. BrowserOS pages: parent 78, legitimate child/report 79, guest PNG 81. Test owner token is ephemeral; rerun the ignored server to generate a new actual local test owner session if expired. The pre-existing Supabase Docker stack and other browser tabs/services were left running. No unknown listener was stopped. Do not publish the ignored server/runtime files.

Checklist item activation gates — DoD: real production transport/capability validation with private history/report active and JPEG closed — COMPLETE.
Checklist item cold storage — DoD: native family initialization precedes legitimate child handoff; all-nine direct flusher initialization and additive/blocked upgrade behavior verified — COMPLETE.
Checklist item regression — DoD: relevant 64 tests and native same-tab/reload/all-nine report parity, plus all-eight guest PNG encoding — COMPLETE.

Deviation from blueprint: none in schema/API/data shape. This slice intentionally advances the previously closed history/report/reviewer release gates under the user's activation authorization and adds the missing existing-shape transport initializer. Aria rerouting was not required. JPEG remains separate unfinished work; no mobile/390px/accessibility recertification, real-user password UI, new hosted deployment, Pages activation or performance benchmark is claimed.

Notes for Luna: review gate/template parity and additive initializer/blocked-late-success behavior, the explicitly configured disabled-capture harness, fail-closed capability/epoch/queue preservation, neutral availability copy and scope boundaries. Commit locally with required attribution only after PASS. Quinn should independently repeat relevant tests at the committed SHA and native checks as appropriate. Parent/report child selection and revocation logic are unchanged; existing regression coverage remains in the 64-test pass.

Notes for Dep: the actual hosted reviewed backend version 2 is already deployed. This candidate changes only client/templates/tests/docs, so backend deployment is unnecessary. Require Luna local-commit PASS and Quinn PASS before Pages publication; verify exact Pages SHA and current capability/catalog report behavior. Do not use generic db push, reset schema/history, rotate cache keys or alter Auth. For UI rollback, restore HISTORY/REPORT=false in all nine client/template copies and FAMILY_ENABLED=false in eight reviewers, keeping family M1 enabled, JPEG false, adapters null and all encrypted storage/server history intact. Retain the safe additive initializer. Re-review/commit/publish rollback through the existing gates.

[MASON] M2 activation v1 — 2026-10-25
Status: COMPLETE.
Key outputs: active private history/reports in all nine clients; additive initialization repair; 64 tests plus native family-first/all-nine parity/guest PNG checks PASS.
Blockers: none for this slice; JPEG remains separate.
Next recommended: Luna, then the already user-authorized Quinn and Dep gates.
