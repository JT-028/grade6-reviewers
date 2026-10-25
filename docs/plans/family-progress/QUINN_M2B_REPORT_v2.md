# QUINN TEST REPORT — M2-B v2.0 affected rerun

Date: 2026-10-25, Asia/Manila. Verdict: **PASS for the authorized local M2-B epoch repair**. Status: COMPLETE. This amendment supersedes only the HIGH access-invalidation blocker in QUINN_M2B_REPORT_v1.md. That historical baseline failure and its original evidence remain preserved; its broader traceability, browser observations and deferred scopes are not rewritten as fresh results.

Tested audit HEAD: `13d1c7da9d7d9cc812889aa069226b01f9cb0f4d`, branch `codex/m2b-local-progress`. Reviewed source/test commit: `076f12fbdf0c69a7ba3230226e7593c4cd08dad7`. Independently confirmed the difference between these commits contains only LUNA_M2B_REVIEW_v2.md and LUNA_M2B_PLUGIN_AUDIT_v2.md. Application and test trees therefore match the exact Luna-reviewed source. Initial working tree was clean; only this report remains uncommitted after QA. No application/test changes, commit, push, deployment or downstream agent invocation by Quinn.

Inputs: repository AGENTS.md; agent-squad and Quinn skills; QUINN_M2B_REPORT_v1, MASON_M2B_EPOCH_REPAIR_v1, LUNA_M2B_REVIEW_v2; generated report controller and its tests; existing reviewer/family credential-clear integration. The already-authorized Mason → Luna → Quinn repair sequence required no further handoff approval. No BrowserOS work was required for the deterministic affected rerun.

## Executed summary

