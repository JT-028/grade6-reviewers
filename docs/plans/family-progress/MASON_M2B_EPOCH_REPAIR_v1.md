# MASON PROGRESS — M2-B access epoch repair v1.0

Date: 2026-10-25, Asia/Manila.
Status: COMPLETE for the authorized local repair; ready for Luna review/local commit, then Quinn affected rerun. No commit, push, deployment, or next-agent invocation by Mason.

Branch: `codex/m2b-local-progress`; starting/current HEAD: `99682df786c19c4732206dd491048ebdb0b432c3`. Source baseline reviewed previously: `f2561d44be2611dae5db06a9a2d1eb92d7ac8d87`.

Inputs read: repository AGENTS.md; agent-squad and Mason SKILL.md; ARIA_M2_BLUEPRINT_v2 access/cache contract; ALEX_M2_PLAN_v3 checklist; LUNA_M2B_REVIEW_v1; QUINN_M2B_REPORT_v1; existing report/capture integration and tests. The user's authorized repair sequence overrides the repository's usual stop between these specific seats; Mason stops after this handoff for the orchestrator to route Luna and Quinn. No production bridge or JPEG work.

## Cause and correction

Quinn's retained test was rerun before any repair and reproduced exactly: 0 passed / 1 failed / 4 filtered; durable write was absent, but private projection and 80.00% remained visible. The access epoch check inside the metadata/reports readwrite transaction aborted correctly. Its rejection was indistinguishable from an ordinary cache persistence error, so load displayed a cache warning and redrew the invalidated projection.

The report template now emits a distinct `ReportAccessChanged` error when that transaction observes an epoch mismatch. The cache-error handler propagates it to the existing authorization-loss branch, which clears owner/key/session/projection, aborts the controller and timer, clears private DOM, and invokes the existing onLock integration before returning. Reviewer onLock is familyInvalidate (clears tab session/private capture); family onLock is lockChild/signOut. No records, outbox, device credentials or previous report ciphertext are deleted by this repair.

The same distinction is used when the pending read discovers an access mismatch. Bootstrap/response and history epoch mismatch paths now also call the existing credential invalidation integration rather than only clearing report DOM. Access loss cannot use the ordinary offline previous-projection fallback. Superseded owner/request checks still run before invalidation, so an old callback cannot lock a newer owner. A delayed CryptoKey import is checked for current owner/sequence before assigning state.key, preventing that callback from restoring a key to an invalidated state.

Ordinary encryption/transaction failures retain the existing valid same-scope projection with the explicit encrypted-cache-not-saved notice. Offline labeling for an already authorized valid report remains available.

## Exact deliverables

- `tests/family/m2_report_template.js` — access error distinction, lock propagation, key-import continuation guard.
- `tests/family/m2_report_test.ts` — preserves Quinn's original regression unchanged; adds all-nine offline refresh epoch-loss/ciphertext preservation, ordinary crypto/transaction-abort failures, and superseded key-import/encryption versus new-quarter checks.
- `family.html` — regenerated inline report block only.
- `History6_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `History6_Q2_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Math6_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Math6_Q2_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Geography6_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Geography6_Q2_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Language6_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `Language6_Q2_Review_Module_v1.0.0.html` — regenerated inline report block only.
- `docs/plans/family-progress/MASON_M2B_EPOCH_REPAIR_v1.md` — this report.

Preexisting working-tree deliverables preserved: Quinn regression in the test file and untracked QUINN_M2B_REPORT_v1.md, including the orchestrator's coverage-path note. Coverage remains at ignored `test-results/quinn-m2b-coverage-20261025/`. Generator output was stored at ignored `test-results/mason-m2b-report.patch`; its individual file patches were applied via apply_patch. Deno's incidental TypeScript lockfile discovery change was restored only in deno.lock, which was clean at start.

## Verification and checklist

