# Quinn focused QA report v2.0

Date: 2026-10-24 (Asia/Manila). Scope: M1 disabled static release and corrected local Auth configuration.

## Verdict

**PASS for the scoped M1 release with `FAMILY_ENABLED=false`.** The configuration blocker in `QUINN_REPORT_v1.md` is resolved by runtime evidence from the reviewed tracked source. V1 remains a historical record; its temporary override is not the evidence for this verdict.

Tested repair commit: `052f3dc9f0a76a5f1891f945794f62e034c827a6`. Execution HEAD: `94659e41b4054c36b331be2957f43d77b15f4baa` (review-document audit). A scoped Git comparison confirmed the configuration, production function sources and real-stack test exactly match the reviewed repair commit. Inputs: `MASON_M1_REPAIR_v1.md`, `LUNA_REVIEW_v2.md`, and V1 QA evidence.

## Regenerated configuration and behavior

Quinn stopped the owned local project with Supabase CLI, then started it from the tracked `supabase/config.toml` using CLI 2.122.0. This recreated Auth; the old runtime-only provider override was not applied or carried forward. The CLI-generated database and gateway containers were rebound to loopback with the existing QA helper, preserving their injected files. Local status credentials were refreshed privately, and the actual production Edge function was served again using ignored local-only secrets.

The recreated Auth container emitted:

```text
GOTRUE_DISABLE_SIGNUP=true
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
```

The real Auth regression confirmed public `signUp` is rejected and manually confirmed synthetic parent accounts can sign in with passwords. Global signup remains disabled, anonymous sign-in remains disabled in source, and email confirmation remains required. No hosted configuration or account was changed.

The restored local database retained PostgreSQL 17.11, real pgcrypto 1.3 and the exact application schema. No crypto shim or replacement migration was used. Only owned DB and gateway ports are published, at 127.0.0.1:54322 and 127.0.0.1:54321. Other services remain internal. The unrelated pre-existing container was untouched.

## Focused regression result

**1 test / 13 real integration steps passed; 0 failed, 0 skipped.** The reviewed opt-in test retains its exact localhost-API restriction and refuses fixture reset if any Auth account has a NULL email or a non-QA email.

```powershell
$env:FAMILY_REAL_STACK = '1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-write=test-results --allow-sys --allow-run=docker --allow-net=127.0.0.1:54321 tests/family/real_stack_test.ts
```

| Verified requirement | Result |
|---|---|
| Exact schema and real randomized AES-PGP round trip | PASS |
| Confirmed parent login with closed public signup | PASS |
| Actual Edge owner/missing/forged/non-owner authorization | PASS |
| Actual REST denies browser dispatcher and private schema access | PASS |
| Concurrent duplicate creation commits once; conflicting intent returns 409 | PASS |
| Approved pairing, scoped roster and encrypted claim replay | PASS |
| Wrong/sibling PIN denial; permitted scoped session replay | PASS |
| Wrong key cannot decrypt actual receipt ciphertext | PASS |
| PIN reset invalidates racing old-PIN sessions | PASS |
| PIN cooldown returns 429 and Retry-After | PASS |
| Expired session/pair denial and safe metadata cleanup | PASS |
| Revocation denies stored credentials and retains recovery record | PASS |
| Actual HTTP untrusted-Origin denial; exact application allowlist | PASS |

The first attempt immediately after DB container recreation reached Auth with a stale database connection: fixture creation returned HTTP 500, and GoTrue recorded SQLSTATE 57P01, connection terminated by administrator command. Dependent checks correctly stopped. Once the restart settled, the full focused test passed without a source change, runtime override or assertion change. This was a local startup transient, not a reproduced application defect.

Safe final result log: `test-results/qa-v2-real-stack-test-final.log`. Nonsecret generated flags: `test-results/qa-v2-auth-flags.txt`. Raw startup/Auth/status files and all local credential files remain ignored and must not be committed.

## Inherited evidence and limits

The unchanged baseline suite and public BrowserOS checks from V1 remain applicable: 16 baseline tests with 8 PGlite steps; disabled controls and hidden private panels; 390px viewport without overflow; Q1/Q2 hub isolation and family navigation. They were not rerun for this single configuration repair. The focused rerun above supplements them with the corrected-source real provider path.

Previously measured host-process coverage remains 66.2% lines / 78.5% branches. Module lines/branches: auth.ts 73.8%/73.3%, crypto.ts 91.0%/81.8%, index.ts 54.5%/78.7%, validation.ts 75.6%/79.3%. Auth, index and validation remain below the 80% reporting threshold. This is a known risk area, not a hard failure. These figures do not instrument the separate Edge worker, SQL or browser JavaScript; no new coverage claim is made for this focused run.

The local Kong proxy still adds wildcard allow-origin headers; the real HTTP request from an untrusted Origin is denied with 403 and no private data. The exact application handler allowlist is independently checked with real Auth/database access. Hosted proxy behavior, actual cloud Auth and hosted Edge CPU limits have not been measured. Luna v2 explicitly scopes those as post-deployment smoke checks while private access remains disabled.

## Notes for Dep

- Obtain Luna's final condition signoff and local audit commit before publication; this report does not substitute for the separate Luna gate.
- Publish only the accepted M1 static artifact with `FAMILY_ENABLED=false`. Grade trends, study timers and rewards remain M2-M5; this is not a release of those features.
- Hosted backend setup, parent provisioning, signup/provider settings and platform secrets remain separate deployment work under `M1_SETUP.md`. Verify actual deployed versions, Auth behavior, proxy headers and Edge operation after any authorized backend deployment, before private access can be enabled. Do not place credentials in Git or chat.
- The owned local stack remains available with loopback bindings. No production source edit, remote write, commit, push, deployment or next-agent invocation occurred during this focused QA pass.

[QUINN] v2.0 — 2026-10-24

Status: COMPLETE / PASS for disabled M1 static release. Corrected tracked configuration regenerated; all three Auth flags and thirteen real integration steps passed. No unresolved QA blocker in this scope. Next recommended: Luna condition signoff, then authorized Dep handoff.
