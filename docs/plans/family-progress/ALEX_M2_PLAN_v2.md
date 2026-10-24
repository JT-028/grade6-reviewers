# ALEX PLAN AMENDMENT — v2.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Input: REX_M2_REQUIREMENTS_v1 plus REX_M2_REQUIREMENTS_v2
Baseline: ALEX_M2_PLAN_v1 (preserved)
Scope: M2 learning statistics and progress trends; planning amendment only
Status: COMPLETE — READY FOR ARCHITECTURE

## Precedence and changes

Apply only the replacements, additions, and dependency overlays below to v1; other tasks and constraints remain in force. This plan does not authorize execution of later seats. The repository's one-specialist-at-a-time routing and user go-ahead after handoffs override the broader squad playbook.

V1 task 1.2 already specifies one record **per eligible attempt**, so it does not require lifetime-first-only storage. However, its “first-attempt” and “later retries” wording is ambiguous. Throughout the effective M2 plan, read this as **an immutable first-answer baseline for every distinct finalized eligible attempt**. An independently started retake is a new attempt; replaying the same attempt is delivery, and corrections/practice are separate activity. Retakes remain in history and may supply later comparisons. No new completion or timeout behavior is introduced.

The full comparison scope adds content/scoring revision to child, quarter, subject, module, type, and existing set identity. Learning order uses reliable completion time then stable attempt identity, never receipt order. Unknown chronology has no directional trend.

## Resolved defaults (replace v1 Blocked Items)

There are no blocking product questions. Arbitrary manually selected pairs remain out of scope. Rex v2 settles precision, state thresholds, and zero-baseline behavior.

Use the existing current-quarter context as the initial selected quarter; preserve the hub's Q2 default and an explicit reviewer/quarter selection rather than inventing a calendar-to-school-quarter mapping. If the current quarter has no eligible data, keep it selected and show the quarter and subject empty states. Offer the existing planned quarter selector so the viewer can explicitly choose another quarter; never silently select another quarter, blend quarters, or borrow its results as baselines. With no results anywhere, the same empty state applies. An explicit quarter selection remains explicit when the selected child changes; data availability never silently changes that selection. Aria must identify the existing source of quarter context in the handoff contract.

Use raw fractions for calculations: percentage = `100 * correct / total`; percentage-point change = latest percentage minus prior percentage; relative change = `100 * (latest percentage - prior percentage) / prior percentage`. Display percentages and percentage-point deltas to two decimals and relative changes to one decimal. Preserve each reviewer's existing grade mapping and grade rounding from the baseline correct/total.

Equal displayed percentages produce Unchanged and zero displayed deltas; an actual zero prior score always makes relative change unavailable, including zero-to-zero. Otherwise use Improved or Declined according to percentage direction even when rounded school grades are equal. A missing predecessor yields First result without deltas. Unreliable chronology instead explains that a comparable baseline is unavailable; it must not assert First result merely because ordering cannot be established. Loading, error, unavailable, stale, and unsynced describe availability/provenance separately from result states.

## Revised critical path and milestone exit criteria

`1.1 → 1.2 → 1.3 → 3.1 → 3.2 → 1.4 → 2.1 → 2.1a → 2.2 → 2.2a → 2.3 → 2.4 → 4.1 → 4.1a → 4.2 → 4.3 → 4.4 → 4.5 → 5.1 → 5.2 → 5.3 → 5.4`.

This is a conservative sequential execution order, not a parallel-agent authorization; the explicit dependencies below identify which work actually blocks each task. Task 3.3 begins after the contract and remains a gate throughout the milestone. No circular dependency remains; fixture expectations exist before implementation, while executable verification follows the UI.

| Slice | Effort | Replacement exit criterion |
| --- | --- | --- |
| M2-A: history foundation | L | Contract, local scope checks, and fixtures demonstrate distinct retained retakes, immutable baselines, replay/conflict handling, revision isolation, and all eight reviewer capture points without hosted access. |
| M2-B: comparisons and summaries | L | A local demo shows selected-quarter student/parent summaries with matching dated results, baseline raw/%/grade, settled deltas/states, explicit quarter emptiness, and separate corrections. |
| M2-C: resilience and review gate | M | Luna PASS on a local commit and Quinn PASS on that same reviewed SHA establish privacy, resilience, accessible mobile behavior, and disabled hosted activation. |

