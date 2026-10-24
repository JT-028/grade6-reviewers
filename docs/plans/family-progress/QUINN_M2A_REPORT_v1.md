# Quinn M2-A test report v1

Date: 2026-10-24, Asia/Manila. Status: **PASS for local disabled M2-A only**.

Exact tested checkout: `55cf53af8ee97ba51949762c7e3626de5ae5fb81`, branch `codex/m2a-assessment-history`. Reviewed implementation parent: `9d8e615c22f54c11c35b62a6c2426fd866e7be80`. Verified the parent-to-HEAD diff contains only Luna's two review documents. Initial working tree was clean. Quinn changed only `tests/family/m2_browser_test.ts` and this report; application files remain identical to the reviewed commit. These QA additions were uncommitted at Quinn handoff. Luna reviewed and strengthened them in the QA-only follow-up recorded below. No commit, push, deployment, hosted mutation, account provisioning, or private activation occurred.

Inputs: Rex M2 v1/v2, Alex M2 v1/v2, Aria M2 blueprint v1, fixed M2 fixtures, Mason M2-A report v1, Luna M2-A review/plugin audit v1. Applied Quinn and BrowserOS neo skills. Repository one-seat/user-handoff rules take precedence over general squad auto-chaining instructions.

## Summary and reproducibility

**36 tests passing, 0 failing, 0 runner-skipped.** Eleven existing API checks, five lifecycle checks, eight catalog/contract/repository checks, twelve capture/storage checks. Reproduced the original 32 tests independently before adding four focused QA groups. Final full run passed after the additions.

```powershell
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --coverage=../quinn-m2a-coverage tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_browser_test.ts
npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/m2-contract.ts tests/family/browser_fixture_server.ts tests/family/m2_browser_test.ts
git diff --check
```

Strict checks passed. Coverage artifact is outside the repository at `D:/PORTFOLIO/booklet-web-app/quinn-m2a-coverage/` (HTML and lcov). Final full run: 8 seconds test execution, excluding process startup/type checking.

## Evidence by layer

Contract/repository checks pass for all 64 frozen catalog identities and all eight inline catalogs, strict totals/revisions, baseline grades/raw percentages, zero/partial finalized exams, abandoned/malformed results, primitive chronology enum, source-session chronology, current principal/device/child ownership, selected-parent ownership, revocation, exactly-once concurrent same-ID delivery, conflicting receipt/content rejection, fresh authorized same-child session replay, and immutable returned DTOs.

The repository is an injected in-memory implementation, not a database or hosted API. Its permanent attempt map is independent of receipt keys; tests replay through a fresh receipt/session. There is no receipt TTL/expiry worker in this slice, so actual time-based receipt garbage collection was not exercised or claimed.

Capture integration uses actual extracted start, answer, finalizer, close and storage helpers from each published HTML, real WebCrypto, fake-indexeddb, and a small simulated DOM. All complete scripts parse. The added all-64 test starts and finalizes all six pop sets and both exam sets in each module and checks the emitted reviewed identity and eight distinct retained rows per module. It supplements the original all-eight decryption test (12/20 first answers, 20/20 corrections, separate 16/20 retake, zero-answer 0/70 exam, repeat finalizer latch, guest-store exclusion). Scores are synthetic function inputs; this is not 64 manually answered quizzes.

Additional negative tests pass:

- `Quinn M2-A ciphertext rejects wrong store and child AAD and modified bytes`: real AES-GCM rejects each altered context/payload; independent record/outbox encryption has different 96-bit IVs.
- `Quinn M2-A crypto and quota failures retain prior rows and keyboard retry target`: invalid key import and injected QuotaExceededError leave saved=false and prior record/outbox intact; retry through the native button callback retains UUID/completion time and adds exactly one row.
- `Quinn M2-A real close handler abandons pop without a finalized row in all eight`: actual close handler writes neither store.
- `Quinn M2-A all 64 actual set starts retain their own reviewed identity`: no set/module/quarter capture misrouting.

