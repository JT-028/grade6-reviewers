# REX REPORT AMENDMENT — v1.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Scope: M2 — learning statistics and progress trends
Status: COMPLETE

## Summary

M2 gives an unlocked child and the authorized parent/admin a reliable view of learning results over time. For each subject, the viewer can compare the latest eligible pop-quiz or exam attempt with an earlier matching attempt, see raw score, percentage, DepEd-style grade, and both percentage-point and relative change, and understand whether performance is improving, steady, or declining. M2 records and displays achievement data only; study time, rewards, hints, extra credit, and private-account activation remain later work.

## Feature List (MoSCoW)

### Must Have

- First-attempt assessment history by child, quarter, subject, module, assessment type, and assessment identity — preserves an auditable progression baseline.
- Subject-side-by-side summary for pop quizzes and exams — lets a child or parent compare subjects in one view.
- Latest-versus-prior matching comparison — prevents unrelated assessments from producing misleading changes.
- Raw correct/total, percentage, and DepEd-style grade — keeps the result understandable and consistent with existing reviewer output.
- Percentage-point change and relative percentage change — makes both absolute and proportional movement visible.
- Explicit empty, first-result, unchanged, improved, and declined states — avoids implying a trend without a valid baseline.
- Role-scoped visibility for the unlocked child and authorized parent/admin — keeps private results restricted to the family.

### Should Have

- A selectable time window or quarter filter, defaulting to the current quarter where data exists.
- A compact trend history per subject with dated assessment entries.
- Accessible text equivalents for colors, arrows, or chart marks.
- A clear distinction between first-answer score and later correction/practice activity.

### Nice to Have

- A lightweight visual trend line or sparkline per subject.
- A parent-facing attention cue for subjects with repeated decline or no recent attempt.
- Export or print-friendly progress summary after privacy and product review.

### Out of Scope

- Study/module time tracking, start/end timestamps, idle detection, or score/time correlation (M3).
- Goals, XP, badges, bonuses, hints, extra credit, or other rewards (M4).
- Hosted Supabase provisioning, parent sign-up, private-account activation, or production sync (separate release gate).
- Regrading old attempts, changing quiz answers, or using corrections as first-attempt scores.
- Cross-family, class-wide, teacher, or peer comparisons.
- Changes to published reviewer filenames, Q1/Q2 content isolation, or lesson content.

## User Stories

### Epic: Assessment history

**US-201:** As a student, I want my first-attempt pop-quiz and exam results saved by subject so that I can see how my performance changes.

**AC:** Given a completed eligible assessment, when the result is finalized, then one immutable first-attempt record contains the child, quarter, subject, module, assessment type and identity, completion time, correct count, total count, percentage, and grade.

**US-202:** As a student, I want corrections and practice attempts kept separate from my first result so that my progress view reflects the assessment I actually took.

**AC:** Given an assessment with a later correction or retry, when progress is calculated, then the first-attempt result remains unchanged and the later activity is labeled separately or excluded from the baseline comparison.

### Epic: Subject comparison

**US-203:** As a student, I want all subjects shown side by side for a selected quarter so that I can quickly identify strengths and subjects needing effort.

**AC:** Given at least one result in two subjects, when I open the progress view, then each subject has its own clearly labeled summary showing the latest eligible result and its assessment type.

**US-204:** As a parent/admin, I want to select one child and view the same subject summaries so that I can support that child without seeing another child’s records.

**AC:** Given an authorized parent with two children, when the parent selects Child A, then only Child A’s records appear and changing to Child B replaces the dataset without mixing rows.

### Epic: Change over time

**US-205:** As a student, I want my latest result compared with the prior matching assessment so that I know whether I am improving.

**AC:** Given two eligible attempts for the same child, quarter, subject, assessment type, and assessment identity, when the summary is displayed, then it shows latest and prior score details, their dates, percentage-point change, relative percentage change, and an improving/steady/declining state.

