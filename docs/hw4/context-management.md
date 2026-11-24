# Context management strategy

The goal is that Claude always has the *rules* in context, has only the *current task's* details in context, and
can pick up after an interruption without me re-explaining anything.

## 1. What is always loaded (persistent context)

| Mechanism | What it holds | Why |
| --- | --- | --- |
| `CLAUDE.md` | Stack, 5 architecture decisions, conventions, testing + git rules, do's/don'ts | Loaded at every session start and survives `/clear` and `/compact` |
| `@docs/PRD.md` import | Every user story and acceptance criterion with ids (US7.5 etc.) | Tests are named by AC id, so Claude can map a failing test to a requirement without being told |
| `@AGENTS.md` import | Next 16 breaking-change warning | Forces a docs lookup in `node_modules/next/dist/docs/` before writing Next code |
| `.claude/settings.json` | Permission allow/ask/deny | Keeps the TDD loop prompt-free without needing to restate "you may run tests" |

Anything that is true for the whole project goes in CLAUDE.md, not in a chat message, because chat messages are
the first thing `/compact` summarises away.

## 2. What is externalised so it can be dropped from context

- **The plan** — Plan mode's output is committed to `docs/plans/us3-chore-rotation.md`. After `/clear` the plan is
  one `Read` away instead of living only in the conversation.
- **Progress** — every TDD step is a commit whose body records the red/green output (`Red: 7 failed - 'splitShares
  is not a function'`). `git log` *is* the progress file; no separate notes to keep in sync.
- **Lessons** — when something bit us (Testing Library cleanup, the `next build` nudge, the broken git ref), the
  fix went into CLAUDE.md in the same feature (`docs: tighten CLAUDE.md after the chore-rotation feature`).

## 3. When to use which command

| Situation | Command | In this project |
| --- | --- | --- |
| Closed the terminal / machine restarted mid-task | `claude --continue` (latest session) or `claude --resume` (pick one) | **Used**, and recorded in [context-demo/03](context-demo/03-continue-compact-clear.txt). The session was interrupted twice ("No response requested" → "继续"), once across a Windows update reboot (OS build 26200 → 26300). The same session resumed with the plan and progress intact, and the first command after the reboot surfaced the zeroed git ref, which was then recovered (session log, 15:48). |
| Finished a feature, starting an unrelated one | `/clear` | **Demonstrated** in [context-demo/03](context-demo/03-continue-compact-clear.txt): after `/clear` the conversation's checkpoint is gone but CLAUDE.md's money rule is still known. The boundary between Part 2 (US3 chores) and Part 3 (US5–7 money) is where to clear. In the main build session the context still had room, so the work ran straight through. |
| Same feature, context filling with test output | `/compact <focus>` | **Demonstrated** in [context-demo/03](context-demo/03-continue-compact-clear.txt): `/compact keep only the TDD checkpoint (cycle, AC id, failing test name)` and the checkpoint survives the summary. In real TDD: `/compact keep the current AC, the failing test name and its error, and the next AC; drop old test output`. Safe mid-TDD because every finished step is already a commit. |
| Quick side question that shouldn't pollute the task | `/btw` | e.g. asking about a Vitest flag without adding it to the TDD thread |
| Check what is using context | `/context` | **Demonstrated** in [context-demo/01](context-demo/01-context.txt): it lists CLAUDE.md, PRD.md and AGENTS.md as loaded memory files. Used before deciding between `/compact` and `/clear` |

## 4. Habits that kept context small

- Pipe long output through `Select-Object -Last N` / `Select-String` so only the summary and failures enter
  context (every test run in the session log does this).
- Run one test file while iterating (`npx vitest run src/lib/domain/settle.test.ts`), the full suite only before a
  commit.
- Read files with `offset`/`limit` when only a section is needed (e.g. reading lines 55–94 of CLAUDE.md before
  editing it).
- Skip subagents when the code base is tiny (Plan mode note at 15:23: "4 source files, already read") — an
  Explore agent would have re-read the same files into a second context.
