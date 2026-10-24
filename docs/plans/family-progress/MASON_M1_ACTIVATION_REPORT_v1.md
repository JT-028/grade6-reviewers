# MASON PROGRESS — M1 activation complete

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Milestone: Existing M1 family access activation only
Baseline: `codex/m2a-assessment-history`, HEAD `00950213a3b242a5cf938562740dd81167cbd6c9`
Status: COMPLETE — ready for Luna review, local commit and the authorized downstream gates

## Authority and inputs

The user authorized the immediate Mason → Luna → Quinn → Dep publication sequence
after the future report-card plan amendment. Alex v3 explicitly separates this
M1 activation from future M2 statistics and JPEG work. Inputs read: repository
AGENTS, agent-squad/Mason skills, Alex v3, actual `family.html`, `M1_SETUP.md`,
and `DEP_HOSTED_M1_PREPARATION_v2.md`. Hosted preparation has 51 passing operational
assertions with the confirmed owner preserved and synthetic records cleaned.
Aria may be skipped for this small flag/copy change: no file layout, schema,
route, data shape or cryptography change is needed.

## Files delivered

- `family.html` — enables the existing verified public configuration for M1 only;
  replaces preparation fallback wording; adds a persistent scope notice for
  parent profiles/PINs, pairing, approvals, unlock and lock; explicitly states that
  study history and family statistics remain unavailable, including the child panel.
- `tests/family/browser_lifecycle_test.ts` — runs production configuration without
  forcing the enable flag; exposes init only inside the test VM; verifies actual
  initialization enables entry without anonymous private fetches, while disabled
  and invalid configuration keep controls and network access closed. Existing
  lifecycle/replay/race tests remain intact.
- `docs/plans/family-progress/M1_SETUP.md` — records the current staged authorization,
  enabled family-only configuration, truthful limitations, local fixture behavior
  and containment rollback. Historical preparation reports remain unchanged.
- This report — review packet and evidence boundaries.

## Checklist

- [x] M1 parent login, child profiles/PINs, approval/pair/unlock/lock use the existing
  reviewed client and backend contract. No new signup, reset or email flow.
- [x] All eight reviewer files remain byte-for-byte unchanged by Mason, with
  `FAMILY_ENABLED = false` and `FAMILY_LOCAL_ADAPTER = null`.
- [x] Hub, Q1/Q2 links, published filenames, content constants and guest behavior
  remain unchanged. No fixture capability or M2 statistics/export is exposed.
- [x] No hosted mutations, backend edits, credentials, real child data, commit,
  push, deployment or next-agent invocation during this builder seat.
- [x] Existing untracked Rex v3 and Alex v3 documents preserved.
- [x] Modified/new builder files normalized to CRLF without BOM; diff whitespace
  and change-scope checks pass.

## Exact validation

1. `npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts`
   — PASS.
2. `npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family`
   — PASS: 40 tests, 8 PostgreSQL steps, 0 failures, 1 ignored opt-in real local
   Supabase-stack test. Includes all eight reviewers' frozen catalogs, inactive
   capture, access races, encryption and finalizer checks.
3. Focused lifecycle + contract run — PASS: 16 tests. After test-only formatting,
   lifecycle rerun — PASS: 8 tests, 0 failures.
4. BrowserOS neo, real `http://127.0.0.1:8766/family.html` served unchanged by the
   existing loopback fixture server: unavailable fallback hidden, all four private
   controls enabled, entry visible, persistent unavailable-history/statistics copy
   present, no horizontal overflow at the observed desktop viewport. No credentials
   entered or requests intentionally submitted on the real hosted-backed page.
5. BrowserOS neo, visibly labeled `__family_m1_fixture__.html`: synthetic parent
   sign-in → create child with PIN → separate child tab requests pairing → parent
   selects profile/reviews/confirms approval → child checks approval/unlocks with
   PIN → truthful child history/statistics notice → child lock → parent sign-out.
   PASS. These are local synthetic UI checks, not fresh hosted password-entry
   evidence. The initial wait for an overly specific sign-in status timed out;
   the parent panel snapshot established successful login, and subsequent waits
   used actual profile/approval/panel signals successfully.
6. Fixture cleanup: child locked, parent signed out, exact known synthetic device
   credential removed from local IndexedDB without reading/outputting its value.
   Child fixture tab closed; remaining browser tab restored to the real local
   family entry page with empty status and enabled sign-in.
7. `rg` confirms false/null in all eight reviewers; `git diff --check` passes and
   changed-file inventory contains only the activation page, focused test and docs.

## Limitations and deviations

No contract or scope deviation. No backend operation was repeated: rely on Dep's
hosted v2 evidence for real Auth/Edge/PostgreSQL setup. That evidence distinguishes
the owner's earlier private password sign-in from the administrator-generated
no-email test session. The ignored local-stack test is not reported as a hosted
pass. Portable PostgreSQL uses existing test-only pgcrypto shims; it does not prove
production cryptographic packaging. The hosted v2 report supplies those checks.

Existing advisory remains: HTTP 429 has wire `Retry-After: 900` but no browser
exposure header, so the existing generic cooldown message works without a precise
countdown. Hosted CPU telemetry was unavailable; prior timings are network latency
samples, not CPU benchmarks. M1 still provides no private study history, statistics,
report-card JPEG, or hosted M2 endpoints. Future Rex/Alex v3 work awaits Aria.

## Luna handoff

Review the three edited files plus this report against baseline HEAD. Verify the
activation/future-M2 separation, prepared backend evidence, no secrets, all-eight
false/null boundary, and CRLF. No production client functions were redesigned;
tests exercise the actual IIFE functions with fetch/DOM/IndexedDB mocks.
After Luna PASS and its attributed local commit, Quinn must test that reviewed
SHA before Dep performs the user-authorized publication. No prior disabled-release
gate substitutes for those new enabled-release checks.

[MASON] v1.0 — 2026-10-24
Status: COMPLETE
Key outputs: M1-only enabled family access and truthful notices; focused fail-closed
initialization tests; full portable suite and local BrowserOS smoke pass.
Blockers: none.
Next recommended: Luna under the already authorized sequence.
