# Luna M2-B epoch repair review v2

Date: 2026-10-25, Asia/Manila. Verdict: PASS for the authorized local repair.
Reviewed source commit: `076f12fbdf0c69a7ba3230226e7593c4cd08dad7`.
Parent audit commit: `99682df786c19c4732206dd491048ebdb0b432c3`.
Branch: `codex/m2b-local-progress`.
The documentation-only child commit records this report and LUNA_M2B_PLUGIN_AUDIT_v2.
Resolve its exact SHA with `git log -1 --format=%H -- docs/plans/family-progress/LUNA_M2B_REVIEW_v2.md`.

## What this change does

An access epoch mismatch during an encrypted report save now clears the private report and calls the existing credential invalidation integration. Ordinary cache failures retain the valid report with a truthful warning. Superseded key imports cannot resume encryption or restore an old report owner. All nine published report blocks receive the same repair.

Inputs reviewed: MASON_M2B_EPOCH_REPAIR_v1, the historical BLOCKED QUINN_M2B_REPORT_v1, LUNA_M2B_REVIEW_v1, ARIA_M2_BLUEPRINT_v2 sections 5 and 7, the actual diff and connected family/reviewer clear and onLock code. Scope excludes the production bridge, JPEG, and broad refactoring.

## Findings and resolution

No CRITICAL or HIGH implementation finding remains. Quinn's HIGH cache-time epoch defect is resolved. A typed internal error separates authorization loss from an ordinary storage error. The load catch checks current owner and sequence before clearing or falling back. Its access-loss branch drops projection, key and session references, aborts work, clears DOM, and calls the existing onLock integration. Bootstrap, pending-read and history epoch mismatch handling now reaches credential invalidation too. Reviewer familyInvalidate and family lockChild/signOut wiring remain unchanged.

Two MED test weaknesses were resolved by Luna before the source commit:

1. The new superseded importKey case originally paused pendingResults' decrypt-only import. It did not exercise cache's changed late key assignment. The test now pauses the first encrypt-capable import, allows the replacement Q1 owner to finish, releases the old Q2 import, and checks that this old key never reaches encryption. It also checks the Q1 report remains visible and no old lock callback fires.
2. The ciphertext-preservation assertion compared each returned byte without comparing length. Luna changed it to complete byte-array equality, so empty or truncated ciphertext cannot satisfy the assertion.

No application code change by Luna was needed. No justified lean deletion, schema change, new abstraction, or dependency was introduced. Test-only IndexedDB casts remain confined to the controlled abort seam and pass type checking.

## Executed evidence

Luna reran the unchanged Quinn test against the actual prior HTML from the parent commit, temporarily replacing only Math Q2 and restoring its exact bytes in finally. It failed for the intended reason:

```text
Expected null private projection and no 80.00% after epoch advanced; actual projection=true visible80=true
FAILED | 0 passed | 1 failed | 7 filtered out
```

Luna then removed only the new cache key continuation guard from the repaired generated Math Q2 block. The tightened test failed:

```text
superseded cache key import cannot proceed to encryption
FAILED | 0 passed | 1 failed | 7 filtered out
```

Exact repaired bytes were restored afterward. Neither temporary mutation was committed. The original Quinn regression remains verbatim. The complete final command after the test corrections passed with type checking:

```text
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts
ok | 51 passed | 0 failed
```

Counts are 11 API, 8 M1 lifecycle, 9 M2 contract, 3 progress, 12 capture, and 8 report tests. The final report checks execute all nine generated owners for the offline refresh epoch-loss case, verify projection clearing and lock callback, and preserve earlier report ciphertext plus records and outbox sentinels. Separate controlled crypto and transaction failures retain valid same-scope reports with cache warnings. The replacement-owner test exercises both key import and encryption continuations.

`m2_build_reports.ts` with allow-read and allow-env emitted only Begin/End, an empty patch. Nine CRLF blocks are identical with SHA-256 `c76b24828f2474698ebdc58ab2e8a694de407bf0a32f97cd81a8e45726593d16`. Outside-block source comparison against the parent passed for all nine HTML files. All nine history/report/JPEG gates remain false and local adapters null; eight reviewer FAMILY_ENABLED values remain false and family M1 remains true. `git diff --check` and staged checks passed. Deno's incidental TypeScript lockfile discovery was inspected and restored; it is absent from the commit.

## Gate and limitations

ponytail-review verdict: Ship for this local repair. Both required independent Thermos passes completed with no confirmed application defect. Their shared test finding and the quality pass's ciphertext assertion finding are resolved and proved. Plugin details are in LUNA_M2B_PLUGIN_AUDIT_v2.

The deterministic checks execute generated inline code in a VM with fake IndexedDB and real WebCrypto. They observe onLock and projection/DOM effects. Actual credential-clear integration was source-traced, not newly raced in a native browser. No fresh BrowserOS repair run, hosted identity, SQL, native mobile, JPEG, saved-image decoding, coverage percentage, or production readiness is claimed. Earlier nine-page browser observations remain historical evidence only.

Historical Quinn BLOCKED evidence is preserved with an explicit superseding-review note; it has not been rewritten as a QA PASS. Ignored coverage evidence remains at `test-results/quinn-m2b-coverage-20261025/`. No evidence cleanup, push, deployment, PR, hosted mutation, or feature enabling occurred.

## Quinn affected rerun packet

Test the source commit above or its documentation-only child HEAD. Confirm their application/test trees match. Independently rerun the 51-test command and inspect the original epoch regression, all-nine offline refresh preservation, ordinary failures, and both superseded key/encryption phases. Recheck the tightened assertion can detect guard removal if more evidence is needed. Keep browser and hosted claims separate from deterministic scheduling evidence. A real integration observation of credential clearing is useful, but do not modify shared production epochs or delete ciphertext to obtain it.

Ready for the authorized Quinn affected rerun. Luna's local PASS and commit do not replace that rerun. Production bridge and M2-C release requirements remain separate. Deployment is blocked until the applicable Quinn gate passes and publication is authorized. Luna invoked no downstream squad seat.

[LUNA] M2-B repair v2.0, 2026-10-25.
Status: COMPLETE.
Key outputs: reviewed epoch repair; two strengthened QA checks; 51 passing checks and local source commit.
Blockers: none for Quinn. Deployment remains blocked.
Next recommended: authorized Quinn affected rerun on the reviewed source.
