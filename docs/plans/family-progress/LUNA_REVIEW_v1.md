# Luna review v1.0

Date: 2026-10-23, Asia/Manila.

Inputs: Aria blueprint v1 and Mason M1 report v1. Scope is the local M1 family-access change.

## Verdict

**PASS WITH CONDITIONS.** Ready for Quinn to verify the reviewed local implementation. Not ready for deployment.

The review found two HIGH defects, one MED defect, and one LOW defect. All four are fixed. No confirmed correctness or security finding remains open in the reviewed code. Real pgcrypto, hosted Supabase Auth, and hosted Edge behavior remain unverified. The production family flag stays false.

Reviewed code commit: `013391bb31e15f8a17103d23ab51dde806d4ec64` on `codex/family-access-m1`.

The audit report is recorded in the following documentation-only commit. No application source changed after the reviewed code commit.

## Resolved findings

1. **HIGH. Persisted replay digests bypassed PIN hashing.** `supabase/functions/family-api/index.ts` hashed request bodies with plain SHA-256, including six-digit PINs. A database reader could guess PINs against those fast hashes despite the separate PBKDF2 verifier. The handler now uses `mutationDigest`, a domain-separated HMAC-SHA256 keyed with the backend-only pepper. The new regression failed against the old digest and passes with the fix. The request digest remains stable for replay but cannot be recreated from the public body alone.

2. **HIGH. Late responses restored locked private state.** `family.html` accepted pending family, refresh, and unlock responses after sign-out or a cross-tab lock. The request boundary now captures the access generation and rejects a result if access changed while awaiting it. Locking increments that generation. Delayed family and refresh regressions failed before the fix. They now pass, along with a child-unlock cancellation check. BrowserOS also verified a delayed family response after a real BroadcastChannel lock. The parent panel stayed hidden, private rows stayed empty, and no parent session remained stored.

3. **MED. Retrying uncertain mutations created new operations.** `family.html` generated another mutation ID after a committed response was lost. Repeating Create profile could create a duplicate. Pending request identities now remain in memory until a definitive result, changed intent, or access reset. PINs are not persisted. Pair creation also retains its request UUID, polling secret, and mutation ID while retrying the same intent. BrowserOS reproduced different pairing IDs before that fix and matching request and mutation IDs afterward. The automated unknown-outcome regression also failed before the fix and passes now.

4. **LOW. Expired pairing records accumulated.** The SQL cleanup cleared expired claim ciphertext but retained pairing hashes and labels indefinitely. It now deletes pairing metadata more than 24 hours past expiry, matching the receipt retention window. Recent expired requests still return HTTP 410. The database regression confirms pruning retains family profiles and historical device keys.

The review also removed a redundant membership UPDATE. The existing composite foreign keys already require those membership rows to belong to the selected device's family. Retaining the rows preserves their cache keys without writing the same family ID again.

Corrected-code references:

- `supabase/functions/family-api/index.ts:109` and `crypto.ts:21` implement keyed mutation fingerprints.
- `family.html:649` invalidates older access, and `family.html:674` guards request continuations.
- `family.html:690` retains pending mutation identity. `family.html:1004` retains pairing intent across uncertain responses.
- `supabase/migrations/202610230001_family_access.sql:158` bounds expired pairing retention.

## Verification

Commands run against the corrected code:

```powershell
npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family
```

Results:

- Strict TypeScript check passed.
- **16 tests passed, including 8 embedded PostgreSQL steps. Zero failures.**
- Four initial focused checks failed for the intended defects before production edits. The preserved tests cover PIN-digest secrecy, stale family rendering, stale parent refresh, and retry identity.
- BrowserOS verified the corrected BroadcastChannel lock and lost-response pairing flows in the running synthetic local page. These checks made no Supabase requests.
- The original reviewer changes remain one footer link per module. Lesson content, scoring, guest progress, published filenames, and quarter separation remain unchanged.
- CRLF and staged whitespace checks passed before commit.

The browser lifecycle tests execute the actual inline production functions in a small DOM fixture. They supplement the running BrowserOS checks. They do not claim a real browser, network, or authentication provider in the automated fixture.

## Blueprint and checklist

M1 parent identity comes from verified Supabase Auth. The SQL owner allowlist, private schema, revoked browser privileges, scoped credentials, pairing expiry, PIN reservation, revocation, and receipt handling remain consistent with the approved design. The supplied public project configuration is intentional. No privileged credential or real user record was added.

The existing Tokyo project is retained. No extra project, feature, framework, browser JavaScript dependency, or later analytics milestone was added. Future study history, synchronization queues, timers, trends, and rewards remain outside M1.

M1 local implementation criteria are met. Live configuration and integration criteria remain pending as recorded in `M1_SETUP.md`.

## Required review gate

- Ponytail review verdict is **Ship for the disabled local M1 implementation**. No unresolved Must fix item remains.
- Both independent Thermos passes ran. Their findings and dispositions are recorded in `reviews/PLUGIN_GATE_v1.md`.
- No-comments ran through its required independent reviewer. It proposed 17 comment-line deletions and one redundant write removal. The accepted changes were applied. The external PGlite limitation and public API contract comments remain.
- No shortcut or ponytail debt marker was found in the scoped change.
- Pstack principles led to a request-boundary fix rather than per-form patches, keyed credential-sensitive fingerprints, retained operation identities, and behavior regressions that fail on the original defects.
- The separate cursor-team-kit deslop plugin is absent. Pstack's own `docs/guide/05-build-and-clean.md` explicitly permits a plain-language cleanup fallback. That outcome was applied to narration, the redundant write, and unrelated-edit checks. No missing plugin was claimed to have run.

## Conditions and notes for Quinn

PGlite still uses isolated test-only replacements for unavailable pgcrypto functions. Its authorization and transaction checks do not prove production encryption, real Supabase Auth, hosted HTTP behavior, or Edge CPU limits. Quinn must verify those with a real compatible PostgreSQL/Supabase test environment before the gate can become unconditional PASS.

Verify the real receipt encryption and replay, HMAC stability, expired pairing cleanup, owner versus non-owner Auth accounts, revoked and expired sessions, concurrent PIN resets, and delayed browser responses. Check unknown-outcome retry behavior, including pairing and parent changes. Keep any test credentials outside Git.

The confirmed parent is not provisioned, public signup is still enabled on the hosted project, and backend secrets and code have not been applied. Those are setup and release prerequisites, not changes made by this review.

No push, preview deployment, live migration, account creation, hosted configuration change, or next squad handoff occurred. Next recommended is Quinn after user go-ahead. Dep remains blocked until Luna is PASS, the reviewed commit is present, and Quinn is PASS.
