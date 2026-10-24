# REX REPORT AMENDMENT — v3.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Scope: Future M2 report-card statistics and user-controlled JPEG sharing
Status: COMPLETE
Baselines: `REX_M2_REQUIREMENTS_v1.md` plus `REX_M2_REQUIREMENTS_v2.md`
Planning references: `ALEX_M2_PLAN_v2.md`, `ARIA_M2_BLUEPRINT_v1.md`

## Summary and precedence

This additive amendment requires the approved learning statistics to appear in the child's existing Report Card tab and adds a dedicated button to generate and share/save a readable JPG/JPEG report-card image for manual sharing through Messenger for now. It supersedes v1's export nice-to-have and v2's export deferral only for this future M2 report-card feature. All other settled requirements remain effective. This is requirements work, not authorization to implement statistics or export immediately.

The user separately directed Mason to enable M1 family access, followed by Luna review, Quinn QA, and Dep publication. That activation proceeds as its own authorized scope and gates; this M2 addition does not become a prerequisite or an extra M1 deliverable. Earlier M2 documents' disabled-hosted-access limits describe those local M2 slices; they must not be read as cancelling the user's newer, separate M1 activation instruction. This report does not perform or certify activation, provision accounts, or invoke any next seat.

## Existing surface and intended location

Source inspection finds `reportTabBtn` (`data-tab="report"`), `reportCardWrapMain`, and `renderReportCardMain()` in all eight self-contained reviewer HTML files. The existing child-facing Report Card tab presents local pop-quiz/exam scores and a Save as Image button. The representative Math Q1 implementation uses `progress.popQuizResults`, `progress.examHistory`, and `currentUser`; its current image function encodes `image/png` and downloads a `.png`. These existing browser display names and legacy progress objects are not authority for private family results.

The requested location is this existing Report Card tab in each reviewer, not solely a family dashboard or a new tab in `family.html`. The selected child's approved M2 selected-quarter subject summaries must be visible there, with subject/module/type/set distinctions clear. The originating reviewer remains identifiable; displaying separately labeled subject summaries does not mix Q1/Q2 question pools or assessment baselines. Family progress views remain in the prior plan. Architecture must align the same scoped statistics across these views rather than silently falling back to unrelated legacy scores.

## Added Must Have

- In-tab statistics: The unlocked child's existing Report Card tab shows the approved M2 selected-quarter subject summaries and dated latest/prior comparable results, including raw correct/total, percentage, existing DepEd-style school grade, percentage-point change, relative change, and text trend/availability states. It must not require visiting only the family dashboard to see these statistics.
- Explicit report-card sharing action: A dedicated, clearly labeled button on that tab prepares a report-card image only after a deliberate user action. The artifact is an actual JPEG (`image/jpeg`, `.jpg` or `.jpeg`), not a renamed PNG. The report card is readable when saved and opened on supported phones and when attached through Messenger.
- Scoped snapshot: The image represents one authorized child and the visible selected quarter/report scope at generation, includes the displayed subject and assessment context, result dates and snapshot generation date/time, and uses the same approved scores and deltas as the tab. It excludes other children and unrelated account/private UI. It is a report-card snapshot, not a public share link.
- User-controlled Messenger sharing: Offer supported user-controlled file sharing or a JPEG download/save fallback with concise instructions to attach that saved image in Messenger. The user chooses Messenger, recipients, and the final send action. Successful generation, download initiation, or share-sheet handoff must not be described as a confirmed message delivery.
- Safe availability: Preserve empty, First result, Unchanged, Improved, Declined, zero-prior relative-unavailable, chronology-unavailable, error, stale, device-only, and unsynced meanings in both tab and image. An empty report can be labeled honestly; a failed or unauthorized load must not generate a seemingly complete result. Never omit necessary provenance merely to make the image cleaner.
- Access and privacy: Before preparing or handing off a private snapshot, ensure its child/quarter/access scope is still current. A child switch, quarter switch, lock, expiry, or revocation that invalidates scope during generation must discard the pending artifact and prevent a stale handoff. Never include PINs, tokens, device/pairing identifiers, account email, auth/session/cache metadata, unrelated children, or private comments/survey responses. Include only the authorized child's display identity and intended academic report data.
- Accessible operation: The button is keyboard accessible, has a clear accessible name and visible focus, and exposes preparation/success/cancel/error status in text. The on-screen report remains readable as text; the JPEG is not the only way to access statistics. Unsupported file sharing offers saving the JPEG; cancellation remains cancellation; generation/save/share failures have an understandable retry or fallback without falsely claiming success or changing assessment records.

No broader shareable document system, printable report redesign, or platform integration is added. Exact image dimensions, compression, pagination/overflow handling, rendering method, and supported-browser mechanics belong to architecture and implementation planning, subject to readable, complete report content and meaningful mobile validation. Do not invent a product approval question for these technical choices.

## Added user stories and acceptance criteria

**US-210:** As an unlocked child, I want my approved learning statistics in my Report Card tab so that my report card explains how I am doing without requiring a separate dashboard visit.

**AC:** Given authorized results for the selected child and quarter, when the child opens the existing Report Card tab in any of the eight reviewers, then it presents the approved selected-quarter subject summaries with dated identifiable latest/prior assessment scope, raw/%/school-grade and both change measures when available. Given an empty subject or quarter, then it shows the corresponding honest empty state without borrowing another quarter's results. No sibling selection or ranking is introduced.