**51 passed / 0 failed / 0 skipped**, with normal Deno type checking; no --no-check. Layer counts: API/auth 11, M1 lifecycle 8, M2 repository/contracts 9, numerical/projection 3, reviewer capture 12, report controller 8. This is the existing affected command requested in the repair handoff, not a hosted or whole-release acceptance run:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
ok | 51 passed | 0 failed (8s)
```

## Resolved HIGH and affected evidence

| Boundary / acceptance | Independently observed result |
| --- | --- |
| Original Quinn regression: epoch advances while cache encryption is suspended | PASS: original expected-null/no-80.00% assertion is green; invalidated save is absent. Its prior red result remains in v1 and Luna's actual-prior-source reproduction. Quinn did not repeat temporary source mutations. |
| All nine generated owners, including family.html, offline refresh after durable epoch change | PASS: each executes the suspended encryption race. Lock callback exactly once; onAuthorized count remains at its initial successful load; projection null and 80.00% absent after refresh and offline(). No stale fallback redraw. |
| Preserve immutable work | PASS for all nine owners: full prior saved-report IV and ciphertext equality, plus retained records/outbox ciphertext sentinels. The failed save neither replaces earlier ciphertext nor deletes retained work. |
| Ordinary encryption rejection and controlled report-transaction abort | PASS: no lock; valid same-scope projection and 80.00% remain, with explicit cache-not-saved warning. Subsequent offline labeling remains available. |
| Superseded cache key import and encryption, replacement Q1 owner | PASS in both phases: old Q2 cannot redraw or lock the newer owner. The import case targets an encrypt-capable cache import and asserts the old key never reaches encryption, rather than accidentally pausing pending-results decryption. |
| Existing report/capture/numerical behavior | PASS: all-eight canonical projection parity and encrypted store/AAD, delayed child/quarter responses, fixed history revision, pending acknowledgement refresh, literal independent arithmetic, 64 set starts, immutable capture, and existing credential/epoch lifecycle checks. |

This resolves US-209/C3 and Alex 2.4/4.4's identified cache-time access-invalidation failure, and the corresponding privacy failure in v1. No other open requirement is silently marked complete.

The typed internal ReportAccessChanged distinction is accurate for the tested boundary: epoch-mismatch aborts propagate into clear/onLock, whereas ordinary crypto/transaction failures retain valid report data with a truthful cache warning. Source inspection also confirms bootstrap, pending-read and response epoch mismatches use this distinction, with history mismatch clearing and invoking onLock. Current-owner/sequence checks precede catch-side invalidation; delayed cache import checks precede key assignment.

Credential clearing evidence is deliberately bounded. The race tests observe the report projection/DOM and onLock callback, not the entire native-page credential integration in the same scheduled race. Source-traced unchanged wiring is reviewer onLock → familyInvalidate → familyClear and synchronous sessionStorage removal; family onLock → lockChild/signOut → session null/storage removal and panel clearing. clear() first aborts the controller, cancels the expiry timer, nulls key/projection/session, clears private DOM and drops the owner. The passing existing M2-A missed-message/start-epoch/expiry tests independently execute actual reviewer credential removal; passing M1 lifecycle tests cover family signed-out/pending-response isolation. No fresh end-to-end native-browser credential-race claim is made.

## Source and artifact checks

- All nine inline report blocks independently hash to SHA-256 `c76b24828f2474698ebdc58ab2e8a694de407bf0a32f97cd81a8e45726593d16`, including boundary markers and CRLF. All nine files are CRLF without BOM.
- Outside-report-block comparison against pre-repair audit `99682df786c19c4732206dd491048ebdb0b432c3` passes for all nine HTML owners after newline normalization. The repair has no changes to guest reporting, question/quarter content, navigation, or M1 code outside those blocks. No fresh exhaustive content/PNG audit is claimed.
- Nine history/report/JPEG gates remain false and local adapters null. Eight reviewer FAMILY_ENABLED values remain false; family M1 FAMILY_ENABLED remains true.
- Report generator dry run with the same Deno config and allow-read/allow-env emitted only Begin/End, an empty patch. Deno's incidental TypeScript dependency discovery modified only deno.lock; its exact diff was inspected and that QA-generated change restored. git diff --check passed.
- No regression was weakened or new test required. Luna's guard-removal red proof remains referenced evidence, not a new Quinn mutation experiment.

## Coverage, browser evidence and limits

No new coverage collection was necessary for this focused repair. v1's historical imported-Deno coverage (75.3% lines / 86.0% branches overall) is **stale for the repaired source** and does not attribute VM-generated inline execution. Its below-80% line advisories remain historical: auth.ts, index.ts, validation.ts and m2_browser_fixture.ts. Ignored raw evidence remains preserved at `test-results/quinn-m2b-coverage-20261025/`; nothing was recursively removed.

The retained native BrowserOS nine-surface parity, selected-child, responsive-layout and keyboard observations in v1 were made on the earlier baseline. They were not rerun or presented as repair browser evidence. The affected race checks use actual generated HTML code in VM/fake IndexedDB with real WebCrypto and controlled scheduling. No native-browser race, SQL/hosted identity, native mobile, JPEG, saved-image decode, broad content audit, complete assistive-technology audit, or fresh performance/coverage certification is claimed. The remaining dedicated report-cache/upgrade/key/history limits recorded in v1 remain limits.

## Notes for Dep and handoff

Luna has PASS plus local source commit, and Quinn's affected local M2-B gate now PASSes. This resolves the historical HIGH blocker for the local statistics slice only. All production M2 features remain disabled. M2-C JPEG and the production bridge/catalog/capability/authenticated-route/SQL/queue acceptance requirements remain separate work with their own applicable checks. Current live M1 was untouched and no production publication is authorized by this report. No push/deploy or next-agent invocation occurred.

[QUINN] M2-B v2.0 — 2026-10-25
Status: COMPLETE (local affected QA PASS)
Key outputs: exact reviewed source verified; 51 passing checks including original regression and nine-owner race; historical HIGH superseded with explicit evidence limits.
Blockers: none for the authorized local repair; production bridge and M2-C release gates remain.
Next recommended: awaiting user-directed next milestone or release decision; no automatic handoff.