These are local demonstrable slices under the disabled feature flag, not production private-access releases. Invoke only one authorized milestone/seat at a time.

## Checklist amendment

Existing IDs below replace those v1 entries; suffixed IDs are new atomic tasks. Dependencies on unchanged tasks use their original IDs. `[QA]` means Quinn must provide executable verification or browser evidence; `[SEC]` marks privacy/security surfaces; `[EXT]` marks the future external-service boundary, not permission for a service call. Every task has a binary DoD. Requirement references use Rex user-story IDs and the v2 constraint labels in the traceability table.

### Layer: Data and contract (Aria; fixture preparation during authorized implementation)

- [ ] 1.1 Define comparable assessment identity — Depends: Rex v2; DoD: the contract includes child, quarter, subject, module, assessment type, set identity, and content/scoring revision and states that shuffling preserves revision while changed questions, keys, scoring, or totals require a different revision — [HIGH] [SEC] [QA] — Refs: US-205, C1.
- [ ] 1.2 Define attempt lifecycle and baseline eligibility — Depends: 1.1; DoD: the contract distinguishes new retakes from replay/correction, retains every distinct eligible finalized attempt, freezes pop first-evaluated-answer counts and finalized exam scores with existing grades, accepts zero correct, and excludes abandoned/incomplete results — [HIGH] [QA] — Refs: US-201, US-202.
- [ ] 1.3 Define validation, ordering, and display outcomes — Depends: 1.2; DoD: a contract decision table covers malformed/partial/out-of-range/zero-total rejection, replay/conflict outcomes, completion-time/identity ordering, unreliable chronology, and every formula/state/exception specified above — [HIGH] [QA] — Refs: US-205–209, C1–C3.
- [ ] 1.4 Specify deterministic fixture inputs and expected outcomes — Depends: 1.3, 3.1, 3.2; DoD: a synthetic fixture matrix covers every traceability row below, each input has an expected accepted/rejected outcome and visible result, and no real child data or credentials appear — [MED] [SEC] [QA] — Refs: US-201–209, C1–C4.

### Layer: API and access boundary

Retain v1 task 3.1 with dependencies 1.1–1.3 and tags [HIGH] [SEC] [EXT] [QA]; its interface is a **local fixture contract** with future hosted behavior documented only. The external-service fallback is local synthetic fixtures and explicit unavailable status, with no network request, credentials, provisioning, or claimed production sync.

- [ ] 3.2 Prove viewer scope through local contract checks — Depends: 3.1; DoD: local positive and negative contract cases allow an unlocked child only their own records and an authorized parent only the selected child in their family while denying forged or cross-family scope — [HIGH] [SEC] [QA] — Refs: US-204, C4.
- [ ] 3.3 Preserve disabled production access — Depends: 3.1; DoD: the effective configuration remains `FAMILY_ENABLED=false`, guest reviewers work, and the milestone makes no hosted schema/function/auth/account/provisioning or production-sync change — [LOW] [SEC] [EXT] [QA] — Refs: C4.

Task 3.2 replaces v1's ambiguous “backend tests” with local contract evidence; it does not claim that hosted authorization has been deployed or validated.

### Layer: Logic

- [ ] 2.1 Normalize eligible results — Depends: 1.4; DoD: valid zero and nonzero finalized fixture results preserve baseline raw/%/existing grade while malformed, partial, and abandoned inputs are excluded from trend calculations with explicit validation outcomes — [HIGH] [QA] — Refs: US-201, US-208, C3.
- [ ] 2.1a Enforce result identity and immutability — Depends: 2.1; DoD: two distinct matching retakes retain two results, an identical replay adds none, a conflicting replay cannot replace either baseline, and corrections/practice cannot create an assessment result — [HIGH] [QA] — Refs: US-201, US-202, C3.
- [ ] 2.2 Select latest and prior eligible results — Depends: 2.1a; DoD: full-scope matches use completion time with a stable attempt-identity tie-break, the third result uses the second, late offline results recompute the pair without score mutation, and unreliable chronology supplies no directional pair — [HIGH] [QA] — Refs: US-205, US-206, C1, C3.
- [ ] 2.2a Calculate percentages and deltas — Depends: 2.2; DoD: raw fractions produce the documented precision, +15.00 pp/+25.0% for 60%→75%, -15.00 pp/-20.0% for 75%→60%, no missing-baseline deltas, and unavailable relative change for every actual zero prior — [MED] [QA] — Refs: US-205–207, C2.
- [ ] 2.3 Classify comparison and availability outcomes — Depends: 2.2a; DoD: fixtures produce Empty, First result, Unchanged, Improved, or Declined when determinable, enforce displayed-equality/zero-prior precedence, and separately identify unavailable chronology, loading/error, and stale/unsynced provenance without fabricated trends — [MED] [QA] — Refs: US-206–209, C2, C3.