**US-211:** As an authorized report-card viewer, I want a dedicated button that creates a JPEG so that I can share that child's report card through Messenger.

**AC:** Given a loaded authorized report card, when the viewer explicitly activates the share/export action, then a valid readable JPEG is prepared from that one child's selected-quarter snapshot with the same scores, dates, subject labels, deltas, and availability/provenance shown on screen. Given support for user-controlled file sharing, then the viewer may choose a destination and recipient through the available interface; given unsupported sharing, then a JPEG save/download fallback explains manual Messenger attachment. Neither route automatically sends a message or claims the recipient received it.

**US-212:** As a child or parent, I want export errors and cancellations handled clearly so that I know whether a report-card image is available to share.

**AC:** Given generation fails, sharing is unsupported, saving fails, or a share operation is cancelled, when the operation ends, then the interface distinguishes those outcomes in accessible text and provides an appropriate retry/save fallback where possible. It does not claim successful sharing, duplicate an automatic send, alter grades, or discard assessment history.

**US-213:** As an authorized viewer, I want only the intended report data included so that sharing an image does not expose family access details or another child's information.

**AC:** Given any authentication, device/pairing, or private feedback information exists elsewhere in the application, when the JPEG is generated, then none appears in its visible content or generated filename/metadata. Given the selected child, quarter, or authorization changes while generation is pending, then the stale artifact is discarded before any app-initiated handoff. A fresh explicit action is required for the new scope. The user is told the resulting saved/shared image is a snapshot; the application cannot retract a copy the user already saved or sent.

## Preserved calculation, history, and privacy constraints

- Every distinct finalized eligible retake retains its immutable first-answer baseline; duplicate delivery adds no result. Pop corrections and practice remain separate and cannot improve the baseline or become a retake.
- Matching stays within child, quarter, subject, module, assessment type, existing set identity, and content/scoring revision. Reliable completion time and stable attempt identity determine latest/prior; receipt order does not. Unknown chronology supplies no invented directional trend.
- Percentage and percentage-point display precision remains two decimals; relative change remains one decimal, calculated from raw fractions before rounding. A zero prior keeps relative change unavailable, including zero-to-zero; missing baseline supplies no deltas. Grade mapping stays consistent with each reviewer. Sharing must not substitute grade change for percentage change.
- Keep the selected quarter when empty, with explicit quarter choice and no silent cross-quarter fallback. Preserve distinct subject labels and dates/timezone context. Same scoped data and values must explain any family view, Report Card tab, and exported snapshot.
- Child access remains own-child only; an authorized parent may view only the selected child in their family. The required sharing button is in the child's Report Card tab; placement of an equivalent parent convenience action can be resolved within planning without making it an extra release requirement.
- No public report URL, cross-family sharing backend, sibling leaderboard, automatic message, Messenger bot/API integration, recipient collection, or access to the user's Messenger account is required or authorized. This requirement relies on user-controlled file sharing/attachment only.
- Study timers, new rewards, hints, extra credit, assessment regrading, content changes, and published file renames remain outside this amendment. Existing report content is not authorization to implement M3/M4 analytics.

## Edges and evidence expected in the future plan

Alex must add binary completion criteria for all eight in-tab integration paths, parity with the family summary, JPEG format validity, legibility on supported mobile layouts, long child/assessment labels and history overflow, honest partial/stale/offline/empty states, zero-prior and missing-baseline cases, keyboard/status accessibility, and generation/share cancellation/error/unsupported fallback. Include delayed generation after scope/access changes and exclusion of credentials/private feedback/other children. Use synthetic data for verification; do not place real children's report images in the repository.

Aria must amend the current blueprint before this future UI/export implementation: the current blueprint names `family.html` as the summary owner and does not yet specify this Report Card rendering/export contract. Architecture must define complete scoped snapshot boundaries, image readability/overflow behavior, actual JPEG output, and supported handoff/fallback mechanics without requiring hosted Messenger APIs. No exact pixel size or compression value is locked by requirements.

M1 family-access activation, Luna's committed PASS, Quinn PASS on the reviewed SHA, and Dep publication remain a separate user-directed execution sequence. This amendment introduces no extra deployment approval flow and no dependency from M1 activation onto future M2 statistics/sharing completion. Existing gates and actual setup prerequisites still apply.

## Open questions and handoff

No blocking product ambiguity remains. Existing Report Card tabs ground the location; JPEG plus manual Messenger attachment grounds the sharing requirement; exact image dimensions and browser handoff are nonblocking architecture decisions. The feature is planned future M2 work, not part of the current M1 activation change.

Next recommended: Alex amend the M2 plan by reference to Rex v1 + v2 + this v3, then return control to the main agent for the separately authorized M1 activation sequence. This report invokes no other seat.

[REX] v3.0 — 2026-10-24
Status: COMPLETE
Key outputs:
- Required approved M2 statistics in all eight existing child Report Card tabs, preserving settled score/history/scope semantics.
- Specified dedicated readable JPEG export and user-controlled Messenger sharing with privacy, accessibility, provenance, and failure/cancel fallback criteria.
- Kept future M2 work separate from the user's authorized M1 activation and gated publication sequence.
Blockers: None; image mechanics need a later architecture amendment.
Next recommended: Alex plan amendment; then main agent resumes the authorized M1 sequence.