Existing regressions independently passed for transaction abort, same frozen retry, epoch mismatch at commit/start, missed lock without active capture, expiry, stale answer callbacks, stale focus/start epoch reads during profile switching, parent sign-out durable epoch advancement, delayed unlock/refresh, offline completion after authorization and offline cold-authorization denial. The fake storage and injected exceptions model failure paths; they do not reproduce physical browser quota exhaustion.

## Real BrowserOS neo evidence

Used a new owned tab and the loopback fixture server bound to `127.0.0.1:8766`. Existing other tabs were left alone. Actual browser engine, DOM, IndexedDB and WebCrypto were used; authorization remains the synthetic local fixture.

1. Entered a synthetic reviewer name with normal UI controls, started Math Q2 pop through its real start function, clicked a rendered answer, clicked Exit quiz and the actual Yes, exit confirmation. Closing abandoned that attempt. The subsequent storage baseline remained records=3/outbox=3, inherited from earlier fixture checks, not a fresh database.
2. Started a new private pop, awaited local authorization, supplied synthetic 12/20 first and 20/20 corrected counts, and injected a storage-open QuotaExceededError. Real page displayed `Not saved — local storage or access check failed.` with native `Retry saving`; saved=false. Restored the storage function, focused the retry button and pressed Enter. Saved=true, same frozen completion time, records/outbox both advanced 3 to 4. Stored values had only ciphertext/iv/schema_version. Fixture guest storage had no first_correct payload.
3. At emulated 390x844, innerWidth=390 and document scrollWidth=390 on this result/error/retry surface. Accessibility tree exposed the text status, grade descriptor and native retry button. This is a focused Math Q2 surface check, not an all-page mobile/accessibility audit.
4. Programmatically started exam set 2, authorized it, then replaced fetch with a rejecting function to simulate network loss. The real finalizer saved a zero-answer 0/70 baseline with zero post-authorization fetch calls. Restored fetch. Existing exam navigation was locked by guest prerequisites; this checks the actual finalizer/storage, not a fully unlocked end-to-end Save & Exit click journey.
5. Advanced the durable access epoch without broadcasting, then invoked the real epoch check. Credentials, quiz, exam and private status were removed. No production session was used. The automated checks establish credential cleanup and stale-write rejection. They do not directly test retention of a previously saved ciphertext row through invalidation.
6. Requested the published Math Q2 page through a normal static server on port 8767 with a fixture-looking query parameter. The server redirected to its clean public URL; the resulting page reported FAMILY_ENABLED=false, adapter=null, capture=null and zero fetch calls after quiz start. Guest start/close remained usable. Query preservation was not tested by this browser check; source inspection found no public fixture-toggle path.

Restored fetch and viewport emulation. Stopped the two QA server processes after verification. No full answer-by-answer browser completion, cross-browser/device matrix, real blocked-upgrade incident, physical quota exhaustion, real crypto provider outage, or browser restart/recovery flow is claimed. These broader resilience exercises belong to later M2-C; existing local prerequisite tests above are sufficient for this disabled M2-A foundation gate.

## Coverage and limits

| Instrumented module | Lines | Branches |
| --- | ---: | ---: |
| m2-contract.ts | 91.3% | 92.7% |
| m2_fixture_repository.ts | 83.2% | 90.2% |
| m2_catalog_inventory.ts | 96.6% | 83.3% |
| m2_browser_fixture.ts | 73.2% | 66.7% |
| crypto.ts | 91.0% | 83.3% |
| validation.ts | 75.6% | 80.0% |
| index.ts | 54.5% | 78.1% |
| auth.ts | 21.3% | 100.0% |
| Instrumented total | 73.4% | 85.1% |

Below-80 line advisory: browser fixture, validation, API index and auth. Hosted adapter branches remain intentionally unexecuted. The 100% reported auth branch figure does not mean hosted code was tested. Inline reviewer scripts and family.html executed through VM extraction are absent from Deno's module coverage denominator; their line/branch percentages are **unavailable**, not zero or 100%. The all-64 and adversarial behavioral checks are separate evidence. No repository-wide coverage or production-security claim is made. Refactoring is not requested or performed.

