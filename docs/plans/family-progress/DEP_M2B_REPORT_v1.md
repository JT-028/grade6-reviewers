# Dep M2-B foundation publication report v1

Date: 2026-10-25, Asia/Manila. Status: COMPLETE for the authorized static
publication, subject to final documentation-only build evidence in ignored
`test-results/dep-m2b-final-safe.json`.

## Release and gates

Reviewed application/test source: `076f12fbdf0c69a7ba3230226e7593c4cd08dad7`.
Luna PASS audit: `13d1c7da9d7d9cc812889aa069226b01f9cb0f4d`.
Quinn M2-B v2 independently tested that audit tree: 51 passed, zero failed or
skipped with Deno type checking. It resolves the historical v1 HIGH epoch/cache
invalidation failure; the original failure and evidence remain in v1.
The source-to-audit difference contains only Luna documentation. Dep made no
application or test changes and did not repeat the already-passing suite.

Quinn report commit and first published release:
`746049f7cb75a71298100c4ec2ec3260e6dddc56`.
All five incoming commits include required Grok 4.6 coauthor attribution.
Target is the existing legacy GitHub Pages main branch, repository root.
Fresh fetch found main at `b34140e01ff1dceb4ca6ea3b742b048b0a6a4d61`, an ancestor
of the reviewed branch, with no remote drift, branch protection or branch rules.
Quinn documentation was committed on `codex/m2b-local-progress`; main was
fast-forwarded and pushed normally. No force push or history rewrite occurred.
The initial only-untracked file was Quinn v2; no other user work was changed.
Changed-file secret-pattern inspection and git diff checks passed. No runtime,
credential or MCP-header artifact was added. No new CI, framework or container
was appropriate for this static publication.

## Exact release deployment

Pages build **1312231901**: built, no error, exact commit
`746049f7cb75a71298100c4ec2ec3260e6dddc56`.
[Pages workflow 40156709995](https://github.com/JT-028/grade6-reviewers/actions/runs/40156709995):
completed, success, the same exact head SHA.
This report is the sole follow-up change. Final report commit, remote/local SHA
consistency and its exact successful Pages/workflow result are written once to
the ignored final evidence file to avoid recursive audit commits.

## Live BrowserOS verification

[Hub](https://jt-028.github.io/grade6-reviewers/) and
[family access](https://jt-028.github.io/grade6-reviewers/family.html) were checked
in BrowserOS neo after successful release publication.

- Family M1 parent sign-in/device-approval entry controls remain enabled.
  Persistent scope notice says family history/statistics are unavailable and
  study results/time are not saved to family profiles.
- Family source has all three M2 gates false and local adapter null. The eight
  reviewers have FAMILY_ENABLED and history/report/JPEG gates false, adapter
  null. Anonymous family initialization and all eight guest report sessions each
  showed zero Supabase resource requests. No private authenticated request,
  login, profile, pairing, backend deploy or hosted mutation was performed.
- Hub defaults to Q2 with its four original Q2 module links and
  `family.html#q2`; selecting Quarter 1 changes to four original Q1 module links
  and `family.html#q1`. All eight reviewer back links retain their proper quarter.
- Every published reviewer opened through its normal guest welcome flow and
  Report Card tab. Each Save as Image control produced an actual PNG download.
  Native image decoding verified all eight files are valid 680 x 520 PNG images.
  No populated score or family statistics image is claimed. File sizes: Geography
  Q1 43138/Q2 43763; History Q1 42845/Q2 42918; Language Q1 42970/Q2 43032;
  Math Q1 42404/Q2 42576 bytes. Downloads use only the synthetic Releasecheck name.
- Each guest session's pre-interaction localStorage entries were retained in
  page memory, restored exactly and verified before closing that owned tab.
  No stored values were printed. Existing user/other-agent fixture tabs were
  untouched; useful live family and hub tabs remain open.
- Family desktop has no horizontal overflow. At browser-emulated 375 x 812,
  main width is 343px, scope notice is visible and no horizontal overflow occurs.
  Keyboard Tab moves parent email focus to password with visible focus. Device
  metrics were cleared afterward. This is a focused smoke, not physical-device
  or complete accessibility certification.
- Production `__family_m2_fixture__/family.html` returns 404. No public adapter
  bypass or demo authentication route was published.

The initial automated Geography check read the image control before render had
settled; waiting for its actual selector resolved the tooling timing issue. The
same original tab then downloaded successfully and its storage was restored.
No application bug was found. No unknown local server process was stopped.

## Scope and remaining work

Published source is the reviewed M2-B local foundation: canonical report math,
projection, fixture paging, encrypted report cache, pending overlay and scoped
report integration. Static gates keep it inactive in production. Existing M1
access remains the previously deployed service; prior hosted operational evidence
is referenced by DEP_M1_ACTIVATION_REPORT_v1, not recertified here.

Production M2 schema/API/catalog/capability/queue transport bridge and its hosted
acceptance are unimplemented/deferred. M2-C dedicated JPEG/Messenger export is
also deferred. Existing guest PNG is distinct from that future export. No live
family study saving, statistics, native-browser epoch race, complete SQL/auth
suite, fresh coverage or production M2 readiness claim is made.

## Rollback

If necessary, create a feature branch from current main and revert the two
application commits in reverse order: `076f12f`, then `f2561d4`. Inspect the
combined diff, preserve audit reports, obtain applicable Luna/Quinn gates, then
fast-forward/push main normally and verify the exact Pages build. Previous live
main `b34140e` identifies the prior application state; use comparison rather than
reset/force push. Do not delete backend data, rotate access keys or disable the
existing M1 service for a static M2-B rollback. No rollback was run.

[DEP] M2-B v1.0 — 2026-10-25
Status: COMPLETE
Key outputs: reviewed normal publication; exact-SHA Pages success; live M1,
all-eight guest PNG, quarter and focused mobile verification.
Blockers: none for this static foundation publication; production M2 bridge and
M2-C remain future milestones.
Next recommended: awaiting user direction; no automatic specialist handoff.
