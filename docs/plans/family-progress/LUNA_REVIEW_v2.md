# Luna focused re-review v2.0

Date: 2026-10-23, Asia/Manila. Base is audit commit `0d9c8df`.

## Verdict

**PASS WITH CONDITIONS.** No confirmed defect remains in the reviewed repair or new test. The remaining condition is Quinn's regenerated-configuration verification below. This review does not treat the earlier runtime override as proof of the tracked repair.

Reviewed repair commit: `052f3dc9f0a76a5f1891f945794f62e034c827a6`. Audit record finalized on 2026-10-24; review performed on 2026-10-23.

This amendment supersedes the integration-condition wording in v1. Previously resolved application findings remain closed. The scope is the email-provider setting, the opt-in real-stack test, and the QA and repair reports. No clean M1 application file was changed.

## Reviewed changes

The HIGH configuration defect is repaired by setting `[auth.email] enable_signup=true` while retaining `[auth] enable_signup=false`, `enable_anonymous_sign_ins=false`, and email confirmation. These are separate settings. The observed CLI mapping disabled the email provider when both signup switches were false, preventing even manually confirmed parents from logging in.

The source now expresses the approved behavior. Whether the recreated runtime actually does so remains Quinn's test responsibility.

The new `tests/family/real_stack_test.ts` is opt-in through `FAMILY_REAL_STACK=1`. It uses reserved synthetic email addresses, runtime-generated passwords, ignored credentials, and the owned Docker database container. Before truncating fixture tables it rejects non-QA Auth accounts. Luna tightened that check to include NULL-email accounts and pinned the API to exactly `http://127.0.0.1:54321/`.

No hosted project, real user, private credential, production family flag, or later milestone was changed.

## Review and verification evidence

- Both required focused Thermos passes found no additional blocker.
- Ponytail review is Ship for the source repair and safely disabled static M1 implementation.
- Pstack boundary, idempotency, type, and behavior-test principles were applied to the test fixture and configuration contract. No architecture change or broad refactor was needed.
- The scoped new test contains no comments or suppressions. No shortcut debt was introduced. The documented deslop cleanup fallback remains applicable.
- `deno check` passed for the new real-stack test.
- A default invocation of that test reported zero failures and one ignored opt-in test. It did not read runtime secrets, run Docker commands, or mutate the test database.
- Quinn's earlier real-stack run had 17 passing tests and 21 steps under an explicitly temporary provider override. That is supporting evidence, not corrected-configuration verification.
- CRLF and staged whitespace checks passed before commit. Only the repair, QA test, and review documents were staged.

## Exact remaining condition

Quinn must recreate the owned local Auth service from the reviewed tracked configuration, without carrying the temporary provider override forward as evidence. Record the generated flags without printing credentials:

- `GOTRUE_DISABLE_SIGNUP=true`.
- `GOTRUE_EXTERNAL_EMAIL_ENABLED=true`.
- `GOTRUE_MAILER_AUTOCONFIRM=false`.

Against that runtime, a manually confirmed synthetic parent must log in successfully and public `signUp` must still fail. Rerun the affected real Auth integration check on the reviewed repair commit. Preserve or reconfirm the prior real PostgreSQL 17, pgcrypto, PostgREST, Edge, and ownership evidence when recreating services.

A real compatible local Supabase stack is sufficient for this pre-deployment condition. Hosted-only evidence is not required before the first deployment. That would make the gate circular.

When Quinn records PASS for the corrected generated configuration and affected behavior, Luna can upgrade the M1 disabled-static-release gate to **PASS** without another source change. Main coordinates that final condition signoff before Dep.

## Deployment boundary

The allowed release remains the M1 public static artifact with `FAMILY_ENABLED=false`. Scores, timers, trends, rewards, and private student recording remain later milestones. This review does not authorize private activation or claim those features exist.

After Luna PASS and Quinn PASS, the authorized Dep handoff may publish that disabled static artifact. If the authorized handoff also applies the M1 backend, owner provisioning, hosted signup/provider settings, platform secrets, and exact deployed versions require normal post-deployment smoke checks. Hosted proxy CORS headers, real cloud Auth, and hosted Edge CPU limits are deployment-time checks while access remains disabled. They are not silently waived or claimed as already measured.

The local Kong wildcard allow-origin header remains documented. Real untrusted-Origin requests returned HTTP 403 without private data, and the actual application handler emitted its exact allowlist when exercised with real Auth and database integration. Dep must check the actual hosted proxy headers after backend deployment and correct any discrepancy before private access can be enabled.

No push, deployment, hosted mutation, real-user operation, or next-agent invocation occurred in this re-review.