## Acceptance criteria and DoD traceability

| Requirement / Alex DoD | M2-A outcome and evidence |
| --- | --- |
| US-201; 1.2, 2.1, 2.1a, 4.1a capture portion | PASS: retained per-attempt baseline, corrections do not rewrite, retakes distinct, exact replay duplicate, conflicting replay rejects, exam zero/partial finalization valid. |
| US-202; 1.2, 2.1a | PASS foundation: correction is separate envelope field, guest/private storage boundaries hold; no new non-assessment practice result source introduced. Later correction-history presentation deferred. |
| US-204; 3.1/3.2 | PASS local ownership contract: A/B/nonowner/device/revoked cases; no sibling rows. Parent dashboard switching remains M2-B. |
| US-205/C1; 1.1 | PASS identity foundation: reviewed revision and administered semantic sample fingerprint distinct; all 64 catalog/start routes, immutable source inventory and shuffle semantics. Comparison selection/math deferred. |
| US-206/207; 1.3 | Only chronology validation and baseline numeric normalization prerequisites pass. Missing-prior/delta/direction UI and formulas are M2-B, not delivered or failed here. |
| US-208; 1.3/2.1 | PASS input foundation: malformed/abandoned/zero-total rejected, finalized zero retained, rejected-only history empty. Subject/quarter empty-state UI deferred. |
| US-209/C3; persistence prerequisites | PASS scoped offline completion, frozen retry, tx abort, crypto/quota error, stale session/epoch/answer callbacks and honest Not saved/device-only labels. Dashboard response races deferred. |
| C4; 3.3, 4.1a platform prerequisites | PASS disabled flags/null adapters in all eight; real public page remains disabled; source has no query activation; zero guest family requests; no application shared JS; preserved filenames/content constants, CRLF and Q2 added-line leak checks. |
| 1.4 fixed fixtures | PASS applicable M2-A acceptance/rejection oracle. M2-B comparison matrix remains documented/deferred. |
| 4.1 navigation, 4.2–4.5, 5.1 full matrix, M2-B/C | DEFERRED as authorized milestone split. Focused mobile/keyboard evidence above is not completion of these later DoDs. |

Static verification: all eight flags remain false and adapters null; no required content-constant declaration diff; no listed Q1-only Earliest Heroes/Origin Theory/Ring of Fire strings in Q2 added lines; all eight published files retain CRLF. Diff check passed. No hosted route/migration/capability/activation change is part of this M2-A implementation.

## Findings and Notes for Dep

No confirmed application defect requiring a Mason repair in this scoped gate. No failing assertions remain.

LOW test-tool limitation: `browser_fixture_server.ts` static fallback allows only alphanumerics/underscore before .html, so versioned reviewer URLs containing dots return 404 there. Dedicated M2 fixture URLs work. Verified the published page with the separate standard static server; no application repair was made. Future QA should use the dedicated fixtures or standard static server for versioned public pages.

This PASS applies to the reviewed application bytes at the exact checkout SHA above with the documented QA-only additions. The Luna follow-up below records the review of those additions. Keep FAMILY_ENABLED=false, null production adapter and local-demonstration/not-synced labels. Preserve synthetic-only fixtures; no private activation, hosted database/auth/function provisioning or deployment is authorized by this report. Re-run affected checks after application changes. No next seat was invoked; await the user's next instruction. M2-B/C remain separate work and this report is not production release approval.

[QUINN] M2-A v1.0 — 2026-10-24
Status: COMPLETE — scoped local disabled PASS.
Key outputs: 36/36 executable checks; all 64 real capture identities; BrowserOS storage/privacy/keyboard/mobile smoke and measured coverage.
Blockers: None for M2-A. Later UI/hosted scope remains deferred. The QA-only follow-up below records local inclusion.
Next recommended: Await user direction; no auto-handoff.

## Luna QA-additions review v1

