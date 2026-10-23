# Dep deployment report v1.0

Date: 2026-10-24, Asia/Manila.
Status: COMPLETE for public static M1 publication with `FAMILY_ENABLED=false`.

## Release and gates

Live site: https://jt-028.github.io/grade6-reviewers/
Repository: JT-028/grade6-reviewers. Existing GitHub Pages legacy deployment from `main`, repository root `/`.

- Baseline main before release: `03836c8495032980661de86fb91dcd72997f1dcf`.
- Tested application code: `052f3dc9f0a76a5f1891f945794f62e034c827a6`.
- Reviewed release source pushed and deployed: `994ab6b85a278daa8a22048836c3fc4a44fb5835`.
- Luna PASS: `LUNA_RELEASE_GATE_v1.md`, recorded in `994ab6b85a278daa8a22048836c3fc4a44fb5835`.
- Quinn PASS: `QUINN_REPORT_v2.md`, recorded in the same audit commit; execution HEAD `94659e41b4054c36b331be2957f43d77b15f4baa`.

Both gates explicitly approve only this disabled public artifact. Dep verified that all differences between the tested code and release source are review/QA documents, that the family flag remains false, and that each incoming AI commit carries the required Grok coauthor. No additional application changes or broad retesting were needed.

## Publication evidence

Fresh authenticated GitHub API checks confirmed remote main still matched the baseline, was unprotected, and retained the established Pages source. `git fetch origin main` confirmed main was an ancestor of the reviewed feature history. Dep switched to main, fast-forwarded from `codex/family-access-m1`, and pushed main normally. No merge commit, history rewrite, or force push was used.

GitHub Pages build **1308791023** reported `built`, with no error, for the exact release SHA `994ab6b85a278daa8a22048836c3fc4a44fb5835`. Created `2026-10-23T17:37:26Z`, updated `2026-10-23T17:37:48Z`.

Workflow **39996591400** (`pages build and deployment`) completed with conclusion `success` for that same SHA. Its build, deploy, and report-build-status jobs succeeded.

- Build API: https://api.github.com/repos/JT-028/grade6-reviewers/pages/builds/1308791023
- Workflow: https://github.com/JT-028/grade6-reviewers/actions/runs/39996591400

This report is the sole documentation-only release follow-up. Its containing commit is the final audit publication, identifiable with `git log -1 --format=%H -- docs/plans/family-progress/DEP_REPORT_v1.md`. The final audit SHA and its successful Pages build are returned in the deployment handoff and stored in the ignored local `test-results/family/DEP_FINAL_VERIFICATION_v1.md`; the source-build evidence above must not be confused with that later documentation build.

## BrowserOS neo live verification

After the successful source build, Dep used an owned BrowserOS neo session and live production pages, preserving other sessions.

- Fresh hub without a hash selected Quarter 2. Switching to Quarter 1 selected it and set `#q1`.
- Q2 links retained the four `*_Q2_Review_Module_v1.0.0.html` filenames; Q1 retained the corresponding four `*_Review_Module_v1.0.0.html` filenames.
- All eight live module URLs returned HTTP 200, had titles matching their quarter and subject, and contained exactly one `family.html` link. The hub also had one family link. No reviewer filename was changed.
- Clicking the hub family link loaded the live family page. It displayed “Family access is being prepared” and “Private sign-in is not available yet.” No student statistics were displayed or claimed.
- Parent sign-in, Ask parent to approve, Check approval, and Unlock my profile all had `disabled=true`.
- The family page resource timeline contained zero Supabase or family API requests while disabled.
- At a 390 x 844 mobile viewport, family page document width was 390px and horizontal overflow was false. Desktop metrics were restored afterward.
- Useful live hub and family tabs were left open. No credentials were entered, guest progress was not modified, and no private record was accessed.

## Exact scope and deferred work

Published: static family access foundation and navigation; reviewed local backend/configuration/test scaffolding. Existing reviewers remain available with browser-local progress.

Private access stays disabled. Hosted Supabase users, settings, schema, functions, and secrets were untouched. No hosted migration or function deployment was performed, and no secret or runtime artifact was committed. Hosted Auth/proxy/Edge CPU smoke checks remain future backend setup work.

M2-M5 subject scores, side-by-side trends, percentage changes, history/sync, active study timers, and rewards are not implemented by this release. The live foundation must not be presented as those completed features.

## Rollback

There is no database rollback because this release made no hosted backend changes. To restore the prior public static tree without rewriting history, first fetch main and confirm the working tree is clean. Create a rollback branch from current remote main; restore tracked files to the recorded baseline and remove files added after it using explicit reviewed paths. Review the resulting diff before committing with a conventional message and the required Grok coauthor. Publish that ordinary revert commit to main through the repository's current merge rules, then require a successful Pages build for its exact SHA and repeat the live hub check.

For this unchanged release history, a direct full release revert can instead use `git revert --no-commit 03836c8495032980661de86fb91dcd72997f1dcf..HEAD` after verifying HEAD is the final audit publication and no later work has landed. Resolve any unexpected conflict by stopping and reviewing; never reset or force push shared main. Commit the revert only after checking the complete diff. The historical reports remain available in Git history.
