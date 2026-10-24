# Quinn M1 activation test report v1

Date: 2026-10-24, Asia/Manila.
Status: PASS for the scoped M1 activation; no code defects found.
Tested HEAD: `6e4a41e2dbbd4a4461af4e61a40562eb3beccb51`.
Application commit: `d589f11d9c429e16dbfc167e8f7584950df55102`.

## Scope and traceability

Inputs: repo AGENTS, agent-squad/Quinn and BrowserOS skills; Mason M1 activation
report, Luna activation review, Alex v3 immediate M1 packet, M1 setup and Dep
hosted preparation v2. The tested HEAD adds only Luna's two audit documents to the
application commit. Worktree was clean at test start. No application edits,
commits, hosted mutations, password requests or deployment were performed.
Future M2 statistics/report-card/JPEG acceptance criteria are planning scope and
are not certified or used as M1 release prerequisites.

The immediate M1 deliverable maps to production init and fail-closed VM tests,
actual-browser entry/error/guest checks, existing database access lifecycle tests,
and prior hosted evidence. Reviewer isolation maps to the all-eight source check
and the existing inactive-capture/catalog regression tests. Truthful availability
maps to actual visible browser text in anonymous desktop and mobile entry.

## Independent automated results

Command:
`npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys --coverage=C:/Users/jdtig/AppData/Local/Temp/quinn-m1-activation-coverage tests/family`

Result: **40 passing tests, eight passing PostgreSQL steps, zero failures,
one ignored opt-in real local Supabase-stack test**. The ignored test is not an
integration pass. Test groups: API/auth 11; actual-script lifecycle VM 8;
embedded PostgreSQL 1 (eight steps); reviewer VM 12; local contract 8.

- Production initialization enables controls with zero anonymous requests.
- Disabled/invalid configuration keeps controls and requests closed.
- Sign-out/lock defeats delayed family, refresh and unlock responses; durable
  access epoch and unknown-outcome idempotent retries pass.
- Embedded PostgreSQL verifies denied direct table/RPC access, owner boundary,
  profile create/replay/conflict, pair/claim, scoped child session, PIN cooldown,
  device revocation and expired-pair pruning. Existing portable crypto shims apply.
- All eight reviewer catalogs, inactive capture, finalizer wiring, encryption,
  stale access invalidation and local fixture contracts pass. These tests do not
  assert that hosted M2 exists.

`npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts`: PASS.
`git diff --check`: PASS.
All eight published reviewers still contain `FAMILY_ENABLED = false` and
`FAMILY_LOCAL_ADAPTER = null`; the activation baseline diff changes none of them
or the hub. Production family script retains the HTTPS Supabase/publishable-key
readiness guard and contains no local fixture bypass or public test toggle.

## Independent actual-browser results

BrowserOS neo owned pages 42-44; real family HTML served unchanged by the existing
loopback fixture server. No real credentials or private data entered. These are
10 scoped scenario groups, all PASS; separate from the 40 automated tests:

1. Real family entry: fallback hidden, all four private buttons enabled; no local
   fixture marker. No Supabase resource requests before entry.
2. Persistent scope notice says study history/statistics are unavailable and
   results/time are not saved to family profiles. Hidden child-panel copy agrees.
3. Real desktop entry fits without horizontal overflow.
4. Real mobile emulation at 375 x 812: single 343px grid column, visible notice,
   no horizontal overflow, still zero Supabase resource requests. This is a
   browser viewport check, not physical-device certification.
5. Visibly labeled synthetic fixture: injected local-only Auth rejection,
   submitted with keyboard Enter. Exact error displayed with error styling and
   polite live status; parent panel stays hidden, sign-in remains enabled and
   password field retains focus. Zero cloud requests.
6. Fixture reload removes injection. Synthetic credentials submitted with Enter
   successfully show parent management. No hosted Auth call occurs.
7. Keyboard sign-out restores entry and hides management. Actual parent/child
   session-storage keys are absent after cleanup (presence check only).
8. Synthetic device pairing shows pending code; keyboard Cancel restores the
   request form and hides pending UI. No approval or device credential issued.
9. Guest hub defaults to Q2 with its four original Q2 module links.
10. Guest `#q1` selects Q1 with its four original Q1 module links.

Cleanup: synthetic parent signed out, pairing canceled, fixture tab closed;
real family tab retained and device emulation cleared. Synthetic unapproved pair
metadata exists only in the running fixture's memory and its local expiry policy.
No new child/device/hosted records were created. The existing server remains for
handoff. Two tooling errors (incorrect SDK action method and CDP parameter shape)
were corrected; subsequent explicit checks supplied results above. They were not
application failures.

## Coverage and evidence limits

Deno coverage output (line / branch):

| Module | Line % | Branch % |
| --- | ---: | ---: |
| family-api/auth.ts | 21.3 | 100.0 |
| family-api/crypto.ts | 91.0 | 83.3 |
| family-api/index.ts | 54.5 | 78.1 |
| family-api/m2-contract.ts | 91.3 | 92.7 |
| family-api/validation.ts | 75.6 | 80.0 |
| test m2_browser_fixture.ts | 73.2 | 66.7 |
| test m2_catalog_inventory.ts | 96.6 | 83.3 |
| test m2_fixture_repository.ts | 83.2 | 90.2 |
| All measured files | 73.4 | 85.1 |

Below-80% line coverage is advisory for auth.ts, index.ts, validation.ts and the
fixture server module. These percentages describe instrumented TypeScript only;
inline HTML scripts executed through VM are not assigned meaningful per-source
line/branch percentages. No invented full UI coverage percentage is claimed.
Production Auth/network and server startup paths are not fully exercised by this
portable suite; the scope is a small activation of previously prepared M1.

Prior, separately attributed evidence: Mason's report covers complete synthetic
create-profile/PIN/pair/approve/unlock/lock flow; Quinn did not independently repeat
that entire browser flow. The independently repeated embedded database steps and
VM races cover its access contracts. `DEP_HOSTED_M1_PREPARATION_v2.md` records 51
hosted operational assertions, confirmed owner binding, closed Auth and cleanup.
Quinn did not repeat hosted backend checks or real password sign-in. This report
neither turns those prior checks into fresh Quinn results nor claims real-stack
integration passed. Existing Retry-After browser-header advisory and unavailable
CPU telemetry remain as documented; no capacity claim is made.

## Notes for Dep

Quinn PASS applies to tested HEAD above, whose application bytes match Luna's
reviewed local code commit. This new report is documentation only and may be
included by the authorized local documentation commit route; no application retest
is needed for its text alone. Any subsequent application/config/backend change
requires relevant review and test gates. Publish M1 access only; keep all eight
reviewer flags false/null and preserve truthful unavailable-history notices.
Use existing hosted preparation and confirmed owner state; no new credentials or
accounts are required. Follow already authorized publication after committed Luna
PASS and this Quinn PASS. Quinn performed no push and invoked no next agent.

[QUINN] v1.0 — 2026-10-24
Status: COMPLETE
Key outputs: exact-SHA 40-test/eight-step PASS; actual-browser activation,
keyboard/error/mobile/guest PASS; measured coverage and evidence limits recorded.
Blockers: none for scoped M1 activation.
Next recommended: authorized Dep publication through main.