**US-206:** As a student, I want the first result called out when no prior baseline exists so that I do not mistake missing history for a decline.

**AC:** Given only one eligible attempt for a comparison key, when the summary is displayed, then it shows “First result” (or equivalent), omits change percentages, and does not show a zero or negative trend.

**US-207:** As a student, I want a stable result to be shown as unchanged so that the interface does not exaggerate tiny or nonexistent movement.

**AC:** Given latest and prior percentages that are equal after the product’s defined display precision, when the summary is displayed, then the state is “Unchanged” and both changes display as zero.

### Epic: Privacy and resilience

**US-208:** As an authorized viewer, I want a useful empty state so that I know what to do before there are enough results to compare.

**AC:** Given no eligible results for a subject or selected quarter, when the summary loads, then it states that no result is available and does not fabricate a score, trend, or grade.

**US-209:** As a student or parent, I want progress to remain understandable during a delayed or failed load so that I do not act on stale or partial data.

**AC:** Given a load failure or stale response, when the view receives the failure, then it shows an explicit unavailable/error state, preserves no unauthorized data, and offers a retry without silently replacing a newer selection.

## Constraints

- Platform: Existing static Grade 6 reviewer hub and eight self-contained Q1/Q2 HTML modules; desktop and mobile web.
- Data ownership: One family; parent manages children; child profile/PIN remains the child access model.
- Privacy: Records are private to the authorized family. No cross-family or public leaderboard.
- Assessment semantics: Preserve existing raw score, percentage, and DepEd-style grade conventions. First-answer quiz scores are separate from corrections.
- Content isolation: Q1 and Q2 remain separate, and published `*_v1.0.0.html` filenames and required content constants remain unchanged.
- Integration: Existing Supabase family foundation is disabled in production. M2 may define the contract and local fixtures, but must not activate hosted private access without a later release gate.
- Accessibility: Trend meaning must not rely on color alone; labels and text values are required.
- Auditability: Assessment identity and timestamps must make the prior/latest pairing deterministic and explainable.

## Edge Cases & Risk Flags

- No baseline: one result must not display a misleading 0% change.
- Zero prior score: relative percentage change is mathematically undefined; show “not available” while still showing percentage-point change.
- Different assessment identity: do not compare unrelated quizzes or exams merely because they share a subject.
- Tied timestamps or duplicate submissions: choose one deterministic first attempt and do not double-count retries.
- Deleted or archived module: retain the result’s subject/assessment labels or show an explicit unavailable label; never silently move it to another subject.
- Partial or malformed result: reject it from trend calculations and show an unavailable state rather than a fabricated grade.
- Child switching: clear or replace the previous child’s data atomically to prevent cross-child leakage.
- Concurrent updates: a late response must not overwrite a newer child, quarter, or filter selection.
- Offline or delayed sync: show last-known data with its timestamp only if its provenance is clear; otherwise show unavailable.
- Small percentage differences: define display precision and the unchanged threshold before implementation.
- Accessibility and color vision: icons, text, and numeric deltas must communicate direction without color alone.
- Privacy-sensitive display: avoid exposing child names or scores in URLs, logs, or public reviewer content.

## Open Questions

- Should the default history window be the current quarter, the full school year, or the latest three matching attempts? **Blocking:** no; Alex can select a safe default and document it.
- What display precision and unchanged threshold should be used for percentage and relative change? **Blocking:** no; use a documented product default during planning if no preference is supplied.
- Should “assessment identity” be the existing quiz/exam set ID only, or should a parent be able to compare a manually chosen pair? **Blocking:** yes for manual-pair UX, no for the default matching behavior. The default requirement is deterministic matching by existing set identity.

## Handoff

Next seat: Alex for an M2 delivery plan and definition-of-done checklist. Aria should then amend the data contract and access boundaries; implementation must remain disabled for hosted private access until the later provisioning gate.
