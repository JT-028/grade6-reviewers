# Dep M1 activation publication report v1

Date: 2026-10-24, Asia/Manila.
Status: COMPLETE for M1 access publication, subject to the final docs-only build
recorded in ignored `test-results/dep-m1-activation-final-safe.json`.

## Release and gates

Application commit: `d589f11d9c429e16dbfc167e8f7584950df55102`.
Luna PASS audit commit: `6e4a41e2dbbd4a4461af4e61a40562eb3beccb51`.
Quinn PASS tests that exact audit HEAD: 40 tests, eight PostgreSQL steps,
zero failures; one opt-in real local Supabase-stack test ignored.
QA report commit and first deployed SHA:
`94d6b0c4fb67e69be83366f9b0512c37b2d068ec`.
Luna and Quinn reports provide full validation and coverage boundaries.

The user authorized the full M1 activation through publication. Fresh fetch found
remote main at `0392879f6db3a15e89e8d3d4b4ec4e465224fd58`, an ancestor of the
reviewed branch. No rulesets or main branch protection were configured. Pages
remained legacy main-root publication. All five incoming commits carried required
Grok 4.6 attribution. QA documentation was committed on the feature branch;
main was fast-forwarded and normally pushed, without force or history rewrite.
No application changes, backend redeploy, schema change, new workflow, Docker or
framework were introduced by Dep.

## Exact release deployment

Pages build 1310742615: built, commit
`94d6b0c4fb67e69be83366f9b0512c37b2d068ec`, no error.
[Pages workflow 40095326398](https://github.com/JT-028/grade6-reviewers/actions/runs/40095326398):
completed, success, the same exact head SHA.
This report is the only follow-up content. Its final commit SHA, Pages build,
workflow and remote consistency are saved once to the ignored final evidence
file after they pass, avoiding self-referential report commits.

## BrowserOS live verification

[Family access](https://jt-028.github.io/grade6-reviewers/family.html)
and [public hub](https://jt-028.github.io/grade6-reviewers/) verified in BrowserOS
neo on production. Initial pre-build browser visit saw the prior disabled page;
a fresh navigation after the successful build verified the released activation.

- Family preparation fallback hidden; all four private controls enabled.
- Persistent scope notice states history/statistics unavailable and study
  results/time are not saved to family profiles. No fixture adapter bypass.
- Anonymous family initialization: zero Supabase resource requests.
- Desktop: no horizontal overflow. Browser mobile emulation 375 x 812:
  one 343px entry grid column, visible scope notice, no overflow or private fetch.
  Device emulation cleared afterward; this is not physical-device certification.
- Public hub defaults to Q2 with four original Q2 module links; #q1 selects the
  four original Q1 links.
- All eight published module URLs opened successfully as guests, rendering their
  expected subject/quarter titles and content. Every live source retains
  `FAMILY_ENABLED = false` and `FAMILY_LOCAL_ADAPTER = null`, and each has zero
  Supabase requests. Reviewer capture remains inactive.
- Read-only public hosted health from production browser origin: HTTP 200,
  status ok, API version 1, capability family_access; browser CORS succeeded.
- No private password, new account, child, device, pairing or hosted mutation was
  needed. No fresh authenticated live UI claim is made; prior independently
  attributed hosted lifecycle evidence remains in DEP_HOSTED_M1_PREPARATION_v2.

Browser automation first supplied CDP parameters as an object; the documented
JSON-string parameter corrected this tooling error. Subsequent explicit mobile
checks passed. A useful live family tab and hub tab remain open. Other agents'
tabs were preserved. The inherited owned fixture process was identified by its
exact loopback server command and stopped after verification.

## Scope, limitations and rollback

Hosted M1 is the previously prepared Auth/Edge/PostgreSQL access system; earlier
51 hosted operational assertions and synthetic cleanup remain the evidence.
This release enables profiles, PINs and device access. Family study history,
statistics, report-card amendment and dedicated JPEG/Messenger export are later
M2 scope; planning documents do not implement those features. Reviewer results
and existing local browser progress remain available.

Known limits: Retry-After is not CORS-exposed, so generic cooldown UI applies;
CPU telemetry is unavailable and measured request latency is not CPU/capacity
proof. The opt-in local-stack skip is not a hosted pass. No new hosted capacity
or real-password UI certification is asserted.

Containment rollback: on a feature branch, revert only application activation
commit d589f11 and obtain relevant gates, then fast-forward/push main normally
and verify the exact Pages build. Preserve backend schema, owner and family.
The revert also reverses that commit's planning/test additions; inspect its diff
before publishing. If urgent backend containment is independently authorized,
disable the owned function rather than deleting data. Do not rotate claim keys
without receipt/pair recovery planning. No rollback or secret rotation was run.

[DEP] v1.0 — 2026-10-24
Status: COMPLETE
Key outputs: gated normal publication; exact-SHA Pages success; live M1 and
all-eight guest checks. Final report-only build recorded by ignored evidence.
Blockers: none.
Next recommended: user can use M1 family access; future M2 awaits its next gate.
