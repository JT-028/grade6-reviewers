# Luna M2-B review v1

Date: 2026-10-25, Asia/Manila. Review started 2026-10-24 and resumed after a usage-limit interruption.
Verdict: PASS for the authorized local M2-B demonstration only.
Reviewed implementation commit: `f2561d44be2611dae5db06a9a2d1eb92d7ac8d87`.
Baseline: `b34140e01ff1dceb4ca6ea3b742b048b0a6a4d61`.
Branch: `codex/m2b-local-progress`.
The documentation-only child commit records this review and LUNA_M2B_PLUGIN_AUDIT_v1. Its exact SHA is in the handoff and `git log -1 --format=%H -- docs/plans/family-progress/LUNA_M2B_REVIEW_v1.md`.

## What this change does

Family progress and all eight existing reviewer Report Card tabs use one canonical selected-quarter projection. Local fixtures demonstrate immutable baselines, comparable prior results, corrections, history, encrypted pending work, and access invalidation. Published files keep history, report, and JPEG gates disabled. This review does not approve production statistics or deployment.

Inputs reviewed by reference: MASON_M2B_REPORT_v1; ARIA_M2_BLUEPRINT_v2 and its v1 baseline; ALEX_M2_PLAN_v3 and v2; REX_M2_REQUIREMENTS_v3 and v2; M2_CONTRACT_FIXTURES_v1; current M1 access code and repository AGENTS.md.

## Findings and repairs

Initial findings: zero CRITICAL, one HIGH, two MED. All three are resolved. No confirmed scoped finding remains open.

1. HIGH. Incomplete report response validation accepted contradictory assessment metadata and unexpected private fields. `supabase/functions/family-api/m2-progress.ts:71` now validates the exact result, assessment, grade, and correction fields, identity tuple, scoring policy, total, chronology, and raw-derived grade and percentage. `reportProjection` at line 90 validates exact projection input fields and summary structure. Browser boundaries bind every displayed result to the reviewed catalog. History uses the same parser before rendering. Unknown fields cannot reach the projection or encrypted report snapshot. Before the repair, a Math Q2 latest result could retain its ID while claiming a Q1 History module, revision 999, or a fake policy. The regression also rejects extra token and feedback fields and incomplete pop results.

2. MED. Completed history retained its old snapshot revision when the button changed to Refresh history. A newly accepted result made a new traversal fail. `tests/family/m2_report_template.js:150` now checks revision consistency only while continuing a cursor. A fresh traversal can advance from revision 2 to 3. Malformed history rows produce an unavailable state without rendering their values.

3. MED. A partial pending overlay left `state.pending` populated after pending storage became empty. Refresh then showed pending_count=0 alongside old pending cards and comparison-unavailable text. `tests/family/m2_report_template.js:90` clears that state before reading the next overlay. The regression removes the acknowledged record and verifies the refreshed text and count.

The stricter parser exposed a repair integration issue during actual browser checks. Existing M2-A encrypted records include inventory-only `source_pool_count`. Dropping only total and catalog_digest retained that field and rejected otherwise valid pending work. The final normalization at template lines 82-84 constructs the exact resultDTO assessment allowlist. A focused test with source_pool_count failed before this correction and passes afterward. The browser then loaded all five retained synthetic pending records across all nine pages. No encrypted records were deleted or rewritten to make the check pass.

All repairs are implementation corrections within Aria's contract. No product, schema, route, or JPEG behavior was added by Luna. The generator propagated the repairs to all nine inline owners.

## Contract and privacy conclusions

- Raw fractions drive percentage and delta rounding. Grade rounding does not decide direction. Fixed expectations cover 42/70 to 53/70, same-grade change, reversed direction, first results, finalized zero, and zero-prior relative-unavailable states.
- Selection uses anchored completion time and lowercase UUID order. The immediately preceding matching assessment ID supplies the prior. New sets or revisions do not borrow a baseline. Unknown or unverified chronology suppresses directional summaries. Corrections remain separately dated and never rewrite baselines.
- Fixture acceptance revisions keep a cursor traversal stable during late arrivals. Explicit refresh can start a newer revision. The in-memory cursor registry is a simulator, not SQL or durable keyset evidence.
- Complete fixed-revision history is required before pending work can replace the confirmed comparison pair. Failed or incomplete history keeps the confirmed pair separate and labels pending work as partial.
- Child, quarter, session, generation, request sequence, expiry, and durable access epoch checks guard callbacks and cache commits. The cache transaction reads the epoch and writes the encrypted report together. Old asynchronous work cannot redraw a changed owner. Parent reports do not read child-device pending ciphertext.
- Reports use text nodes. Guest values do not supply private summaries. URLs contain only fixed navigation context. AES-GCM snapshots use fresh IVs, nonextractable keys, and report-store, child, quarter, and schema AAD. Raw key byte arrays are cleared after import. There is no cold offline unlock.
- M1 family access remains enabled in family.html. All eight reviewer FAMILY_ENABLED flags remain false. All nine history, report, and JPEG flags remain false and local adapters remain null. Dedicated loopback fixture injection is the only demonstration path.

