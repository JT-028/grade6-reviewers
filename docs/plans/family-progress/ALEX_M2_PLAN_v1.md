# ALEX PLAN — v1.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Input: REX_M2_REQUIREMENTS_v1
Scope: M2 learning statistics and progress trends
Status: READY FOR ARCHITECTURE

## Summary

M2 is a shippable progress-history slice. It captures immutable first-attempt results for eligible pop quizzes and exams, derives deterministic latest-versus-prior comparisons, and presents subject summaries to the selected child or authorized parent. Production private access remains disabled; local fixtures and contracts must be sufficient to validate the feature before a separate provisioning gate.

## Critical Path

Assessment identity and first-attempt semantics → private data contract and access rules → deterministic comparison calculations → fixture/API behavior → student and parent summaries → accessibility/resilience verification → Luna review → Quinn QA.

The data contract blocks all other work. Hosted Supabase provisioning and account activation are deliberately outside this path.

## Milestones

M2-A: Assessment history foundation — L
  Delivers: validated first-attempt records and local fixtures for both pop quizzes and exams, with corrections excluded from the baseline.

M2-B: Comparison and subject summaries — L
  Delivers: selected-quarter subject-by-subject latest/prior summaries with raw score, percentage, grade, deltas, and explicit trend states.

M2-C: Resilience and release gate — M
  Delivers: privacy, stale-response, empty-state, accessibility, and mobile checks; reviewed local commit ready for a later authorized backend release.

## Implementation Checklist

### Layer: Data and contract

- [ ] 1.1 Define the canonical assessment identity and comparison key (child, quarter, subject, module, type, set identity) — DoD: Aria’s contract names every required field and rejects comparisons across different keys — [HIGH] [SEC]
- [ ] 1.2 Define immutable first-attempt and correction/practice semantics — DoD: one finalized first-attempt record is retained per eligible attempt and later retries cannot mutate that record — [HIGH]
- [ ] 1.3 Define validation and display rules — DoD: malformed, partial, out-of-range, and zero-total results are rejected; percentage, grade, precision, unchanged threshold, and zero-prior relative-change behavior are documented — [MED]
- [ ] 1.4 Produce deterministic local fixtures covering first result, improvement, decline, unchanged, zero prior, duplicate submission, correction, empty subject, and two children — DoD: each fixture has expected visible state and no secrets — [MED]

### Layer: Logic

- [ ] 2.1 Implement immutable result ingestion/normalization against the approved contract — DoD: valid fixture results normalize to one canonical record and invalid records produce a typed unavailable/error outcome — [HIGH]
- [ ] 2.2 Implement latest/prior matching and trend calculations — DoD: matching uses the full comparison key, dates are deterministic, percentage-point and relative deltas follow the documented formulas, and zero-prior relative change is unavailable — [HIGH]
- [ ] 2.3 Implement state classification — DoD: the logic returns exactly one of Empty, First result, Improving, Unchanged, or Declining using the approved precision threshold — [MED]
- [ ] 2.4 Implement child/quarter selection race protection — DoD: a late response cannot replace data for a newer selection, and switching children clears or atomically replaces the old dataset — [HIGH] [SEC]

### Layer: API and access boundary

- [ ] 3.1 Define the read/write interface for local and future Supabase-backed use — DoD: the interface carries child, quarter, and filter scope without putting private names or scores in URLs or logs — [HIGH] [SEC]
- [ ] 3.2 Enforce viewer scope in the local contract and backend tests — DoD: a child sees only the unlocked profile and a parent sees only the selected family child; cross-family and forged scope cases are denied — [HIGH] [SEC]
- [ ] 3.3 Keep production activation disabled — DoD: `FAMILY_ENABLED=false`, no hosted migration/function/auth change occurs, and guest reviewers remain usable — [LOW] [SEC] [EXT]

### Layer: UI

- [ ] 4.1 Add the progress entry point without changing published filenames or Q1/Q2 content — DoD: the hub and all eight reviewers retain their existing navigation and expose one correctly scoped progress link — [MED]
- [ ] 4.2 Build the student subject summary — DoD: for the selected quarter, every subject with data shows latest result, prior result when available, dates, raw score, percentage, grade, numeric deltas, and text trend state — [HIGH]
- [ ] 4.3 Build the parent selected-child summary — DoD: selecting Child A then Child B replaces all rows and never mixes names or records — [HIGH] [SEC]
- [ ] 4.4 Implement empty, first-result, unavailable, retry, and correction labels — DoD: no missing baseline is rendered as zero/decline and correction activity is visibly separate from first-attempt history — [MED]
- [ ] 4.5 Implement accessible direction and responsive layout — DoD: trend meaning is available in text and symbols without color alone, keyboard focus is visible, and the 390px layout has no horizontal overflow — [MED]

### Layer: Verification and release

- [ ] 5.1 Add focused logic/API/browser tests from the fixture matrix — DoD: Quinn’s suite covers all required trend states, privacy boundaries, duplicate handling, stale responses, and mobile/accessibility assertions — [MED]
- [ ] 5.2 Run Luna’s review and required cleanup passes — DoD: Luna reports PASS, applies only scoped fixes, and creates a local conventional commit with the required Grok coauthor — [MED]
- [ ] 5.3 Run Quinn against the reviewed commit — DoD: all M2 tests pass with no unresolved high or medium blocker — [MED]
- [ ] 5.4 Prepare, but do not publish, a release report — DoD: report states the exact tested SHA, feature flag state, test evidence, and that hosted private activation is deferred — [LOW]

## Blocked Items

- 1.3: display precision and unchanged threshold are open product defaults; Alex recommends two decimal places for percentages and percentage-point deltas, one decimal place for relative change, and unchanged when the displayed percentage is equal. [BLOCKED: REX — non-blocking]
- 1.1: manual pairing of arbitrary assessment attempts is out of scope; the default deterministic set identity is approved. [BLOCKED: REX — resolved by scope]

## Notes for Aria

- Amend the existing family data contract rather than redesigning M1 access foundations.
- Preserve first-attempt immutability and a distinct correction/practice representation.
- Make the comparison key and retention behavior explicit for archived modules and duplicate timestamps.
- Specify authorization for both child and parent reads; private data must never be exposed through public reviewer content, URLs, or logs.
- Keep hosted schema/function deployment and private activation out of this milestone.

## Notes for Mason

- Implement in checklist order: contract and fixtures before calculations, calculations before UI, and UI before release verification.
- Keep all published reviewer files self-contained and preserve Q1/Q2 isolation and required content constants.
- Use local fixtures to prove behavior while `FAMILY_ENABLED=false`; do not create production credentials or mutate hosted Supabase.
- Treat stale responses, child switching, zero baselines, and corrections as first-class behavior rather than polish.

## Definition of M2 Done

M2 is complete when a reviewed local build can display private, fixture-backed subject summaries for a selected child and quarter, with deterministic latest/prior comparisons, raw/%/grade values, percentage-point and relative changes, correct empty/first/unchanged/improved/declined states, separate correction activity, enforced child/parent scope, accessible responsive UI, passing Quinn tests, and no hosted private activation.

## Deferred

Study-time tracking and score/time correlation (M3); goals, XP, badges, bonuses, hints, and extra credit (M4); hosted Supabase provisioning, parent signup, private activation, and production sync (separate release gate); cross-family or peer comparisons; content and filename changes.
