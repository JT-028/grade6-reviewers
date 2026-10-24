# REX REPORT AMENDMENT — v2.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Scope: M2 requirements revisit; clarification only
Status: COMPLETE
Baseline: `REX_M2_REQUIREMENTS_v1.md`; planning reference: `ALEX_M2_PLAN_v1.md`

## Summary and precedence

M2 scope is revalidated. This amendment changes only the sections below; the v1 requirements otherwise remain in effect. It resolves ambiguous “first-attempt” language, restores comparability safeguards already recorded in `ARIA_BLUEPRINT_v1.md`, and settles the planning defaults. It does not authorize implementation, hosted changes, or private activation. The prior blueprint includes later milestones; only its existing assessment and comparison semantics are relevant here.

## Modified Must Have: immutable first-answer history

Replace “first-attempt assessment history” with **immutable first-answer results for every distinct finalized eligible pop-quiz or exam attempt**. “First” describes the scoring baseline within each attempt, not the first completed attempt in a child's lifetime or the first attempt at a set. A later independently started retake creates another history result and can become a comparison baseline. Repeated delivery of the same attempt creates no additional result.

For pop quizzes, the baseline counts each question's first evaluated answer in that attempt. Correcting an initially wrong answer never increases that baseline. For exams, preserve the existing finalized scoring behavior; the baseline is the finalized exam score, with no later correction rewriting it. Preserve each reviewer's existing DepEd-style grade mapping using the baseline correct count and total. A finalized zero score is valid. Abandoned activity without a finalized result and incomplete or malformed result payloads are ineligible for trends. This introduces no new timeout or assessment-completion behavior.

Correction/practice separation moves from Should Have to Must Have. Correction outcomes, if displayed, must be explicitly labeled and separate from baseline scores; they never count as a fresh assessment result. No new correction workflow is required.

**US-201 amended:** As a student, I want each completed assessment's first-answer result retained so that later retakes show my progress without rewriting my earlier score.

**AC:** Given one finalized pop-quiz attempt with 6 first-answer correct out of 10 and subsequent corrections to 10/10, when history is displayed, then its baseline remains 6/10 and its grade reflects 6/10. Given a separately started and finalized matching retake with 8/10 first-answer correct, when history is displayed, then both results remain and the retake can compare with the earlier 6/10 result. Re-delivering either result does not add a third result or alter either baseline.

**US-202 amended AC:** Given corrections or practice associated with a completed assessment, when progress is calculated, then those activities neither mutate its baseline nor masquerade as a retake.

## Modified Must Have: matching and ordering

The comparison scope is the same child, quarter, subject, module, assessment type, existing quiz/exam set identity, and content/scoring revision. Pop quizzes and exams remain distinct; different quiz/exam sets remain distinct. Question-order shuffling alone preserves comparability; changed questions, answer keys, scoring, or totals require a different revision and must not silently join the old comparison group. Do not compare siblings or arbitrary manually selected assessment pairs.

Within that scope, compare the latest eligible result with its immediately preceding eligible result by completion time, using a stable attempt identity to break ties. Upload/receipt order must not determine learning order. A valid delayed offline result may change the latest/prior pairing according to its original completion time without changing recorded scores. Unknown or unreliable completion chronology must not produce a directional trend; explain that a comparable baseline is unavailable. Identity and revision details are requirements, not a schema prescription.

**US-205 amended AC:** Given two matching results at 60% and 75% in completion order, when progress is shown, then the newer result displays +15 percentage points, +25% relative change, both result dates, and Improved. Given the reverse scores, then it displays -15 percentage points, -20% relative change, and Declined. A third matching result uses the second as its prior result. A changed revision, another set, another quarter, or another child never supplies that prior result.

**Additional AC:** Given a subject containing multiple sets or assessment types, when a latest result is summarized, then its set/type is identifiable and its prior score comes only from that same comparison scope. A latest result with no matching predecessor displays First result even if the subject has other unrelated results.

## Resolved planning defaults and display rules

- Use a selected-quarter view, defaulting to the current quarter where data exists, as already contemplated in v1 and Alex v1. No automatic cross-quarter comparison or arbitrary history-window selector is required. Alex records the deterministic no-current-quarter-data fallback during planning.
- Adopt Alex v1's two decimal places for percentages and percentage-point deltas, and one decimal place for relative change. These supersede the earlier blueprint's one-decimal percentage display suggestion for M2 only. Existing reviewer grade rounding/mapping remains unchanged.
- Calculate percentage as `100 * correct / total`, percentage-point change as `latest percentage - prior percentage`, and relative change as `100 * (latest percentage - prior percentage) / prior percentage`, using raw fractions before display rounding.
- Equal displayed percentages mean Unchanged and both displayed changes are zero, as required by v1 US-207. Otherwise classify Improved or Declined by direction. Do not use a rounded DepEd grade to decide direction; a grade can stay the same while the percentage changes.
- A prior score of zero makes relative change unavailable, including zero-to-zero; this mathematical exception takes precedence over the zero relative-change display above. Percentage-point change remains available and zero-to-zero is Unchanged. A missing prior result omits both deltas and shows First result; missing history is never a zero baseline.
- Empty, First result, Unchanged, Improved, and Declined are the result states. Loading/error/unavailable and unsynced/stale provenance are explicit availability information and must not be mistaken for a trend state. Equivalent clear wording is acceptable.

**US-207 amended AC:** Given two equal percentages at the adopted display precision, when the comparison appears, then it says Unchanged with zero displayed deltas, except relative change is unavailable when the actual prior score is zero. Given unequal displayed percentages with the same rounded school grade, then it still shows the correct direction and numeric deltas.

## Revalidated boundaries and edge cases

- All eight self-contained reviewers are in scope; Q1/Q2, subject, module, type, and set boundaries remain isolated. Existing published filenames, content constants, navigation, and guest access remain intact.
- Each unlocked child sees only their own subject summaries side by side. A parent selects one child and views that child's subject summaries; this is not sibling ranking. Subjects without data have an honest empty state.
- Duplicate delivery, conflicting duplicate content, tied completion times, late offline results, malformed results, child/quarter switching, and stale responses must be handled without score mutation, double counting, fabricated trends, or cross-child leakage. A conflicting replay cannot replace the accepted immutable result.
- Data shown while offline or stale must identify its provenance; saving/syncing must never be reported as successful before it actually succeeds. No production sync is authorized in M2.
- Preserve `FAMILY_ENABLED=false`. M1's static family-access foundation is live; hosted Supabase remains untouched and no parent is provisioned. Local fixtures/contracts support M2 validation. Timers, study time, rewards, hints, extra credit, signup, hosted provisioning, and private activation remain deferred.
- Optional v1 nice-to-haves do not become M2 delivery requirements: no attention-cue rules, export, or sparkline work is newly authorized.

## Open questions and handoff

No blocking product questions remain. Manual pairing is out of scope, first-answer/retake semantics are resolved from prior approved behavior, and numeric defaults are settled above. The no-current-quarter-data fallback is a non-blocking planning detail for Alex, who must document it without extending comparison scope.

Next recommended: Alex amendment to the M2 plan and checklist using v1 plus this amendment. No other seat is invoked by this report.

## Compressed report

[REX] v2.0 — 2026-10-24
Status: COMPLETE
Key outputs:
- Clarified immutable first-answer score per completed attempt, with distinct retakes retained and corrections separate.
- Restored revision-aware matching and completion-order comparisons; settled display defaults and zero-baseline rules.
- Revalidated eight-reviewer scope, privacy/resilience, and disabled hosted activation without scope expansion.
Blockers: None.
Next recommended: Alex, as requested by the user.
