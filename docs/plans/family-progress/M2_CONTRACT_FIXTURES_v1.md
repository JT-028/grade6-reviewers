# M2-A fixture oracle — v1

Synthetic local-only inputs, frozen before implementation, 2026-10-24. No hosted requests or production authentication. Full comparison and UI expectations remain Aria section 9 and are deferred to M2-B/C.

## Identity and catalog

`tests/family/m2_catalog_inventory.ts` evaluates only isolated literal question declarations, inventories actual deduplicated pools and freezes SHA-256 catalog digests. Canonical source items retain correct answer meaning and sorted options/items; policy source and requested/actual totals participate. Sample fingerprint hashes the administered semantic item multiset separately. Ordinary shuffled options/questions preserve identity. Published pool/key/scoring/total/generator changes require a new revision; a catalog mismatch rejects capture.

## Fixed local cases

Invented UUIDs use family F `10000000-0000-4000-8000-000000000001`, family G ending 002, A/B/C `20000000-0000-4000-8000-000000000001/002/003`, device D `40000000-0000-4000-8000-000000000001`. The test creates verified synthetic principals in memory, never a public auth switch. Source sessions span 2026-10-24T00:00:00.000Z–08:00:00.000Z, completion at 01:00 then 02:00; simulated receipt 03:00.

| Input | Fixed expected outcome |
| --- | --- |
| Test catalog pop total10: first6, answered10, correction10; distinct retake8 | Two rows, 60.00% DNME and 80.00% S; correction remains separate, first baseline stays6. |
| Exact replay, fresh receipt key or fresh authorized same-child session | 200 duplicate, exactly two rows, original time/ID unchanged. |
| Same ID changed score/date/revision/correction | 409 ATTEMPT_CONFLICT, accepted row unchanged. Same receipt key changed body:409 IDEMPOTENCY_CONFLICT. |
| Exam total70, zero correct/zero answered, explicitly finalized | Accepted0.00%, DNME; missing fields/unfinalized rejects422. |
| Negative, fractional, nonfinite, >total, total0, incomplete pop, exam correction | 422 INVALID_RESULT; unknown catalog404; known tuple unsupported revision422. |
| Child A current access asks B/source B; revoked/expired current device/session; parent writes score | Denied before result/replay disclosure. ParentF reads A/B only; C returns404 PROFILE_NOT_FOUND. |
| Same-key different sampled fingerprint; second published revision | Retakes retain same revision; second revision stays separate by assessment ID. |
| Anchored completion outside source session/future >2min | 422 INVALID_TIME. Unknown time may be null, never supplies a directional trend. |
| Reviewer pop exit, exam cancellation, results re-render, retry, new retake | No abandoned result or cancellation ID; one frozen ID/time per finalized attempt; independent retake new ID. |
| AES failure/transaction abort or lock during save | Explicit Not saved, no success acknowledgment, prior ciphertext retained. Durable success: Saved on this device — not synced. |

## Local interface

`dispatch(operation, verified fixture credential_context, payload)` follows the M1 repository shape. Only local fixture code injects principals. Record input is Aria's `client_version/attempt/correction` envelope; the fixture transport passes receipt id separately as `_idempotency_key`. Server-derived scope never comes from the result body. Child history read accepts quarter and optional subject/kind/assessment_id; parent history additionally requires selected child in verified family. M2-A history reads return full fixture scope, without pretending to implement M2-B pagination or summaries. No production route, dispatcher, schema or capability is enabled.

Expected later comparisons:60→75:+15.00pp/+25.0%;75→60:-15.00pp/-20.0%;0→0:Unchanged/relative unavailable;42/70→53/70:+15.71pp/+26.2%. Empty quarters remain selected; unverified chronology suppresses directional summaries. These are fixed oracles for the later slice, not M2-A implementation claims.