Retain v1 task 2.4 (child/quarter race protection), with dependencies 3.2 and 2.3 and tags [HIGH] [SEC] [QA]; extend its verification to late responses after either child or quarter changes and clear unauthorized cached rows before rendering.

### Layer: UI

- [ ] 4.1 Integrate scoped progress entry — Depends: 2.4, 3.3; DoD: the hub and all eight reviewers expose the authorized local progress route while retaining published filenames, navigation, guest access, content constants, self-contained helpers, and Q1/Q2 isolation — [MED] [SEC] [QA] — Refs: C1, C4.
- [ ] 4.1a Integrate eligible finalized result capture — Depends: 4.1, 2.1a; DoD: each of the eight reviewers emits each existing eligible finalized pop/exam result through the approved local contract with its per-attempt baseline and assessment revision while preserving existing completion behavior — [HIGH] [QA] — Refs: US-201, US-202, C1, C4.
- [ ] 4.2 Present selected-quarter student subjects — Depends: 4.1a; DoD: each subject has a separate summary with an identifiable latest set/type/revision scope, matching prior when available, both dates and baseline raw/%/grade, deltas/text state, and the documented quarter-selector and empty-quarter behavior — [HIGH] [QA] — Refs: US-203, US-205–208, C1, C2.
- [ ] 4.3 Present the parent selected-child view — Depends: 4.2, 3.2; DoD: switching between two authorized children replaces all subject records atomically without sibling mixing or ranking and a child viewer cannot select another child — [HIGH] [SEC] [QA] — Refs: US-204, C4.
- [ ] 4.4 Present history, correction, and availability labels — Depends: 4.3; DoD: dated eligible history remains available, corrections if shown are explicitly separate, archived modules retain labels or explicit unavailable labels, and empty/first/error/retry/stale/offline/unsynced displays neither invent scores nor claim saving/sync success before success — [MED] [SEC] [QA] — Refs: US-201, US-202, US-206, US-208, US-209, C3.

Retain v1 task 4.5 (accessible direction and 390px responsive layout), with dependency 4.4 and tags [MED] [QA]; include keyboard access and text equivalents for the amended quarter, set/type, and availability labels.

### Layer: Verification and review gate

- [ ] 5.1 Prepare focused verification from the amended matrix — Depends: 1.4, 4.5, 3.3; DoD: Quinn's verification assets cover every traceability row, all eight reviewer paths, 390px/keyboard/text-direction behavior, guest regression, and Q2 leak checks using BrowserOS neo for available UI verification — [MED] [SEC] [QA] — Refs: US-201–209, C1–C4.

Retain 5.2 → 5.3 → 5.4, adding dependencies 5.1 → 5.2 and the continuing 3.3 gate. Luna runs ponytail → thermos → pstack, resolves scoped findings, and reports PASS with a local conventional commit on a feature branch when starting on main, including `Co-Authored-By: Grok 4.6 <noreply@x.ai>`. Quinn's final PASS must reference that exact reviewed SHA; changes after testing require the relevant gate/tests again. The release report records the SHA, local evidence, disabled flag, deferred hosted activation, and any limitations. No commit or test execution is performed by this planning amendment. Dep cannot push/deploy without both gates and separate authorization.

## Requirement traceability and required evidence additions