Date: 2026-10-24, Asia/Manila. Gate: **PASS for the local disabled M2-A QA additions**. No open findings remain. Ponytail verdict: Ship.

This review covers only this report and `tests/family/m2_browser_test.ts`. It starts from `55cf53af8ee97ba51949762c7e3626de5ae5fb81` on `codex/m2a-assessment-history`. Application bytes remain identical to the previously reviewed implementation `9d8e615c22f54c11c35b62a6c2426fd866e7be80`. The commit containing this section is QA-only. Its exact hash is returned with the handoff, avoiding another documentation-only commit to record its own hash.

Two independent read-only Thermos reviewers examined correctness and code quality. Both found that the original new close test would pass with a no-op handler. Luna added assertions that closing clears `pq` and the capture credentials, then checked that the abandoned capture cannot finalize. A temporary no-op mutation failed at `Close clears the quiz and private capture credentials`. The real close handler passed for all eight modules. The temporary mutation file was removed.

Luna also added a successful untouched-ciphertext decrypt before the tampering negatives and checked both record and outbox counts after retry. The report now states that prior ciphertext retention through invalidation lacks direct executable evidence. The existing tests prove credential cleanup and stale-write rejection. These changes strengthen QA evidence without changing application behavior.

Final checks passed:

- The documented four-file Deno test command, without coverage collection, passed 36/36 with zero failures or runner skips after the QA edits.
- The documented scoped `deno check` command passed for the contract, fixture server, and capture test.
- `git diff --check` passed. Both included files have CRLF with zero bare LF characters.
- Only the test and this report differ from the starting checkout. No production or published HTML file changed.

The existing lcov artifact supports Quinn's coverage table. Luna did not recollect coverage or repeat BrowserOS actions. Browser claims above remain Quinn's recorded observations, with explicit synthetic authorization, injected failures, and focused-page limitations. The VM tests run extracted production functions with real WebCrypto, fake IndexedDB and simulated DOM. They do not prove physical quota exhaustion, all-page accessibility, hosted authorization, or later M2-B/C behavior.

The installed ponytail, ponytail-review and ponytail-debt instructions were read for this scope. The debt scan found zero added shortcut markers. The installed thermos skills supplied the two independent review passes. The quality reviewer also applied Comment Sicko. The added diff contains zero comments or suppressions, so no deletions, restorations, constraint encodings or reruns were needed.

Pstack's feature checklist was matched proportionately to these existing QA additions. Subsystem tracing covered extracted starts, finalizers, encryption, retry and abandonment. Architecture exploration and new feature implementation were skipped because no structure, signature, or product behavior changed. Verification and a single scoped local commit complete this unit. No PR or rebase is required by the authorized local-review scope.

The throughput checkpoint ran scope and instruction checks first, then two independent read-only review passes. Luna remained the only writer. Review and test execution used independent VM databases. Git staging and commit remain sequential operations on the shared checkout.

Laziness Protocol and Subtract Before You Add kept the existing test helper and avoided new abstractions. Minimize Reader Load kept the review note with the QA report. Fix Root Causes replaced the vacuous assertion with the actual abandonment transition. Prove It Works and Sequence Verifiable Units required the no-op mutation, restored-handler check, full suite and type check before commit. Test Behavior, Not Implementation required observable cleanup and durable-store assertions. Type System Discipline and TypeScript best practices preserved the existing VM boundary and passed strict checking. TDD was applied to the cheap no-op mutation check; no production bug fix or invented failing production baseline is claimed.

Applied installed pstack no-comments, unslop and technical-writing instructions. The external deslop skill remains unavailable; the installed `docs/guide/05-build-and-clean.md` fallback was used to check for narration, dead compatibility code, unsupported guards and unrelated edits. None were added. No measured speed claim, architecture change, release-wide audit, bot UI, skill setup or requested refactor triggered further work.

No push, deployment, hosted mutation, private activation, account provisioning or next-seat invocation occurred. The local commit does not authorize production release. Await user direction.
