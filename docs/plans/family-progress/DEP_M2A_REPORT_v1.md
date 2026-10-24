# Dep M2-A deployment report v1

Date: 2026-10-24, Asia/Manila.
Status: COMPLETE for publishing the reviewed disabled M2-A static foundation.

## Source and authorization

The user explicitly authorized Dep to commit, push, and deploy all reviewed current work.
Applied installed Dep, commit, and BrowserOS neo skills. The requested commit-push skill was
not installed in the searched skill/plugin roots; the installed commit skill supplied the
commit conventions and branch check. Repository attribution overrides the generic example.

Reviewed implementation: `9d8e615c22f54c11c35b62a6c2426fd866e7be80`.
Luna review documentation: `55cf53af8ee97ba51949762c7e3626de5ae5fb81`.
Published reviewed source: `f28503e73bc7f4f0f1cd166789b9946bb5fab109`.
Prior production: `a92939cac5aa29413a564028bc2ff15a8dc745db`.
Branch: `codex/m2a-assessment-history`.

This report is a subsequent documentation-only commit. Its eventual commit ID cannot be
embedded in itself. The final deployment API/workflow evidence is retained separately in
ignored `test-results/dep-m2a-final-verification.json`, avoiding recursive report commits.

## Release gates and preflight

- Luna PASS for the committed disabled local implementation; final QA-only follow-up reviewed.
- Quinn PASS: 36/36 tests, zero failures or runner skips. Luna reran the strengthened suite,
  strict checks, and the no-op abandonment mutation check. See QUINN_M2A_REPORT_v1.md.
- Application files are unchanged between the implementation commit and reviewed source.
- Clean working tree before publication; scoped git diff --check passed.
- All three incoming commits carry Co-Authored-By: Grok 4.6 <noreply@x.ai>.
- Changed paths were implementation, synthetic fixtures/tests, and scope/review documents.
  Scoped added-line credential pattern scan found no matches. No credential/runtime file added.
- Fresh origin fetch confirmed main at the expected prior production base, an ancestor.
- Repository rulesets returned an empty list; main protection API reported not protected.
  No force push, reset, rewrite, or protection change occurred. A PR was unnecessary.

## Deployment

Existing GitHub Pages configuration: legacy build, branch main, path /, HTTPS enforced.
Live URL: https://jt-028.github.io/grade6-reviewers/

Pushed the reviewed feature branch, then fast-forwarded remote main using normal git push.
Pages build `1309867185` reported built for exact source `f28503e73bc7f4f0f1cd166789b9946bb5fab109`,
created 2026-10-24T04:03:18Z, duration 19 seconds.

Workflow `40060810878` completed successfully for that same SHA:
https://github.com/JT-028/grade6-reviewers/actions/runs/40060810878

The report-only follow-up uses the same feature-first push and normal main fast-forward.
Final source/build/workflow status is recorded in the ignored verification artifact.

## Live BrowserOS evidence

- Opened the public hub; Quarter 2 selected by default. Switching to Quarter 1 updated #q1,
  displayed its four published module links, and hid Q2 links. Reloading the base restored Q2.
- Loaded all eight exact published reviewer URLs. Each rendered its expected subject/quarter
  and guest onboarding; all eight evaluated FAMILY_ENABLED=false and FAMILY_LOCAL_ADAPTER=null.
  Resource timing showed no observed Supabase/family-api requests on those initial views.
- Family page rendered its preparation notice. All four private actions were disabled:
  Parent sign-in, Ask parent to approve, Check approval, Unlock my profile.
  FAMILY_ENABLED=false; no observed hosted family resources.
- Math Q2 guest smoke used a synthetic ReleaseSmoke name through real UI controls:
  onboarding, Flashcards, pop quiz start, one answer, and the exit confirmation prompt.
  This is not a completed quiz or full scoring acceptance test. Original localStorage was
  retained only in tab memory and restored after the smoke; no private session was created.
