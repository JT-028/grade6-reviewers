# M1 plugin review evidence

Date: 2026-10-23, Asia/Manila. Scope is the uncommitted family-access M1 implementation and Luna's corrections.

## Independent passes

| Pass | Original result | Disposition |
|---|---|---|
| Thermos security | Two HIGH defects and one MED defect | Key the PIN-sensitive replay digest, invalidate stale responses, retain pending mutation identities. Fixed and tested. |
| Thermos quality | HIGH stale-response race, MED retry identity, LOW pairing retention | Same race and retry fixes. Pairing metadata now prunes after the bounded expiry window. |
| Comment Sicko | Seventeen comment-line deletions, one redundant membership write | Accepted. External PGlite limitation and public API contract comments retained. No suppressions or debt markers found. |

The two Thermos passes were read-only and ran independently as required by Thermos. Luna synthesized their overlapping findings, reproduced them, and owned all code edits. No next squad specialist was invoked.

The self-contained family HTML exceeds 1,000 lines because it contains its own markup, styles, and browser code, as the repository requires. Splitting it into a shared browser script would violate that constraint. The review found no need for a broad refactor.

## Grounding and choices

The private request flow is browser fetch, Edge route and validation, verified or opaque credential resolution, then the service-only SQL dispatcher. Parent ownership and child scope are checked in SQL before private data is returned. Public guest reviewers only gain navigation links.

The reviewed domain contains parent, approved device, child session, pairing request, and receipt. The access generation represents which asynchronous browser work is still authorized to update local state. Pending mutation IDs represent unresolved work rather than another button click.

The safety fact checked in executable code is that a lock remains authoritative even when an older network result arrives later. The Deno lifecycle regressions and BrowserOS delayed-response check prove that fact for the covered paths.

## Applied instructions

Read from the exact installed plugin roots:

- Ponytail, ponytail-review, and ponytail-debt.
- Thermos and both thermo-nuclear review skills.
- Pstack poteto-mode and its Feature playbook for the reviewed M1 change.
- Laziness protocol, subtract before you add, minimize reader load, fix root causes, prove it works, and sequence verifiable units.
- TypeScript best practices, type-system discipline, boundary discipline, model the domain, and make operations idempotent.
- TDD and test behavior rather than implementation. Four checks reproduced the original defects before the fix.
- Blast radius, how, and architect for review against the existing Aria contract. A second architecture or feature implementation was not launched inside this review.
- Benchmark checklist and explain the number. No new performance claim was made. Mason's local PIN timing was not treated as hosted Edge evidence.
- No-comments, unslop, and technical-writing.
- Commit and create-branch. Repository instructions control the codex branch prefix and Grok coauthor.

The Feature sequence was adapted to the authorized review. Aria's approved architecture and Mason's implementation already exist. Another design competition, new builder, rebase, PR, or deployment is outside the user's Luna-only handoff. Blocking first steps were scope and authorization review. The only independent workstreams were read-only review passes. Luna serialized all shared writes. The smallest safe work unit was one reproduced defect and its regression.

The unavailable deslop plugin used Pstack's documented fallback in `C:/Users/jdtig/.cursor/plugins/local/pstack/docs/guide/05-build-and-clean.md`. Narrating comments, a no-op write, and unrelated changes were checked directly. The external control-ui reference did not replace the user's explicit BrowserOS neo workflow.

## Final local verdict

No unresolved confirmed critical or high finding remains. Ponytail's local code verdict is Ship. The complete handoff is PASS WITH CONDITIONS because production pgcrypto and hosted integration remain unverified. No plugin verdict authorizes a push or deployment before Quinn and the remaining gate conditions pass.
