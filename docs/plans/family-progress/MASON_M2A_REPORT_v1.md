# MASON PROGRESS — M2-A Complete

Project: Grade 6 Reviewers family progress. Date: 2026-10-24 (Asia/Manila).
Milestone: assessment-history foundation only. Branch: `codex/m2a-assessment-history`.
Base commit: `a92939c`. Working tree intentionally uncommitted; Luna owns the later local commit gate.

## What happened

Implemented the local catalog, validation/replay boundary, encrypted local capture and all eight reviewer start/finalizer hooks. Each independently started attempt receives one UUID, freezes its own first-answer baseline at existing finalization, and retains independent retakes. Optional completed-pop corrections stay outside that baseline. No guest-history migration, comparison calculation, summary dashboard, study timer, reward change, hosted API route, SQL migration or activation was implemented.

Production `FAMILY_ENABLED=false` and `FAMILY_LOCAL_ADAPTER=null` remain in all eight reviewers; `family.html` remains disabled. Fixture injection is available only from the separately run loopback test server, never a public URL toggle. No hosted Supabase access, provisioning, account, secret, commit, push or deployment occurred. Existing five untracked Rex/Alex/Aria input documents were preserved.

## Exact files produced or changed

| File | Purpose |
| --- | --- |
| `supabase/functions/family-api/m2-contract.ts` | Pure assessment/envelope validation, original-source-session chronology and baseline grade/result DTO; no network or hosted registration. |
| `supabase/functions/family-api/deno.lock` | Pinned test-only `fake-indexeddb@6.2.4` integrity; no browser/application dependency. |
| `family.html` | Version2 IndexedDB upgrade preserving credentials; records/outbox/metadata stores; lock/unlock access epoch coordination, including delayed-unlock generation guard. |
| `History6_Review_Module_v1.0.0.html` | Inline fixed Q1 catalog, disabled private helper, start/finalizer hooks and guest/private storage boundary. |
| `History6_Q2_Review_Module_v1.0.0.html` | Same responsibilities for History Q2 only. |
| `Math6_Review_Module_v1.0.0.html` | Same responsibilities for Math Q1 only. |
| `Math6_Q2_Review_Module_v1.0.0.html` | Same responsibilities for Math Q2 only. |
| `Geography6_Review_Module_v1.0.0.html` | Same responsibilities for Geography Q1 only. |
| `Geography6_Q2_Review_Module_v1.0.0.html` | Same responsibilities for Geography Q2 only. |
| `Language6_Review_Module_v1.0.0.html` | Same responsibilities for Language Q1 only. |
| `Language6_Q2_Review_Module_v1.0.0.html` | Same responsibilities for Language Q2 only. |
| `tests/family/m2_catalog_inventory.ts` | Isolated source literal inventory and canonical semantic/policy SHA-256 derivation. |
| `tests/family/m2_build_reviewers.ts` | Authoring utility emits apply_patch input for duplicated inline helpers/hooks; not browser runtime. |
| `tests/family/m2_reviewer_template.js` | Test/authoring reference for duplicated inline capture/storage code; no published page imports it. |
| `tests/family/m2_fixture_repository.ts` | Injected synthetic-principal repository using existing FamilyRepository shape; scoped ingestion/history, permanent identity and receipt conflicts. |
| `tests/family/fixtures/m2-results.json` | Frozen source pool/digest inventory and hand-specified score/grade cases. |
| `tests/family/m2_contract_test.ts` | Seven meaningful contract/catalog/replay/authorization/chronology checks. |
| `tests/family/m2_browser_test.ts` | Four VM/IndexedDB integration checks using actual reviewer functions across eight files; no visual-QA claim. |
| `tests/family/m2_browser_fixture.ts` | Isolated loopback-only synthetic session/validation adapter and in-memory guest-storage sandbox. |
| `tests/family/browser_fixture_server.ts` | Adds dedicated M2 fixture handling while preserving existing M1 fixture. |
| `docs/plans/family-progress/M2_CONTRACT_FIXTURES_v1.md` | Preimplementation fixed fixture inputs, outcomes and deferred comparison oracle. |
| `docs/plans/family-progress/MASON_M2A_REPORT_v1.md` | This handoff and evidence. |

