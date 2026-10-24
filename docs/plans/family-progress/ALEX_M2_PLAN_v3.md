# ALEX PLAN AMENDMENT — v3.0

Project: Grade 6 Reviewers family progress
Date: 2026-10-24 (Asia/Manila)
Input: REX_M2_REQUIREMENTS_v1 + v2 + v3
Baselines: ALEX_M2_PLAN_v1 + v2; ARIA_M2_BLUEPRINT_v1
Scope: Future M2 existing Report Card statistics and dedicated JPEG sharing
Status: COMPLETE — FUTURE M2 ARCHITECTURE AMENDMENT REQUIRED

## Precedence and lane separation

Apply these additions and replacements to Alex v1 + v2; all other tasks and settled calculation/history/privacy constraints remain effective. Rex v3 supersedes the earlier export deferral only for a dedicated report-card JPEG. The required location is the existing Report Card tab in every one of the eight self-contained reviewers (`reportTabBtn`, `reportCardWrapMain`), in addition to the already planned family summaries. A family.html-only implementation does not satisfy this amendment. Existing guest Save as Image PNG behavior remains usable; its local scores/display names are not authority for private family statistics.

The user's separately authorized immediate lane is Mason M1 family-access activation → Luna review/local commit → Quinn on that reviewed SHA → Dep publication. This future M2 amendment does not add a prerequisite or deliverable to M1. Earlier v1/v2 statements requiring FAMILY_ENABLED=false and deferring hosted activation describe their M2 slices; they do not cancel the newer authorization to activate the already prepared M1 access foundation. M2 statistics/export must not become exposed merely because M1 access is enabled. Aria must describe the future M2 isolation/availability boundary against the then-current approved M1 baseline without treating the global false flag as an unconditional future prerequisite.

No application edits, tests, commit, push, hosted mutation, or next-seat invocation occur in this planning amendment. Technical choices below are Aria dependencies, not unresolved product questions or requests for extra approval.

## Revised dependency overlay and milestones

Retain the v2 history/comparison path through 2.4 and 4.1a. Add the following dependency edges:

`Rex v3 → 1.5 (Aria amendment) → 1.6 (synthetic report/export matrix)`.

`1.5 + 2.4 + 4.1a → 2.5 (report projection) → 4.2a (eight tabs)`.

`4.2a + 4.4 + 4.5 → 2.6 (scoped snapshot) → 4.6 (JPEG preview) → 4.7 (user-controlled handoff)`.

`1.6 + 4.7 → 5.1a → 5.2 → 5.3 → 5.4`.

Task 4.8 guards preparation and handoff after 2.6 and is a prerequisite of 5.1a. Existing parent view 4.3 and history/availability work 4.4 remain required; integration may use their approved contracts but does not require a new parent export convenience button. This is dependency order, not parallel-agent authorization. There is no edge from these future M2 tasks to immediate M1 activation.

| Slice | Effort | Amended exit criterion |
| --- | --- | --- |
| M2-A: history foundation | L | Prior scope remains unchanged; this amendment does not reopen completed history work or claim it implements a report/export surface. |
| M2-B: summaries and existing Report Card tabs | L | Family summaries and all eight child Report Card tabs show the same authorized selected-quarter statistics, dated identifiable comparisons, raw/%/school-grade values, deltas, and honest availability/correction states. |
| M2-C: JPEG sharing, resilience, and review gate | L | An explicit action produces a complete readable JPEG with preview and user-controlled share/save fallback; privacy/races/mobile/accessibility evidence passes Luna and Quinn for the reviewed local SHA. |

M2-B/C require Aria's amended contract before implementation. They remain future authorized slices rather than additions to the current M1 activation packet.

## Added implementation checklist

Each DoD is binary. [QA] requires future Quinn executable or browser evidence; [SEC] marks private scope. Existing task IDs keep their v2 meanings unless amended below. No hosted Messenger integration or external service call is required.

### Layer: Data and access contract

- [ ] 1.5 Amend report projection and export ownership contract — Depends: Rex v3 and existing 1.1–1.3/3.1–3.2 contracts; DoD: Aria names the authorized canonical statistics owner, all eight tab integration boundaries, family/tab/export parity rules, complete one-child/quarter snapshot fields, access invalidation boundaries, preview/JPEG/share/save contracts, and current M1 versus future M2 capability separation without adopting legacy guest progress as private authority — [HIGH] [SEC] [QA] — Refs: US-210, US-211, US-213.
- [ ] 1.6 Extend synthetic fixture expectations — Depends: 1.5 and existing 1.4; DoD: a fixture matrix supplies independently expected tab/image values and every evidence row below, including long content, scope changes during delayed generation, partial/stale/offline data, and exclusion sentinels for unrelated/private information without real child data — [MED] [SEC] [QA] — Refs: US-210–213.

