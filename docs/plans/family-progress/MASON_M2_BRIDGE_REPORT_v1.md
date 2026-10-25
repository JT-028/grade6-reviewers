# Mason M2 production bridge report v1

2026-10-25 · Branch `codex/m2-production-bridge` · Base `a43b98ed58c41053eb773e3b19be50ddea14c6cf` · Status: COMPLETE for the authorized local bridge build. No commit, push, hosted mutation, activation, JPEG implementation or downstream handoff was performed.

## What was built

The bridge now connects immutable reviewer capture to a real authenticated backend, durable encrypted delivery, retained history and canonical private summaries. It is locally implemented and demonstrated, while all published M2 gates remain closed. Existing M1 behavior and the repaired typed epoch/cache invalidation remain intact.

| Checklist / DoD | Result |
|---|---|
| Aria 2: additive private catalog/attempt/correction model, composite source session FK, immutable rows, restrictive FKs/RLS and child revision heads | COMPLETE; exact final M1 then M2 SQL applied to a separate real PostgreSQL/pgcrypto database; integration function bodies match after CRLF normalization. |
| Aria 2: frozen actual production catalog, no answers/private identity | COMPLETE; all 64 rows equal the independent source inventory and its reviewed semantic digests; bounded manifest and exact digest checked. |
| Aria 3: authenticated routes, strict filters, source ownership/time window, permanent replay and atomic ingest | COMPLETE; real local Auth/Edge/PostgREST/SQL acceptance, conflict, concurrent retry, expired-source recovery, revoked-source denial and immutable correction checks pass. |
| Aria 3: compatible capability/bootstrap, full-scope summaries and revision-scoped HMAC/keyset history | COMPLETE; old M1 routes retain query rejection, new filters are allowlisted, wrong scope/future revision/forged ordering tuples reject; late t2 appears only after refresh. |
| Aria 4: family/eight-tab canonical parity and practical same-tab navigation | COMPLETE; native BrowserOS real-backend checks found one academic digest across all nine views at the same quarter/revision, server provenance and null fixture adapters. Existing hub links already satisfy same-tab navigation. |
| Aria 5: real bootstrap/manifest transport, ciphertext outbox, stable IDs, bounded foreground flushing and full-response acknowledgement transaction | COMPLETE; native exam finalizer → AES-GCM stores → real 201 acceptance → lost response → same-ID 200 duplicate → encrypted confirmation/outbox deletion demonstrated. Each pass is serial and capped at 25, with explicit Sync remaining, capped retry cooldown and permanent-error retention. |
| Aria 5: epoch/access lock, stale callbacks, cold navigation and same-child resume | COMPLETE; native reviewer→family navigation flushed an offline-retained result; an epoch change during a held real acknowledgement cleared credentials/projection and retained ciphertext/outbox. All prior all-nine scheduled epoch/cache guards pass. |
| Deployment/migration safety packet | COMPLETE in M2_BRIDGE_SETUP_v1.md, including exact byte checksums, mandatory M1 equivalence/ledger reconciliation or dashboard-only alternative, backend-before-client checks and preservation rollback. |

## Exact changed files

Production SQL/backend:

- `supabase/migrations/202610240001_m2_attempt_history.sql` — new additive transaction, catalog seeds, revision model, integrity guards, private M1 delegate and service-only dispatcher.
- `supabase/functions/family-api/m2-catalog.json` — new frozen production Assessment manifest.
- `supabase/functions/family-api/m2-bridge.ts` — new real route dispatch, filters, canonical HMAC scopes/cursors, envelope normalization, permanent digest, bounded SQL-result conversion and response validation.
- `supabase/functions/family-api/index.ts` — new routes/query handling and compatible health capabilities; all M1 branches preserved.
- `supabase/functions/family-api/crypto.ts` — exact-byte HMAC helper; existing mutation digest retains its original domain prefix and behavior.

Published self-contained HTML:

- `family.html` — real production adapter integration, same-child unlock/resume queue handling, retry/status, epoch invalidation and post-ack refresh.
- `History6_Review_Module_v1.0.0.html`
- `History6_Q2_Review_Module_v1.0.0.html`
- `Math6_Review_Module_v1.0.0.html`
- `Math6_Q2_Review_Module_v1.0.0.html`
- `Geography6_Review_Module_v1.0.0.html`
- `Geography6_Q2_Review_Module_v1.0.0.html`
- `Language6_Review_Module_v1.0.0.html`
- `Language6_Q2_Review_Module_v1.0.0.html`

Each reviewer receives the same generated inline transport, production capture authorization, queue triggers and canonical report adapter. No shared browser JavaScript, question/content change, published rename or guest-history import was added.

Maintenance/test files:

- `tests/family/m2_transport_template.js` — new production bootstrap/catalog/HTTP adapter and encrypted queue core, duplicated into all nine pages.
- `tests/family/m2_reviewer_template.js` — capture/flush/resume/lock integration and stable persistence behavior.
- `tests/family/m2_report_template.js` — accepts the authenticated production catalog after bootstrap; preserves all repaired epoch/cache guards.
- `tests/family/m2_build_reviewers.ts` — per-file regeneration option.
- `tests/family/m2_build_reports.ts` — builds identical inline transport/report owners.
- `tests/family/m2_build_catalog.ts` — build-time actual-source inventory to frozen catalog patch; never imported by production.
- `tests/family/m2_production_test.ts` — exact source/catalog parity, minimized metadata, closed gates and all-nine transport parity.
- `tests/family/m2_real_bridge_test.ts` — actual local SQL/Auth/Edge adversarial checks, synthetic rows only, no truncate/reset.
- `tests/family/m2_schema_test.ts` — exact complete migration/real pgcrypto/grant proof in a separately named local database and function comparison.
- `tests/family/m2_bridge_server.ts` — dedicated labeled loopback production-mode integration host using real backend transport; no fixture repository.

Documentation: this report and `docs/plans/family-progress/M2_BRIDGE_SETUP_v1.md`.

`auth.ts`, `validation.ts`, `m2-contract.ts`, `m2-progress.ts`, `index.html`, original M1 SQL and prior reports remain unchanged. Their existing strict validators/reducer/getUser/service repository are reused. The unchanged hub already navigates in the same tab and preserves the selected quarter.

## Evidence and commands

The independent existing arithmetic/projection oracle files were retained. No expected grade/delta was generated from the implementation being checked. The real test independently asserts 42/70→53/70 = 60.00→75.71%, +15.71pp/+26.2%, DNME→FS, plus exact completion/revision selection and separate correction values.

Final affected command:

```powershell
$env:FAMILY_REAL_STACK='1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --allow-net --allow-run --allow-write tests/family/api_test.ts tests/family/browser_lifecycle_test.ts tests/family/m2_contract_test.ts tests/family/m2_progress_test.ts tests/family/m2_browser_test.ts tests/family/m2_report_test.ts tests/family/m2_production_test.ts tests/family/m2_real_bridge_test.ts tests/family/m2_schema_test.ts
```

Result: **55 passed, 0 failed, 0 ignored**, including **10 real bridge steps**. Breakdown: 11 API + 8 M1 lifecycle + 9 Envelope/catalog contract + 3 progress + 12 capture + 8 report/epoch + 2 production artifact + 1 real bridge + 1 exact migration test. Evidence: ignored `test-results/m2-bridge-final.log`. Type checking passed for the Edge entry and new integration/server/schema tests. `git diff --check` passed; changed source files were normalized to CRLF without BOM.

The real bridge steps cover verified Auth owner/non-owner, service-only grants, exact catalog/bootstrap, concurrent ingest/replay, stable revision, delivery-key conflict, permanent attempt conflict, invalid scores/fields, parent-child parity, strict/wrong-scope/forged cursors, delayed arrival, atomic correction/immutability, all retained attempts, expired versus revoked original sessions, and current expiry/revocation/archive/device generation/PIN/allowlist checks before reads or duplicate disclosure. The final SQL proof uses actual pgcrypto, not a shim. Existing synthetic fixtures/VM tests are labeled as such and do not replace this service-boundary proof.