| Requirement | Tasks | Binary evidence required at verification |
| --- | --- | --- |
| US-201: each completed attempt's immutable baseline | 1.2, 1.4, 2.1, 2.1a, 4.1a, 4.4, 5.1 | Pop 6/10 corrected to 10/10 remains 6/10 with its original mapped grade; independent 8/10 retake retains a second result; replay retains exactly two; finalized exam baseline and finalized 0/10 remain valid. |
| US-202: separate corrections/practice | 1.2, 2.1a, 4.1a, 4.4, 5.1 | Corrections and practice do not mutate baseline or count as retakes; any displayed correction has a separate label. |
| US-203: side-by-side subjects/quarter | 4.2, 4.5, 5.1 | Multiple subject summaries stay separate; empty subjects and an empty current quarter fabricate no score; explicit quarter change replaces scope. |
| US-204: authorized selected child | 3.2, 2.4, 4.3, 5.1 | Child A/B switching, forged child access, and cross-family cases never disclose another child's rows. |
| US-205: comparable latest/prior | 1.1, 1.3, 2.2, 2.2a, 4.2, 5.1 | 60→75 and reverse yield specified deltas; third result pairs with second; latest unmatched set yields First result even if another set has history. |
| US-206: missing baseline | 2.2, 2.3, 4.4, 5.1 | One eligible result has First result and no deltas; unknown chronology instead explains unavailable baseline. |
| US-207: unchanged/precision | 1.3, 2.2a, 2.3, 5.1 | Equal displayed percentages force zero deltas; 0→0 is Unchanged with relative unavailable; unequal displayed percentages can change direction while grade stays equal. |
| US-208: empty state | 2.1, 2.3, 4.2, 4.4, 5.1 | Empty dataset, empty subject, empty selected quarter, and rejected-only input supply no invented grade/trend. |
| US-209: availability/races | 2.4, 4.4, 5.1 | Load failure permits retry; late child/quarter responses cannot overwrite newer scope; stale/offline data carries provenance. |
| C1: revision/order/isolation (Rex v2 matching) | 1.1, 2.2, 4.1, 4.2, 5.1 | Change each key dimension independently to prohibit matching; shuffling alone remains comparable; tied times resolve stably; receipt order does not affect order. |
| C2: numeric exceptions (Rex v2 defaults) | 1.3, 2.2a, 2.3, 5.1 | Raw-fraction rounding boundaries, same-grade changes, nonzero→zero, zero→positive, zero→zero, and missing prior all match the settled decision table. |
| C3: integrity/resilience (Rex v2 edges) | 1.3, 2.1, 2.1a, 2.2, 4.4, 5.1 | Conflicting replay retains accepted baseline; delayed result recomputes pair; malformed/abandoned result stays ineligible; archived labels remain honest; storage failure never reports saved/synced. |
| C4: privacy/platform/deferred activation | 3.1–3.3, 4.1, 4.3–4.5, 5.1–5.4 | Synthetic fixtures, scoped local access, no private URLs/logs/public content, guest access, eight isolated reviewers, CRLF/self-contained helpers, and `FAMILY_ENABLED=false` are verified without hosted mutation. |

## Notes for Aria (next handoff; awaiting user go-ahead)

Consume ALEX_M2_PLAN_v1 plus this v2 amendment and REX_M2_REQUIREMENTS_v1 plus v2. Amend the existing ARIA_BLUEPRINT_v1 by reference; carry over its applicable per-attempt baseline, revision, chronological ordering, and private-boundary invariants while explicitly superseding its percentage precision for M2. Its broader timing/reward/import/hosted-sync work is not authorization to add those features here.

Specify how existing attempt identities, finalized eligibility, reliable chronology, content/scoring revisions, replay conflicts, local retention, and viewer scope satisfy tasks 1.1–3.3. Identify capture points and existing grade mappings across all eight reviewers, the existing current-quarter source, and how unknown chronology differs from First result. Define contracts/access boundaries and integration locations; Alex does not prescribe schemas, storage patterns, routes, or a new file layout. Any technical design choice within these requirements belongs to Aria, with no product blocker currently outstanding.

Mason later implements only an authorized slice against Aria's amended contract. No application code, schema, tests, local commit, push, deployment, hosted account, signup, provisioning, or private activation is part of this Alex handoff.

## Unchanged scope and compressed report

Study timers/time correlation, rewards/XP/goals/badges, hints/extra credit, signup/accounts, hosted provisioning/production sync/private activation, exports, attention cues, and sparklines remain deferred. No manual pairs or cross-child/cross-quarter trends are added.

[ALEX] v2.0 — 2026-10-24
Status: COMPLETE
Key outputs:
- Amended the per-attempt history, revision-aware ordering, numeric exceptions, and dependency-aware checklist with binary DoD and requirement evidence.
- Resolved an empty current quarter by preserving selection and showing honest emptiness with explicit quarter choice.
- Preserved v1, the disabled hosted boundary, and a clear architecture handoff without implementation.
Blockers: None.
Next recommended: Aria amendment, awaiting user go-ahead.