## Frozen source inventory

Each file has six pop sets plus exam-1/exam-2, revision1:64 catalog identities total. All sampled totals are actually20/70. Catalog digests version source meaning, policies, requested and actual totals separately from administered sample fingerprints. Ordering/options alone do not alter semantic identity; generated True/False statement meaning participates in administered provenance.

| Subject/quarter | Deduplicated pop pool | Exam pool |
| --- | --- | --- |
| History Q1 | 258 | 140 |
| History Q2 | 257 | 139 |
| Math Q1 | 248 | 140 |
| Math Q2 | 248 | 140 |
| Geography Q1 | 260 | 140 |
| Geography Q2 | 258 | 140 |
| Language Q1 | 259 | 140 |
| Language Q2 | 258 | 140 |

## Checklist / Definition of Done

- [x] 1.1 comparable identity: module/subject/quarter/kind/set/revision catalog, separate administered fingerprint, immutable64-row source oracle.
- [x] 1.2 per-attempt baseline: new retakes retain independent rows; pop correction separate; finalized zero-answer exam eligible; abandoned pop excluded.
- [x] 1.3 M2-A validation: strict finite integer/range/total/finalized/version/time checks; no incoming clamping; original rounded DepEd descriptor retained. Comparison formulas remain documented for M2-B.
- [x] 1.4 fixture expectations: synthetic oracle and fixtures cover foundation cases; later comparison/race/mobile expectations remain Aria section9, not claimed implemented.
- [x] 2.1 / 2.1a ingestion and immutability: normalized baseline DTOs; exactly-once same-ID delivery; conflicting receipt/result rejects; all64 actual catalog paths accepted with correct totals.
- [x] 3.1 local interface: injected verified fixture principals, existing dispatch shape, local adapter with no production HTTP additions.
- [x] 3.2 M2-A scope: child/parent/device/source-session negative cases; parent selected-child ownership and revoked access checked before replay disclosure. Hosted authorization is not claimed.
- [x] 3.3 disabled boundary: no activation or hosted mutation; public guest never queues family records.
- [x] 4.1a M2-A capture slice: all eight actual pop/exam start/finalizer paths, synchronous completion latch, IDs allocated at actual start, same frozen ID/time on save retry, stale callback guard, original early exam scoring preserved.
- [x] Aria persistence prerequisites: AES-GCM fresh96-bit IVs and store/child/module/attempt/schema AAD, record+outbox atomic transaction, access-epoch check inside write transaction, success only on tx complete, retry/Not saved labels, private results blocked from guest localStorage, lock clears private state while retaining ciphertext.

4.1 navigation/quarter-aware progress entries, 2.2 onward comparisons and 4.2 onward dashboard UI remain M2-B. Full M2-C resilience/mobile/accessibility review and Luna/Quinn gates are not claimed complete by these builder checks.

## Checks and results

Executed with local Deno2.9.6 through `npx --yes deno` (Deno not on shell PATH):

```powershell
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_browser_test.ts
npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/m2-contract.ts tests/family/browser_fixture_server.ts
git diff --check
```

Results:26 passed/0 failed (11 existing API,4 existing M1 lifecycle,7 new contract,4 new capture/IndexedDB integration); strict type checks passed. All eight complete published scripts parse. All64 inline catalog rows match the frozen source inventory. Record decryption confirms12/20 baseline remains60% DNME after20/20 corrections,16/20 retake stays independent, and zero-answer exam stays0/70. Tests cover concurrent replay, fresh same-child session, changed payload conflict, parent/child ownership, unsupported revisions, invalid chronology, transaction abort then same-ID/time retry, epoch rejection, stale answer callbacks, sample semantic shuffling and guest storage exclusion.

