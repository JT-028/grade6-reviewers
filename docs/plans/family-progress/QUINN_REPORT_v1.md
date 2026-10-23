# Quinn QA report v1.0

Date: 2026-10-23 (Asia/Manila). Scope: M1 family-access foundation only.

## Verdict

**BLOCKED on one confirmed local configuration defect.** Do not deploy from this report alone.

Reviewed application code is `013391bb31e15f8a17103d23ab51dde806d4ec64`; its audit head is `0d9c8df`. Quinn changed no production source or hosted setting. The added opt-in test is `tests/family/real_stack_test.ts`.

The original configuration cannot log in manually confirmed parents. After an explicitly temporary change to the owned local Auth container, the combined suite passed **17 tests and 21 steps, zero failures or skips**. Eight steps use the existing PGlite fixture; thirteen use real PostgreSQL/pgcrypto, GoTrue, PostgREST and Supabase Edge HTTP. That successful override run does not make the tracked configuration pass.

## Finding requiring a tracked fix

**HIGH — Local email authentication is disabled alongside public registration.**

- Source: `supabase/config.toml:20`, `[auth.email] enable_signup = false`.
- Actual generated environment: `GOTRUE_DISABLE_SIGNUP=true`, `GOTRUE_EXTERNAL_EMAIL_ENABLED=false`, `GOTRUE_MAILER_AUTOCONFIRM=false`.
- Failing test: real-stack step “real local Auth has no public signup and permits manually confirmed test parents”. Manual admin creation succeeds, but password login returns **HTTP 422 / `email_provider_disabled`**.
- Expected: a manually confirmed owner can sign in, while untrusted visitors cannot register.
- Recommended correction: keep `[auth] enable_signup = false` and anonymous sign-in disabled; set `[auth.email] enable_signup = true` and retain email confirmations. A runtime-only override of the provider flag proved this combination supports password login while a real `signUp` call remains rejected.
- Required recheck: restart/recreate the local Auth service from the corrected tracked configuration, verify the generated provider and global-signup flags, then rerun the affected Auth/integration checks against the new reviewed commit. Quinn did not apply this source change.