### Layer: Logic

- [ ] 2.5 Derive the report projection from canonical private summaries — Depends: 1.5, 2.4, 4.1a; DoD: the selected authorized child/quarter yields the same subject/module/type/set/revision context, latest/prior dates, raw/%/school grade, percentage-point and relative changes, and separate correction/provenance states as the family summary, with no legacy-score or cross-quarter fallback — [HIGH] [SEC] [QA] — Refs: US-210, US-213.
- [ ] 2.6 Capture an exportable scope-bound snapshot — Depends: 2.5, 4.2a, 4.4, 4.5; DoD: explicit preparation captures only the authorized child's intended visible selected-quarter report scope, displayed academic values and labels, result dates/timezone, generation date/time, necessary provenance and snapshot notice without mutating assessment data — [HIGH] [SEC] [QA] — Refs: US-211, US-213.

### Layer: UI and browser handoff

- [ ] 4.2a Integrate approved statistics in all eight existing Report Card tabs — Depends: 1.5, 2.5; DoD: every Q1/Q2 reviewer exposes its approved selected-quarter child report in its existing Report Card tab with originating reviewer context and separate subject/assessment labels while guest report/export and navigation behavior remain usable — [HIGH] [SEC] [QA] — Refs: US-210.
- [ ] 4.6 Add a dedicated JPEG preparation and preview action — Depends: 1.5, 2.6; DoD: a clearly named keyboard-operable action in each existing Report Card tab prepares a preview and an actual decodable image/jpeg with .jpg/.jpeg filename, displays the intended snapshot scope, and preserves readable complete content under Aria's supported mobile/overflow contract — [HIGH] [SEC] [QA] — Refs: US-211, US-212.
- [ ] 4.7 Add explicit user-controlled share/save outcomes — Depends: 4.6; DoD: the viewer can explicitly share the JPEG through supported file sharing or save/download it with concise manual Messenger attachment guidance, can cancel, and receives distinct preparation/handoff/download/error status with retry or fallback without automatic sending, recipient collection, public report URL, or any delivery claim — [MED] [SEC] [QA] — Refs: US-211, US-212.
- [ ] 4.8 Invalidate pending private artifacts when scope/access changes — Depends: 1.5, 2.6; DoD: child or quarter changes, lock, expiry, or revocation during generation or before app-initiated handoff discard the pending artifact and require a fresh explicit action, with no stale preview/handoff and no credentials, unrelated child data, or private feedback in content, filename, or metadata — [HIGH] [SEC] [QA] — Refs: US-213.

Extend 4.4 and 4.5 to both new tab displays and export controls: text carries state/direction independently of color, focus is visible, preparation/cancel/error/success statuses are accessible, controls work by keyboard, and the 390px report/control layout has no horizontal overflow. The on-screen text remains usable without generating an image. A clearly labeled empty report may be exported; failed/unauthorized loads cannot produce a report that appears complete. Stale/device-only/unsynced or partial authorized content retains its necessary provenance in both display and image.

### Layer: Verification and gates

- [ ] 5.1a Verify report integration and JPEG sharing amendment — Depends: 1.6, 4.2a, 4.6–4.8, amended 4.4–4.5, existing 5.1; DoD: Quinn records passing synthetic evidence for each new traceability row across all eight reviewers, supported mobile JPEG readability, browser handoff/fallback, privacy races, keyboard/status behavior, guest regressions, and Q2 isolation using BrowserOS neo when available — [HIGH] [SEC] [QA] — Refs: US-210–213.

Retain Luna 5.2 → Quinn 5.3 → report 5.4, with 5.1a now a gate. Luna's conventional local commit includes the required Grok coauthor; Quinn PASS references that exact reviewed SHA, and relevant checks/gates repeat if later changes invalidate it. Report the actual M1/M2 capability state rather than falsely certifying a globally disabled flag after separately authorized M1 activation. Dep publication still requires the applicable committed Luna PASS, Quinn PASS, and authorization; this amendment neither performs nor newly authorizes future M2 publication.

## Requirement traceability and binary evidence additions

