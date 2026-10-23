# Mason M1 QA repair v1.0

Date: 2026-10-23 (Asia/Manila).

Status: COMPLETE source repair; corrected-runtime verification remains with Luna/Quinn.

## Confirmed defect

Quinn's real local Supabase test could create a manually confirmed parent, but
password sign-in returned HTTP 422 / `email_provider_disabled`. CLI 2.122.0 mapped
`[auth.email] enable_signup = false` to `GOTRUE_EXTERNAL_EMAIL_ENABLED=false`.
The global `[auth] enable_signup = false` already blocks public registration.

## Exact repair

Changed only `[auth.email] enable_signup` to `true` in `supabase/config.toml`.
Kept global signup disabled, anonymous sign-in disabled and email confirmations
enabled. This preserves the approved design: confirmed parent email/password
authentication works, while public account registration remains unavailable.

No application feature, production family flag, credential, cloud setting or
running container was changed. Quinn's untracked test and report were preserved.

## Verification and handoff

- Inspected the diff: exactly one configuration value changed.
- Confirmed global `auth.enable_signup=false`, anonymous sign-in disabled and
  `auth.email.enable_confirmations=true` remain present.
- CRLF preserved; `git diff --check` passes.
- Did not rerun unrelated suites or treat Quinn's earlier runtime override as
  verification of this source repair. No runtime provider override was applied here.

Luna should review/commit this repair with the QA artifacts. Quinn must regenerate
the owned local Auth configuration from the corrected source, verify the generated
provider/global-signup flags, and rerun the existing behavioral Auth regression:
manually confirmed parent password login succeeds and untrusted signup fails.

Reference: `QUINN_REPORT_v1.md`. No commit, push, deployment or next-agent invocation
was performed by this repair handoff.