BrowserOS neo actual local production-mode evidence is summarized in ignored `test-results/m2-bridge-browser-evidence.json`:

- All eight named reviewers and family.html, selected Q2 at a common revision: academic digest `80f58ce67e3492cf2658ba391ccfe7cc040238027a3f2988fe20806c4b3daff3`, provenance server, local adapter null.
- Existing exam start/finalizer persisted a valid early-finalized zero score. A deliberately discarded actual acceptance response yielded 201 accepted followed by 200 duplicate for the same attempt UUID. One ciphertext-only record remained; outbox count became zero.
- A separate offline delivery failure retained pending work. Clicking the existing Family progress link navigated in the same tab; family resume flushed it and showed server provenance/pending_count zero.
- Holding an actual accepted response, advancing the durable epoch, then releasing the response cleared the session credential and report projection. Three ciphertext records and the one unacknowledged outbox item remained.

The integration host uses port 8767 because an earlier QA server already owns 8766; its transparent loopback relay keeps the existing M1 CORS allowlist. Synthetic local startup supplies a prior authorized child session; it does not simulate repositories or use real parent/child data. Actual parent Auth ownership is separately verified by the real API suite. No new native mobile/390px or browser parent-login proof is claimed here; earlier deterministic/UI evidence remains separate.

## Fixes and implementation choices for Luna

- The first real PostgreSQL correction test exposed a top-level-versus-subtransaction XID assumption. The final immutable correction guard checks a visible baseline's in-progress xmin status, allowing only same-transaction inserts under MVCC. A later correction insert after commit is denied. This passed real SQL and the exact final migration test.
- Exact-schema comparison normalizes CR only, because PostgreSQL preserves CRLF inside function source while PowerShell/local Deno application paths used different line endings. No SQL body difference was ignored beyond CR normalization.
- M1 is preserved through a private delegate instead of duplicating/re-editing its full dispatcher body. New `_m2_scope`/capability operations are internal service dispatch details; no extra HTTP API was introduced. Review grants, auth locks, revision cursor order and permanent/delivery identity separation closely.
- No product/schema/API deviation from the approved bridge packet is outstanding. The local relay, preserved delegate and bounded candidate rows are implementation details, explicitly flagged for review.

## Gates, limits and remaining work

All nine HISTORY/REPORT/JPEG flags are false and all nine fixture adapters null. Family M1 stays true with its existing public configuration; reviewer FAMILY_ENABLED stays false in all eight files. There is no public activation toggle or fallback to fixtures. Production imports no tests. Private live statistics remain unavailable until a separately reviewed backend deployment and client activation.

No existing Docker service was stopped, no unknown database/user reset, no hosted call/mutation was made, and no secret/credential file is tracked. The real suites add clearly synthetic local accounts/devices/children and retain immutable attempts. Their separate local proof databases and ignored credentials/logs remain for review. The dedicated local server is owned by this run; earlier servers were left untouched. Old M1 real-stack reset-fixture tests were not rerun against retained M2 history; the new suite exercises the actual service boundary without destructive cleanup.

JPEG preparation/share/save, native file handoff, mobile JPEG readability and their privacy races remain unimplemented as the separate M2-C slice. Hosted migration/ledger reconciliation, exact deployed capability checks, operational synthetic checks, reviewed client enabling and GitHub Pages publication remain Dep work after applicable gates. This local build and its evidence are not Luna PASS, Quinn PASS or a deployed release.

[MASON] M2 bridge v1 — 2026-10-25
Status: COMPLETE
Key outputs: additive production SQL/catalog/API; real encrypted queue and all-nine report integration; real SQL/Auth/Edge and native browser evidence plus safe setup packet.
Blockers: None for this local build. Later review, JPEG and deployment remain separate.
Next recommended: Await user-directed Luna review/local commit. No next agent invoked.