## Executed evidence

Final combined command:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
```

Result: 47 passed, zero failed in one combined final run. This includes 11 API checks, eight M1 lifecycle checks, nine M2 contract checks, three reducer checks, 12 capture checks, and four report checks. The initial unchanged slice passed 45. Focused regressions then failed for malformed report acceptance, stale pending text, and new-revision history rejection before their repairs. The inventory-field pending case separately failed before its normalization repair. Type-checking errors in the first draft of the test helper were corrected before behavioral evidence was collected.

Tests use injected repositories, VM execution, and fake IndexedDB. They do not certify hosted auth, SQL, native browsers, or production queue delivery. The test suite exercises the actual generated reviewer blocks, existing finalizers, all 64 assessment starts, epoch invalidation, ciphertext behavior, immutable replay, and fixed numerical expectations.

The report generator emitted an empty patch after final regeneration. `git diff --check` and the staged equivalent passed. All 25 implementation/input files use CRLF without BOM. Capability checks passed for all nine published files. The guest `downloadScorecardImage` function through file end matches the baseline after newline normalization in all eight reviewers. This proves source preservation, not a fresh downloaded PNG decoder check. No published name or question pool changed.

Actual BrowserOS neo used Windows desktop Chrome 155.0.0.0 on the dedicated loopback fixture server. The final nine-page sweep selected Q2 at the same fixture revision and retained five earlier synthetic encrypted pending records. Family and all eight existing tabs each showed eight cards, pending_count=5, and canonical academic digest `250b996d34d2caa6829e2e79a09b9b4e5f54dc4fa5e9df89da856be94d6175c2`. JPEG actions stayed disabled. The explicit pending allowlist was present in every loaded document. Parent A to B immediately removed A, retained Q2, showed honestly empty B summaries, and pending_count=0. These pages used the normal M1 session integration against local synthetic transport. No hosted credentials or production mutation were used.

Mason's earlier 390px no-overflow observation remains builder evidence. Luna did not repeat native mobile or JPEG work. No claim about native sharing, Messenger delivery, or saved JPEG readability follows from this review.

## Oracle sequencing deviation

Aria requested freezing expected fixtures before the first reducer edit. Mason disclosed that the full projection expectation was added during parity verification. The ordering requirement was missed. Luna and the independent quality reviewer checked the literal numerical rows and fixed JSON projection. Expected values are independent constants, not reducer-generated values at test runtime. Their fixed digest remains `25bc60d141a6cd1d677c2682846a968ac19339d31a59712d7ac3a3b285f7dd63`. This is an accepted process deviation for local B, with independent Quinn confirmation still required. It does not certify the unimplemented JPEG or production bridge.

## Plugin gate and commit

ponytail-review verdict: Ship for local B. Thermos has no open critical or confirmed scoped finding after Luna's repairs and direct checks. Mandatory and triggered plugin work is recorded in LUNA_M2B_PLUGIN_AUDIT_v1. The optional fresh repair recheck failed at the usage limit and is not counted as completed; Luna directly verified the repairs. The two required independent Thermos reviews completed before that interruption.

Luna committed the reviewed implementation, tests, Mason report, and authorized Aria amendment locally with the required Grok coauthor. The pre-existing Aria document was preserved and reviewed before inclusion. No unrelated files were removed. No push, PR, hosted change, or deployment occurred.

## Notes for Quinn and remaining release gate

Ready for Quinn on the reviewed source SHA when the user authorizes that handoff. Quinn should independently verify the oracle, parser rejection cases, canonical parity including real captured pending assessment metadata, parent selected-child transitions, expiry and epoch races during cache writes, and fresh versus continued history traversal. Recheck keyboard/status behavior and 390px layout. A long history stress case is still appropriate: the local overlay collects complete history and the UI appends loaded pages. No production-scale memory or performance guarantee is claimed for this finite local fixture.

Production remains blocked. A separately authorized Mason bridge must supply the additive schema, exact production catalog, authenticated ingestion/progress/history routes, durable acceptance revisions and keyset cursors, real session ownership, permanent replay, capability bootstrap, bounded encrypted queue replay, and reconciliation runbook. Real SQL and hosted tests must prove those artifacts. JPEG preparation and handoff remain M2-C. Dep cannot publish enabled M2 until the applicable reviewed commits and Quinn gates pass and publication is authorized. No next specialist was invoked.

[LUNA] M2-B v1.0, 2026-10-25.
Status: COMPLETE for local M2-B.
Key outputs: Three resolved findings, 47 passing checks, nine-page browser parity, local implementation commit.
Blockers: None for the local review. Production bridge and later release gates remain required.
Next recommended: Await user authorization for Quinn.
