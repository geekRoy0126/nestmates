# Context-management demo (recorded 2026-11-23)

Real Claude Code CLI runs (`claude 2.1.331`, `--model haiku`, non-interactive `-p`) in this repo. Each file shows
the exact command and its unedited output (only the repeated "workspace not trusted" warning line is filtered).

| File | What it proves |
| --- | --- |
| [01-context.txt](01-context.txt) | `/context` in a fresh session lists **CLAUDE.md, docs/PRD.md and AGENTS.md as loaded memory files**, so the two `@imports` work. Only 10 tokens of messages; everything else is fixed overhead. |
| [02-claude-md-loaded.txt](02-claude-md-loaded.txt) | With tools forbidden, a fresh session still answers the money rule, the TDD commit naming and the imported docs: CLAUDE.md is in context without being read. |
| [03-continue-compact-clear.txt](03-continue-compact-clear.txt) | **`--continue`** resumes the last session (recalls the TDD checkpoint). **`/compact <focus>`** shrinks the conversation to a summary (Messages ≈ 8k) and the focused checkpoint survives. **`/clear`** drops the conversation (checkpoint gone), while CLAUDE.md is reloaded (the money rule is still known). |

The "workspace has not been trusted" warning means the allowlist in `.claude/settings.json` only takes effect after
the trust dialog is accepted once in an interactive session. That is intended: Claude Code won't apply a repo's
own permission grants until the user trusts the folder.
