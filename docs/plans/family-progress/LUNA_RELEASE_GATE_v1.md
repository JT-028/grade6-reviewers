# Luna release gate v1.0

Date: 2026-10-24, Asia/Manila.

**PASS for the public static M1 release with `FAMILY_ENABLED=false`.** This closes the corrected-configuration condition in `LUNA_REVIEW_v2.md` and supersedes the earlier conditional verdict only for this release scope. Historical reports remain unchanged.

Tested code: `052f3dc9f0a76a5f1891f945794f62e034c827a6`. Quinn execution HEAD: `94659e41b4054c36b331be2957f43d77b15f4baa`, which adds only the prior review document. Luna verified no non-document changes since the tested code and confirmed the production family flag remains false.

`QUINN_REPORT_v2.md` records recreation of local Auth from tracked configuration without the temporary provider override. The generated flags are `GOTRUE_DISABLE_SIGNUP=true`, `GOTRUE_EXTERNAL_EMAIL_ENABLED=true`, and `GOTRUE_MAILER_AUTOCONFIRM=false`. A confirmed synthetic parent can log in; public signup is denied. The real PostgreSQL 17.11, pgcrypto 1.3, Auth, REST and Edge integration passed one test with thirteen steps, zero failures and zero skips. Luna checked the safe generated-flags artifact and final result log against the report. The immediately-after-restart database connection transient settled before the unchanged successful rerun.

These results satisfy the remaining pre-deployment condition. A compatible real local stack supplies the required integration evidence. The inherited baseline and BrowserOS evidence remains as documented; this signoff adds no new coverage claim or source change.

Luna PASS and Quinn PASS now permit the authorized Dep handoff for the disabled static artifact. Hosted backend provisioning, cloud Auth, proxy headers and hosted Edge CPU behavior remain separate setup and deployment smoke checks; they have not been verified here. Private activation remains blocked until its required setup, checks and later milestones are complete. Scores, trends, timers and rewards are not part of this M1 release.

No push, deployment, hosted mutation, credential publication or next-agent invocation occurred during this signoff. Runtime credentials and logs remain ignored under `test-results/`.