The official [CLI configuration reference](https://supabase.com/docs/guides/local-development/cli/config) distinguishes the global signup switch from email settings and requires restarting local services after configuration changes. The provider-disabled behavior above is directly observed with CLI 2.122.0 and its generated GoTrue configuration; the similarly named options must not be assumed equivalent.

## Real environment and evidence

Docker's Linux engine became available during this QA handoff. The owned local project is `grade6-reviewers-family`; no hosted project was used. Runtime images include PostgreSQL `17.11.0.006`, Edge `v1.77.8`, GoTrue and PostgREST selected by Supabase CLI 2.122.0. The installed real pgcrypto extension is version 1.3.

Only the owned DB and gateway publish host ports, at **127.0.0.1:54322** and **127.0.0.1:54321**. Other services remain on the private Docker network. The CLI initially published wildcard host bindings; the QA containers were recreated with loopback bindings and their CLI-injected files retained. This was test infrastructure work, not an application or hosted configuration edit.

An early interrupted local bootstrap was restored without application tables. Quinn explicitly applied the exact unchanged migration through local PostgreSQL; it completed successfully. Local CLI status was refreshed after container recreation. The production Edge entrypoint then returned HTTP 200 through the actual Edge runtime.

Real synthetic users were created through the local Auth admin API and confirmed without email delivery. Passwords and local service credentials stay in runtime memory or ignored `test-results`/Supabase development state. No real parent or child account was created, no hosted SQL/function was deployed, and no privileged value was added to Git.

### Thirteen real integration steps

1. Exact application schema exists; actual pgcrypto AES-PGP encrypts, randomizes and decrypts.
2. Public signup is rejected; manually confirmed synthetic parents can sign in after the temporary provider override.
3. Actual Edge HTTP accepts the owner and rejects missing, forged and valid non-owner Auth credentials.
4. Actual PostgREST denies browser dispatcher access and a non-exposed private schema, including for a valid parent JWT.
5. Concurrent duplicate profile creation returns one committed child; reuse for conflicting work returns 409.
6. Pairing requires its secret, stays pending before approval, limits the roster and replays an actual encrypted claim.
7. Wrong/sibling PIN access fails; a permitted child unlocks and replays one scoped session. Stored ciphertext contains no plaintext credential.
8. The wrong key cannot decrypt a real pgcrypto claim.
9. A PIN reset racing an old-PIN unlock leaves every old session unusable afterward.
10. Five wrong attempts exhaust the reserved PIN budget; the next request returns 429 with Retry-After.
11. Expired sessions and pairs are rejected; aged pairing metadata is pruned without removing profiles.
12. Revocation rejects stored device credentials while retaining the recovery-key record.
13. The production origin works, an untrusted Origin receives a real HTTP 403 without private data, and the actual handler emits its exact origin allowlist.

The local Kong proxy changes the HTTP `Access-Control-Allow-Origin` header to `*`. This is recorded separately from the application contract. An untrusted Origin still receives `ORIGIN_NOT_ALLOWED` over real Edge HTTP. A direct invocation of the actual handler, using the real SDK/Auth/DB repository, also confirms the exact production-origin header and the absence of an allow-origin header for an untrusted origin. No assertion was weakened to treat CORS as authentication. Hosted proxy headers remain a post-deployment smoke check.

### Automated commands and results

The baseline reviewed suite independently passed: **16 tests / 8 steps**.

The real local stack needs an ignored `test-results/qa-local-status.json` from local CLI status and `test-results/qa-functions.env` containing generated local-only pepper/claim keys. Never point these tests at the hosted project. The test rejects a non-loopback API and refuses to reset a local DB containing non-QA users.

```powershell
$env:FAMILY_REAL_STACK = '1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-write=test-results --allow-sys --allow-run=docker --allow-net=127.0.0.1:54321 --coverage=test-results/qa-coverage-real tests/family
```

Combined result under the documented local Auth override: **17 passed / 21 steps / 0 failed / 0 skipped**. Strict checking of the new test also passed. Safe result logs are `test-results/qa-all-test.log` and `test-results/qa-real-stack-test.log`; runtime credential files and raw startup logs must remain ignored and uncommitted.

### Instrumented coverage

| Module | Lines | Branches |
|---|---:|---:|
| auth.ts | 73.8% | 73.3% |
| crypto.ts | 91.0% | 81.8% |
| index.ts | 54.5% | 78.7% |
| validation.ts | 75.6% | 79.3% |
| Total | **66.2%** | **78.5%** |

`auth.ts`, `index.ts` and `validation.ts` are below the 80% reporting threshold. This is not a standalone failure. Coverage measures the host Deno process, not the separately running Edge worker, SQL or browser JavaScript. The real HTTP matrix exercises additional routes in that worker without inflating these percentages. Remaining SDK outage/timeout branches warrant future targeted tests; no coverage-only refactor is requested.

## Acceptance and definition-of-done matrix

| M1 criterion | Evidence | Current status |
|---|---|---|
| 1.1 Private service configuration | Exact real migration, crypto, scoped function HTTP and loopback stack | BLOCK: tracked provider switch disables parent login |
| 1.2 Parent identity and ownership | Real Auth owner/non-owner/forged-token checks, browser RPC denial | Pass under explicit override; requires corrected-config rerun |
| 1.3 Approved devices and child PIN | Actual pair/claim, roster scope, wrong PIN, cooldown, expiry, replay and reset race | PASS for tested local runtime |
| 1.4 Private boundary | Real REST denial, service-only SQL, scoped child session, reset/revoke, encrypted receipts | PASS for tested local runtime |
| 1.5 Public reviewer access | Independent BrowserOS disabled-page and quarter-navigation checks | PASS |
| Luna fixes | Reviewed sixteen-test suite plus real concurrency/replay/ciphertext tests | PASS for covered code |
| M2–M5 scores/time/rewards | Explicitly outside M1; no fake data displayed | Not implemented; not a QA failure in this handoff |

## Independent BrowserOS evidence

The old preview process was unavailable in this tool session, so Quinn started the existing local fixture server on 127.0.0.1:8766 and used an owned BrowserOS tab. The normal `family.html` retained its real disabled flag. Parent sign-in, pairing request, approval check and child unlock were all disabled; parent and child private panels were hidden. At a real 390px viewport, document width was 390px with no horizontal overflow.

The hub opened with only the four Q2 reviewers visible. Switching to Quarter 1 produced `#q1` and only Q1 filenames; switching back produced `#q2` and only Q2 filenames. The family link and return-to-guides navigation worked. These browser checks did not use the hosted project. Luna's prior delayed-response BrowserOS evidence is supplemented by independently rerun actual-source lifecycle regressions, not misreported as a new hosted browser E2E run.

## Remaining gates and notes for Dep

1. Apply the minimal tracked email-provider correction through the authorized builder/reviewer, then obtain Luna's review/commit for the QA test and config change.
2. Quinn must verify the corrected generated configuration and affected real Auth path on that reviewed commit. The current report is BLOCKED until then.
3. Real local Postgres/pgcrypto/Auth/Edge paths now have concrete evidence. No hosted CPU limit or hosted proxy behavior was measured. Those are deployment-time smoke checks while family access stays disabled, not a claim that the hosted service is already verified.
4. Owner provisioning, public-signup settings, platform secrets and hosted backend application remain pending. Follow `M1_SETUP.md` only after actual Luna PASS and Quinn PASS. Keep credentials outside Git. Hosted changes need post-deployment verification before any private access is enabled.
5. `FAMILY_ENABLED=false` must remain in the static public artifact until the later required milestones are complete. A disabled static M1 release can be assessed after the config fix and gate reconciliation; this report does not independently authorize it or waive Luna's conditions.

Owned local containers and the fixture server remain available for the required repair/retest. No push, deployment, remote account creation or next-agent invocation occurred.

## Compressed handoff

[QUINN] v1.0 — 2026-10-23

Status: BLOCKED on one configuration defect; real local integration evidence complete under an explicit runtime override.

Key outputs: opt-in real-stack test; seventeen passing tests/twenty-one steps under override; real crypto/Auth/Edge and independent public BrowserOS evidence.

Blocker: `auth.email.enable_signup=false` disables existing-parent email login. Correct and review the source setting, then rerun the affected configuration/Auth path.

Next recommended: minimal authorized repair, Luna review/commit, then Quinn's relevant final verification. Dep only after both gates are actual PASS.