- CDP mobile emulation at 390x844: hub and Math Q2 document scrollWidth equaled innerWidth=390,
  including the guest quiz flow. This is a focused mobile smoke, not an accessibility audit.
- Browser fetch of the loopback-only fixture URL on production returned HTTP 404.
  No fixture authorization route or private activation was published.
- Browser no-cache fetches returned HTTP 200 for index.html, family.html, and all eight
  reviewer HTML files. Their SHA-256 hashes match committed LF content. Git reports i/lf and
  w/crlf; initial raw working-copy hashes differed solely because checkout files use CRLF.

| Published file | SHA-256 of committed/published LF bytes |
| --- | --- |
| Geography6_Q2_Review_Module_v1.0.0.html | 4a1efe63d8876f9ebe36b5b263d9a764544b3d807c8f3d1729df9b7f527aa9ad |
| Geography6_Review_Module_v1.0.0.html | 06a6e16bb09d0ae6111a4983393690ff4f9daf90987f271aa20e21b9179878f4 |
| History6_Q2_Review_Module_v1.0.0.html | 57efaab34d6ef82f681ef9af37f232b575cc0c2ac89554e6c9b52253219e769f |
| History6_Review_Module_v1.0.0.html | 3c626d9b4a6575c8e988fd380d0b3785263d33b2aabc37f55aa4baf988ceb92a |
| Language6_Q2_Review_Module_v1.0.0.html | 931c691bdac553e3596868499d726963e9ec94cb088e6ba60794f9a0aba45502 |
| Language6_Review_Module_v1.0.0.html | b06c905ffdef2ff53a676c8706191f17dbe86f9627cd3f55482ba4439149192f |
| Math6_Q2_Review_Module_v1.0.0.html | 4d3d0c93dfbdfcbb0682ae3e4b2e6409b6d41947f143b0105df1145e5a05ffbc |
| Math6_Review_Module_v1.0.0.html | f5bd2267c5e9c393a6abd804bb3afeceb44ddb05992238867f5b36eaec7c005f |
| family.html | 768905e93d3257725ecab95b690e8db3e9a4a4d3979fea885a5a5a8b76893f51 |
| index.html | cbc6d60bccba1e5df56ef815b6ef8d18093f1db4da03515f8aa2e19cf5f37fb9 |

## Scope and limits

Published M2-A contains 64 source identities, local contracts/repository seams, encrypted
capture/history/outbox helpers in eight self-contained reviewers, and synthetic test evidence.
Public family access remains disabled. No hosted Supabase change, SQL migration, API activation,
account provisioning, private login, queue synchronization, dashboard, comparison UI, timer,
or reward feature was deployed by Dep. The loopback fixture server was not exposed.

No application code changed during deployment. Existing Pages was retained; Docker, frameworks,
new CI, observability services, and paid infrastructure were unnecessary for this static release.
The GitHub workflow is the existing Pages build/deploy, not a newly invented test/security
pipeline. Release tests are the preceding Luna/Quinn gates; no broader hosted-security claim.

## Rollback

No rollback was required. To restore prior public application behavior without rewriting history:

1. Fetch origin; inspect current main for newer changes and create a rollback feature branch.
2. Revert the report-only follow-up, then `f28503e`, `55cf53a`, and `9d8e615` newest-first.
   Inspect the resulting diff; preserve any newer unrelated work. Never reset or force-push.
3. Apply repository review/test gates to the rollback and normal-push the reviewed result to main.
4. Confirm Pages build and workflow success at the exact rollback SHA; repeat live hub/reviewer
   and disabled-family smoke. The last known good public base is `a92939c`.

The three scoped source commits can be reverted in minutes when no intervening changes exist;
GitHub Pages build time is external. No hosted database migration or account rollback is needed.

[DEP] M2-A v1.0 — 2026-10-24
Status: COMPLETE for the reviewed disabled static release.
Key outputs: Reviewed source published; Pages success and BrowserOS checks; exact-file hashes and rollback.
Blockers: None for M2-A publication. Hosted activation and later milestones remain outside scope.
Next recommended: Awaiting user.
