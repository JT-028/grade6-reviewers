# Luna M1 activation review v1

Date: 2026-10-24, Asia/Manila.
Status: PASS. No critical, high, medium or low findings in this activation.
Code commit: `d589f11d9c429e16dbfc167e8f7584950df55102`.
Reviewed baseline: `00950213a3b242a5cf938562740dd81167cbd6c9`.
Audit HEAD: the subsequent docs-only commit containing this report. Resolve with
`git log -1 --format=%H -- docs/plans/family-progress/LUNA_M1_ACTIVATION_REVIEW_v1.md`.

## What the change does

The existing family page enables prepared M1 parent access, child profiles and
PINs, pairing, device approval, unlock and lock. Persistent copy states that
private study history and family statistics are unavailable. All eight reviewer
integrations remain false/null, with no hosted M2 or export feature exposed.
The approved Rex/Alex v3 report-card and JPEG amendment is planning only.

## Review evidence

The scoped diff contains `family.html`, its initialization/lifecycle tests,
`M1_SETUP.md`, Mason's report, and the authorized Rex/Alex v3 planning documents.
The parent-page configuration keeps HTTPS Supabase validation and publishable-key
validation. `ready` gates initialization and requests. Anonymous initialization
reads local device storage but sends no private request. Stored parent/child
sessions require backend validation. Backend Auth identity and provisioned-family
ownership remain mandatory. No fixture hook, shared API, schema, secret or backend
change enters this commit. The existing publishable key is public configuration.

Tests exercise the actual IIFE initialization, without forcing production mode
to enable itself. Disabled and invalid configurations reject private requests
before fetch. Existing replay, lock, sign-out and stale-response assertions remain.
The new three-mode union lives only in the test helper.

No required fix or meaningful behavior-preserving lean cut was found.
No application edits were made by Luna. No new comments, suppressions or shortcut
markers were added. See `LUNA_M1_ACTIVATION_PLUGIN_AUDIT_v1.md` for gate details.

## Validation

- `npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family` passed. 40 tests and eight PostgreSQL steps passed, zero failed. One opt-in real local Supabase-stack test was ignored.
- `npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts` passed.
- `git diff --check` and staged whitespace checks passed. All six activation/planning files have CRLF and no UTF-8 BOM.
- All eight published reviewer files remain unchanged, with false flags and null local adapters. No hub, filenames or question content changed.
- BrowserOS neo page 41 loaded the actual local `family.html`. The unavailable fallback was hidden, all four private controls were enabled, scope copy was present, horizontal overflow was false, and performance entries showed zero Supabase requests before entry. No credentials were entered.
- The inherited loopback server was stopped when Luna reached it. The first browser load failed to connect. Luna restarted the existing fixture server and repeated the real entry check successfully. The server is local session 80033 on port 8766 for Quinn.

Validation ran against the exact application/test contents committed at the code
SHA above. This audit commit changes documentation only. Quinn must independently
verify the resulting HEAD and record its SHA before publication.

## Evidence boundaries

Mason's report supplies the local synthetic sign-in/create-child/pair/approve/
unlock/lock/sign-out flow. Luna independently repeated entry and initialization,
not the credential flow. `DEP_HOSTED_M1_PREPARATION_v2.md` supplies 51 hosted
operational assertions and the confirmed owner/closed Auth/schema evidence.
Luna made no hosted request, mutation, password sign-in or deployment.

The real-stack opt-in skip is not a hosted pass. Portable PostgreSQL uses test
crypto shims. Hosted checks use production crypto. Retry-After is not exposed to
browser JavaScript, so the existing generic cooldown remains the supported UI.
Hosted CPU telemetry was unavailable; no capacity or CPU claim is made.

## Notes for Quinn

Verify the reviewed HEAD with the portable suite and enabled-family browser entry.
Use the labeled local fixture for synthetic access flow if needed. Confirm fresh
initialization avoids private fetch, invalid/disabled configuration stays closed,
all eight reviewer integrations remain false/null, truthful history/statistics
notices remain, and public guest navigation is intact. Preserve real owner state
and avoid repeated private sign-in. Future M2 statistics and JPEG work remains
outside this release.

Luna's plugin gate is PASS with a local attributed commit. Dep remains blocked
until Quinn PASS on the reviewed HEAD. No push or deploy was performed by Luna.