| Requirement | Tasks | Required future evidence |
| --- | --- | --- |
| US-210: actual Report Card location | 1.5, 2.5, 4.2a, 5.1a | All eight existing tabs show synthetic authorized selected-quarter subject summaries; a family.html-only result fails. |
| US-210: canonical parity | 1.5, 2.5, 2.6, 5.1a | For identical child/quarter/repository state, family summary, every applicable tab projection, and image agree on context, dated latest/prior, raw/%/grade, deltas, corrections and availability; contradictory guest scores never substitute. |
| US-210/211: settled history/math | 1.6, 2.5–2.6, 5.1a | Images/tabs preserve v2 two-decimal %/pp, one-decimal relative change from raw fractions, first result, unchanged/same-grade change, zero-prior relative-unavailable including 0→0, and unknown chronology without invented direction; corrections do not improve immutable baselines. |
| US-210/211: honest scope and provenance | 1.6, 2.5–2.6, 4.4, 5.1a | Empty selected quarter stays selected, empty subject never borrows scores, rejected-only/error/unauthorized input appears honestly, and partial/stale/device-only/unsynced data retains required labels, result dates/timezone and generation date/time in tab/image. |
| US-211: real readable JPEG | 4.6, 5.1a | Actual MIME, file signature and successful decoder/open evidence confirm JPEG rather than renamed PNG; supported phone opening and attachment preview remain legible with long child/assessment labels and history/overflow handled completely per Aria's contract. |
| US-211/212: deliberate sharing and fallback | 4.6–4.7, 5.1a | Preview precedes explicit handoff; supported share and unsupported-share save/download routes work; cancellation, generation failure, save failure and share failure have truthful separate outcomes/retry/fallback; no route sends automatically or claims delivery. |
| US-213: one-child scope/race | 2.6, 4.8, 5.1a | Delayed preparation followed separately by child change, quarter change, lock, expiry or revocation produces no stale artifact handoff; a fresh scope requires a new action. |
| US-213: data minimization | 1.6, 4.8, 5.1a | Sentinel credentials/PINs/tokens, account email, pairing/device identifiers, session/cache metadata, private comments/survey responses and unrelated child data appear nowhere in decoded report content, filename or metadata; no private report URLs are created. |
| US-210–213: accessibility/regression | 4.2a, 4.4–4.8, 5.1a | Keyboard, focus and accessible text statuses work; textual report is usable without export; 390px layout and all eight guest report/PNG paths pass; filenames/constants/self-contained helpers/CRLF and Q1/Q2 isolation remain intact. |

Use synthetic report images only in local verification; never add real children's report images to the repository. A saved/shared file is a snapshot that the application cannot retract after the user saves or sends it; expose that limitation concisely in the sharing flow. Download initiation or OS share-sheet handoff proves only that outcome, not a Messenger send or recipient delivery.

## Notes for Aria: future amendment prerequisite

Consume Alex v1 + v2 + this v3 and Rex v1 + v2 + v3, then amend ARIA_M2_BLUEPRINT_v1. Its present family.html-only UI owner and export exclusion do not yet satisfy this scope. Define canonical scoped data ownership across the existing tabs and family view, authorized report projection/snapshot lifecycle, complete content/provenance selection, access invalidation, supported browser file handoff/save fallback, and genuine JPEG generation/readability/overflow behavior. Decide dimensions, compression, pagination/overflow, rendering method, and capability handling within the approved requirements; no exact implementation or schema is prescribed here. Preserve duplicated inline reviewer helpers with no shared browser JS.

Resolve M2 capability isolation against the approved M1 baseline. Do not weaken child/parent access boundaries, reinterpret legacy display names as authorization, expose fixture content publicly, or introduce Messenger APIs/bots/account access, recipient management, timers/rewards/M3/M4, regrading, or public sharing storage. An equivalent parent convenience export remains optional rather than an additional exit gate.

## Immediate Mason M1 handoff packet

The orchestrator can now resume the already authorized M1 activation lane, separately briefing Mason from DEP_HOSTED_M1_PREPARATION_v2 and the reviewed M1 source/setup artifacts. This plan adds no M2 implementation to that packet. Aria may be skipped for a tiny flag/configuration activation that changes neither file layout nor data shape, per repo AGENTS; a discovered structural change must be surfaced rather than silently folded into that exception.

Mason's concrete M1 deliverable is the scoped activation change and a report of its public configuration/integration effects and limitations, with no future statistics/JPEG work. Existing operational prerequisites and access/guest regression checks still apply. Then Luna reviews and commits locally (no push), Quinn verifies that reviewed SHA, and Dep publishes only after both gates pass. Hosted prep evidence is preparation, not a substitute for those activation gates. User authorization for this chain is already recorded; do not ask again merely because this planning handoff finished.

[ALEX] v3.0 — 2026-10-24
Status: COMPLETE
Key outputs:
- Added traceable future M2 all-eight Report Card, canonical private-stat projection, readable JPEG preview/share/save, race/privacy/accessibility tasks and binary evidence.
- Required an Aria amendment for future M2-B/C without prescribing image dimensions or code.
- Preserved the separate already authorized Mason M1 → Luna → Quinn → Dep activation/publication lane.
Blockers: None; future M2 implementation depends on its architecture amendment.
Next recommended: Main resumes Mason M1 activation; future M2 architecture amendment remains a separate scope.