Before repair:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --filter "Quinn epoch" tests/family/m2_report_test.ts
```

FAIL with Quinn's exact expected-null/actual-projection=true/visible80=true assertion. After repair the same command PASSes, with no assertion weakened.

Full affected suite:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
```

PASS: **51 tests / 0 failed / 0 skipped** (11 API, 8 M1 lifecycle, 9 M2 contract, 3 progress, 12 reviewer capture, 8 report). After extending the superseded-work regression from encryption alone to both key import and encryption, the final report test file was rerun: **8 passed / 0 failed**. An initial TypeScript error in a test-only transaction-abort stub cast was corrected before the passing runs; no --no-check used.

- [x] Alex 4.4 / Aria section 5 / US-209 and C3: cache-time access loss cannot redraw or retain a projection; all nine execute this race in VM/fake IndexedDB with real WebCrypto. The new refresh race goes offline before release, invokes lock once, never calls onAuthorized again, and cannot restore a stale projection through offline().
- [x] Preserve immutable work: prior saved report IV/ciphertext, sentinel records and outbox survive the failed save. No records/outbox deletion or rewriting to make the test pass.
- [x] Valid cache failures: real crypto rejection and controlled readwrite transaction abort retain valid report plus truthful cache warning; valid offline labeling remains.
- [x] Callback ownership: old key import/encryption after a new Q1 owner cannot redraw Q2 or lock the new owner.
- [x] Existing numerical projection/catalog/64 starts/finalizers/M1 lifecycle checks pass; fixed independent oracle unchanged.
- [x] Report generator dry run produces only Begin/End, no edits; reviewer generator produces empty file headers with no hunks, its existing no-op output format. Both use --config supabase/functions/family-api/deno.json --allow-read --allow-env.
- [x] Nine report blocks byte-identical including CRLF. SHA-256: `c76b24828f2474698ebdc58ab2e8a694de407bf0a32f97cd81a8e45726593d16` (CRLF block including boundary markers).
- [x] All nine owners CRLF/no BOM; template/test/report normalized to CRLF; git diff --check PASS.
- [x] Exact comparison against HEAD after removing report blocks proves every HTML byte outside those blocks unchanged after newline normalization. Guest report/PNG, questions, quarter content, navigation and M1 integration therefore have no source changes. No new exhaustive content or rendered PNG audit claimed.
- [x] All nine HISTORY/REPORT/JPEG flags false and local adapters null; eight reviewer FAMILY_ENABLED false, family M1 FAMILY_ENABLED true.

## Deviations, limits and handoff

No blueprint deviation. The additional epoch-read lock propagation and key-import guard are the same authorized access-invalidation boundary; no API, product, schema, catalog, grading or cache data shape changes.

The deterministic race uses actual generated inline code in a VM, fake IndexedDB and real WebCrypto. The onLock callback is observed in the report harness; its existing real reviewer/family credential-clear wiring was inspected and remains unchanged. No fresh native-browser race, real hosted identity, SQL/backend, mobile, JPEG or coverage measurement is claimed. Browser timing was not used as the oracle for this suspended-encryption race. Quinn's previous browser evidence remains historical, not a fresh Mason browser claim.

Pure progress helpers remain unchanged. Cache/load/clear require DOM, WebCrypto, adapter and IndexedDB mocks; tests execute them from generated HTML rather than duplicating the controller.

Blockers: none for Luna. The repair is uncommitted for Luna to inspect, perform its required review gates, and commit locally with required attribution; Quinn must then verify the reviewed commit. Do not treat Mason's checks as Quinn acceptance or deployment authorization.

[MASON] M2-B epoch repair v1.0 — 2026-10-25
Status: COMPLETE
Key outputs: distinct access-invalidation handling in all nine owners; retained red-to-green Quinn regression plus adversarial checks; full 51-test affected pass and final eight-report pass.
Blockers: none.
Next recommended: Luna review/local commit, then Quinn affected rerun under the existing user authorization; no deployment.
