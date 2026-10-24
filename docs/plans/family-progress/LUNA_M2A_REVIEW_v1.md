# Luna M2-A review v1

Date: 2026-10-24, Asia/Manila.
Status: PASS for the local, disabled M2-A foundation.
Implementation commit: `9d8e615c22f54c11c35b62a6c2426fd866e7be80`.
Branch: `codex/m2a-assessment-history`. Base: `a92939c`.

This report and the plugin audit are a subsequent documentation-only commit. They do not change the tested implementation. Quinn must identify the final checkout SHA in its independent report. No push or deployment occurred.

## What this change does

The eight reviewers retain a distinct encrypted first-answer result for each finalized private fixture attempt. Corrections do not rewrite that baseline. Local records and pending delivery envelopes commit together. Published pages retain `FAMILY_ENABLED=false` and a null local adapter.

The review used Rex v1/v2, Alex v1/v2, Aria M2 v1, the fixed contract fixtures, and Mason's M2-A report. It traced the implementation rather than treating the builder report as proof. Hosted authorization, SQL, comparison UI, M2-B and M2-C are outside this verdict.

## Findings and repairs

No unresolved CRITICAL, HIGH, MED, or LOW findings remain in this scope. Four original MED findings and one MED issue caught during repair were resolved. One LOW authoring issue was resolved.

1. MED. Non-string chronology quality bypassed validation. `m2-contract.ts:142` previously coerced an array such as `["anchored"]` through the enum allowlist, while the source-window check required the primitive string. A 2020 completion with a 2026 source session was accepted. The boundary now requires a primitive string. `m2_contract_test.ts:326` failed before the fix with `Expected INVALID_TIME` and passes afterward.

2. MED. Missed lock messages left private credentials behind. The reviewer epoch check previously cleared quiz state while retaining the token and cache key in session storage, and did nothing without an active capture. The helper now compares the stored session epoch, removes credentials on detected invalidation, and clears private state on start-time mismatch, expiry, and commit-time mismatch. See `m2_reviewer_template.js:78`, `:124`, `:133`, and `:185`, duplicated in all eight pages. The new missed-lock test failed before repair with `Missed broadcast removes private token and cache key`. Focus, start-time, expiry, and transaction tests pass after repair.

3. MED. Authorized offline completion required another network request. The browser fixture validation POST ran before local encryption and prevented durable completion after connection loss. The review removed that unnecessary request and its unused route. Capture still waits for successful online authorization and the reviewed catalog digest. The local finalizer checks baseline and correction bounds, and the repository ingestion boundary still runs `validateEnvelope`. A new test uses the actual fixture response and transport. It failed before repair with `Authorized offline completion commits ciphertext and pending envelope`. It now passes with one authorization request and no completion request. Cold offline authorization still cannot save.

4. MED. Parent sign-out could leave the durable epoch unchanged. A parent tab without a child session emitted only an advisory parent-lock event. A reviewer missing that event could retain the same epoch. `family.html:669` now advances the durable epoch for every explicit broadcast lock. The new lifecycle test at `browser_lifecycle_test.ts:195` failed before repair and passes afterward.

5. MED, caught during repair. A delayed epoch read could clear a newer session. Independent re-review reproduced an old check returning after a profile switch and deleting the fresh credentials. Epoch checks now verify their captured generation and token before invalidating; capture startup checks `familyCurrent` before acting on its epoch result. `m2_browser_test.ts:389` failed before that correction with `Old epoch read cannot remove the newer session` and passes for both focus and startup paths.

6. LOW. The authoring emitter compared a CRLF template with LF-normalized page source and could emit unnecessary replacement hunks. It now normalizes both inputs. Running the emitter after the review emits no change hunks.

The review also removed unused `familyLastFailure`, capture key/wall/monotonic fields, and an unused stored receipt result. Retry controls still retain the same frozen capture through their event closure. Completion timestamps still use the verified clock anchor. Narrating comments were removed; tooling sentinels and the required self-contained browser copies remain.

## Traced invariants

- A start allocates a UUID and snapshots administered question semantics. The reviewed catalog revision and sample fingerprint remain distinct.
- Finalization latches synchronously. Every independent retake retains another UUID. Pop first-answer scores remain separate from final corrected scores. Existing partial and zero-answer exam finalization stays valid.
- The injected repository verifies the current principal, selected child, original source session, and device before replay disclosure. Permanent attempt identity rejects altered content independently of delivery receipt identity.
- Frozen results encrypt before a single records/outbox/metadata transaction. Fresh 96-bit AES-GCM IVs and store/child/module/attempt/schema additional data remain. Only transaction completion reports saved.
- Retry uses the frozen ID and completion time. An abort acknowledges neither store and preserves earlier records.
- Generation, session identity, and durable epoch checks prevent stale writes. Detected access changes erase private credentials and DOM while retaining ciphertext.
- Guest saves cannot persist a private result. All eight helper copies are identical after replacing their generated catalogs, and their flags remain disabled.
- No production dispatcher, hosted route, migration, automatic queue flusher, activation, or real family request was added.