After the final delayed-unlock generation guard, the relevant existing M1 lifecycle suite was rerun:4 passed/0 failed. Final `git diff --check` passed; CRLF verification passed for22 owned files and required const/Q2 added-line leak checks passed across all eight reviewers.

BrowserOS neo actual-browser smoke: dedicated local Math Q2 fixture rendered quiz and result UI; used the existing finalizer programmatically with synthetic12/20 first and20/20 corrected counts (not a claim of a manually answered full quiz). Real IndexedDB reported records1/outbox1, each value containing only ciphertext/iv/schema_version; UI said “Saved on this device — not synced. Local demonstration.” Guest storage contained no private first-answer score. Clearing access removed private quiz/exam/status, restored guest result state, and retained the encrypted record. The loopback fixture uses in-memory guest storage so the browser's prior guest progress is untouched. Full all-eight browser UI/390px/keyboard QA remains Quinn's later work.

Final formatting/isolation checks: touched/new owned text files normalized to CRLF; required content const identifiers and published filenames retained; added Q2 lines contain none of the known Q1-only leak strings. `index.html`, M1 production API dispatcher/auth/validation/crypto and existing SQL migration are unchanged.

## Scope decisions, limitations and deviations for Luna

- No SQL migration or production route/parser/auth changes: blueprint section8 makes local SQL/backend slice optional and separately authorized. Local repositories/DTO validation are the foundation seam; future hosted schema and exact HTTP activation remain unimplemented.
- Local history reads currently return a complete filtered synthetic scope. Snapshot cursors/paging, deterministic sorting/comparison, progress DTO endpoints and UI are deferred to the history/comparison presentation slice; no production API capability advertises them.
- Two implementation-support files (authoring template/emitter) and the isolated browser-fixture helper expand the planned responsibility list to avoid manual drift across duplicated browser helpers. No shared browser JavaScript was introduced.
- Test-only fake IndexedDB is pinned in the existing Deno lock. It does not replace the actual-browser smoke or later hosted-security/QA evidence.
- Guest compatibility objects still render the existing current result, but private-session saves are held in memory and never written to guest localStorage. Lock restores prior guest progress and clears private result DOM. Durable history comes only from encrypted records/outbox and the local repository, never overwritten guest objects.
- Fixture validation is pure before browser transaction commit; it does not add a server-confirmed record or flush the outbox. Parent fixture datasets do not automatically acquire another device's pending work. No automatic queue flusher, polling, hosted retries or synced claim exists.
- No completed attempt rows are migrated/backfilled from guest names. No production user/account was created. Local clocks remain household telemetry; unknown/unverified chronology is retained for later honest comparison handling.
- The local fixture server was used only on127.0.0.1:8766. Launch command: `npx --yes deno run --allow-read --allow-net=127.0.0.1:8766 tests/family/browser_fixture_server.ts`; fixture page path `/__family_m2_fixture__/Math6_Q2_Review_Module_v1.0.0.html`. It must never be run as a public server.

## Handoff

Pure/testable: catalog semantic inventory; envelope/catalog validators; grade/result DTO projection. Require mocks/local adapters: repository principal registry and receipt retention; IndexedDB/crypto/access lifecycle; browser fixture transport. Luna should review the full diff plus this report, focusing on auth-before-replay, immutable source provenance, private/guest storage separation, epoch/unlock races and all-eight parity. Quinn later validates the exact reviewed local SHA. No next agent is invoked here.

[MASON] M2-A v1.0 — 2026-10-24
Status: COMPLETE for authorized local foundation
Key outputs:
- 64 source-versioned catalog identities, immutable local attempt/replay contract and synthetic ownership evidence.
- Eight disabled self-contained capture integrations with atomic encrypted history/outbox and honest save status.
- 26 passing builder checks plus BrowserOS local smoke; no hosted activation or commit/push.
Blockers: None for M2-A. Hosted implementation/activation and M2-B/C remain outside this handoff.
Next recommended: Luna review of M2-A, awaiting user go-ahead.
