# Agent Instructions

## Repo
- Static Grade 6 review hub on GitHub Pages (`JT-028/grade6-reviewers`, branch `main`)
- Live: https://jt-028.github.io/grade6-reviewers/
- Hub: `index.html` (`#q2` default, `#q1`). Eight self-contained `*_Review_Module_v1.0.0.html` files
- This is **not** Next.js. Do not restore `nextjs-agent-rules`
- Git root is this folder. Parent `D:\PORTFOLIO\booklet-web-app` is not a git repo

## Orchestrator
- Default workflow: **agent-squad**
- Load: `C:\Users\jdtig\.agents\skills\agent-squad\SKILL.md` then the specialist `SKILL.md`
- Playbook: Obsidian `Multi-agent system guide/Using Agent Squad for Web Development.md` (vault `C:\Users\jdtig\Documents\Obsidian Vault`)
- Do **not** use `agent-orchestrator` or `app-builder` for this repo
- Main agent never writes application code
- One specialist at a time; wait for user after each handoff
- Store full reports by reference; keep only a compressed summary in context

```
[AGENT] [version] — [date]
Status: [COMPLETE / BLOCKED / PARTIAL]
Key outputs: [2–3 bullets]
Blockers: [if any]
Next recommended: [agent or awaiting user]
```

Relay to the user as: What happened / Key outputs / Blockers / Recommended next

## Routing
- New work: Rex → Alex → Aria → Mason (one milestone) → Luna → Quinn → Dep
- Skip Aria for tiny HTML/CSS/JS tweaks that do not change file layout or data shape
- Existing code, no squad history: Luna (review), Quinn (tests), Dep (deploy) as requested
- Max only on explicit “refactor / optimize”
- Never auto-chain; never invoke the next agent without user go-ahead
- Never let Dep push/deploy until Luna gate is PASS with a local commit **and** Quinn PASS

## Squad
| Agent | Skill | Job |
|-------|-------|-----|
| Rex | `agent-squad/rex` | Spec |
| Alex | `agent-squad/alex` | Plan + checklist |
| Aria | `agent-squad/aria` | Structure / data shape |
| Mason | `agent-squad/mason` | Code |
| Luna | `agent-squad/luna` | Review + ponytail → thermos → pstack; local commit; no push |
| Quinn | `agent-squad/quinn` | Tests |
| Dep | `agent-squad/dep` | Push / GitHub Pages |
| Max | `agent-squad/max` | Refactor on request |

## Key conventions
- Do not rename published `*_v1.0.0.html` files
- Q1 (`*_Review_Module_v1.0.0.html`) and Q2 (`*_Q2_Review_Module_v1.0.0.html`) stay isolated — no Q1 question/theme leak into Q2
- Keep content const names: `POP_QUIZZES`, `EXAM_SET_1`, `EXAM_SET_2`, `FLASHCARD_DECKS`, `BIOMES`, `TUTOR_TOPICS`, `CHEAT_BLOCKS`, `PRACTICE_SETS`, `PRACTICE_ITEMS`, `RANKS`
- Duplicate helpers in each HTML file (no shared `.js`)
- Files use CRLF; GitHub Pages updates only after this repo is committed **and** pushed
- Results: DepEd-style school grade + percentage + raw correct/total
- True/False options must not leak the answer
- BrowserOS neo for UI verification when the session has it
- Never commit secrets, tokens, or MCP headers

## File-scoped commands
| Task | Command |
|------|---------|
| Serve hub | from this folder: `npx --yes serve . -p 8766` |
| Open module | browser → `http://127.0.0.1:8766/<file>.html` |
| Q2 leak check | search that Q2 HTML for Q1-only strings (Earliest Heroes, Origin Theory, Ring of Fire, …) |

## Commit Attribution
- Conventional commits (`feat:`, `fix:`, `docs:`)
- Luna commits locally on a feature branch when on `main`; Luna never `git push`
- AI commits MUST include:
```
Co-Authored-By: Grok 4.6 <noreply@x.ai>
```