## Verification

The following combined command ran successfully on implementation commit `9d8e615c22f54c11c35b62a6c2426fd866e7be80`.

```powershell
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_browser_test.ts
```

Result: 32 passed, 0 failed. This includes 11 existing API checks, 5 lifecycle checks, 8 contract checks, and 8 capture/storage checks. The all-eight test parses the complete published scripts, exercises actual start/finalizer functions, decrypts stored output, and checks independent retakes, corrections, and zero-answer exams. The catalog check covers all 64 source identities.

Strict checks passed for the contract, local fixture server, and authoring emitter. `git diff --check` and staged diff checks passed. Scripted checks confirmed all eight helper copies, disabled flags, preserved content constant declarations, no listed Q1-only strings in Q2 added lines, and CRLF across all 28 implementation/input files. Existing planning documents were retained with line-ending normalization only. The diff-only shortcut ledger contains zero markers.

BrowserOS neo verified the actual Math Q2 loopback fixture after the final helper repairs. The review started a real quiz and invoked its finalizer with synthetic 12/20 first answers and 20/20 corrected answers. It then replaced page fetch with a rejecting offline function. The browser reported `saved=true`, `postAuthorizeRequests=0`, ciphertext-only values, matching record/outbox counts, no guest `first_correct`, and `Saved on this device — not synced. Local demonstration.` A durable epoch advance without a broadcast removed the session token/cache key, private quiz, and status. Ciphertext remained. Counts reached three because the existing fixture database contained earlier synthetic smoke records; no clean-database or manually answered quiz claim is made. The original fetch function was restored.

This browser check is a focused storage/privacy smoke, not full all-eight visual, mobile, keyboard, or production QA. The loopback server remains restricted to 127.0.0.1 and was stopped after verification.

## Blueprint and checklist outcome

M2-A checks 1.1, 1.2, 1.3 foundation validation, 1.4 fixed fixtures, 2.1/2.1a local ingestion and replay, 3.1/3.2 local ownership, 3.3 disabled access, and 4.1a capture prerequisites pass within the authorized local slice. Full 4.1 progress navigation, comparison/pairing formulas, selected-quarter summaries, selected-child dashboards, pagination, and M2-C QA remain later work, as Mason and Aria describe. No missing later milestone is treated as delivered by this gate.

## Plugin gate and handoff

Ponytail verdict: Ship for local disabled M2-A. Thermos has no unresolved critical or other confirmed finding after the repairs. Pstack applied focused reproduction, smallest root-cause fixes, subtraction, direct output checks, and verifiable repair units. Details and tool adaptations are in `LUNA_M2A_PLUGIN_AUDIT_v1.md`.

Ready for Quinn: yes, when the user authorizes that handoff. Ready for Dep: no. Quinn has not signed off. Production push and deployment remain blocked pending Quinn PASS on the reviewed checkout and separate user authorization. This is not production approval.

## Notes for Quinn

- Use the final local checkout SHA, with implementation parent `9d8e615c22f54c11c35b62a6c2426fd866e7be80` and a documentation-only review child. Verify the working tree before testing.
- Exercise actual answers and Save & Exit across all eight reviewers, including repeated finalization, cancelled pop quizzes, retakes, and no guest regression.
- Cover 390px, keyboard/retry access, focus/visibility restoration, missed BroadcastChannel messages, and delayed unlock/epoch callbacks during switching.
- Exercise storage quota/crypto failure and blocked upgrades in the real browser, along with the existing transaction-abort retry check. Never infer saved from a put request.
- Keep already-authorized offline completion distinct from offline cold unlock. Preserve device-only and local-demonstration labels. Do not activate flags or hosted APIs.
- Hosted auth, SQL grants, production sync, and the future dashboard are unimplemented and unapproved by this local gate.

[LUNA] M2-A v1.0 - 2026-10-24
Status: COMPLETE. Local disabled gate PASS.
Key outputs: Resolved chronology/access/offline defects; verified 32 checks and focused BrowserOS storage/privacy behavior; committed locally with required attribution.
Blockers: None for this review. Quinn and production authorization remain pending.
Next recommended: Quinn, awaiting user go-ahead.
