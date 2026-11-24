# HW4 Reflection — Claude Code Workflow & TDD

Ruoyu Wang · CS6983 · Project 3 *Nestmates* (with Qingyu Cheng) · repo `D:\CS6983\nestmates`

## 1. Explore → Plan → Implement → Commit vs. my previous approach

On P2 (HandUp) my workflow was "issue → prompt → PR." We generated 14 issues from the PRD, and under deadline
pressure I had Claude Code build them as 14 stacked PRs. The rules file (`AGENTS.md`) was good, and we did write
tests first for most stories. Our Sprint 2 retro still lists the costs. Merges piled up at the end. Three fixes
rode inside unrelated PRs without their own failing test (`fix(#9)` inside #10's PR). Docs drifted from code.
"The AI needed checking every time." All four have the same root cause: the agent went straight from an issue to
code, and nothing forced it to look first or to agree on a plan with me.

The four-phase workflow changed that in three concrete ways:

**Explore made the design better, not just slower.** Before planning US3 (chore rotation), Claude ran six
read-only calls: Glob, Grep on the PRD, and Grep in the Next 16 docs bundled in `node_modules`. They showed that
`searchParams` is a request-time API needing `<Suspense>` under `cacheComponents`. That one finding changed the
architecture: the page stays static and a client component recomputes the schedule with the same pure function.
On P2 we would have discovered this from a failing build.

**The plan was a contract I could approve.** Plan mode produced a file naming the files, the algorithm, the
property tests and the *exact commit sequence*. I approved it before any code existed, it was committed first
(`58a3604`), and the history follows it almost one for one. Reviewing six planned commits is far easier than
reviewing one large PR. It also fixes P2's "merges piled up" problem at the source: each commit is one concern.

**Commit became a checkpoint, not an afterthought.** Small commits with *why* in the body paid off the first
time something went wrong. A Windows update rebooted the machine mid-session and zeroed `refs/heads/master`.
Because every step was committed, Claude recovered the full history from the reflog in four commands. It also
caught that its own first fix had created a parentless commit. Nothing was lost.

The cost is real: on a trivial change the four phases are ceremony. My rule now is to use Plan mode when a change
touches more than two files or needs a design choice, and to skip it for one-line fixes. Claude itself skipped
Explore subagents for a 4-file repo, and that was the right call.

**TDD through Claude Code** worked best when the red step was treated as evidence. Every `test(red)` commit body
records the actual failure (`7 failed – 'splitShares is not a function'`). That proves the test came first and
that it fails for the right reason. Two moments convinced me it is more than ritual:

- In cycle 6 the PRD story promised the "fewest transfers," but the ACs only said "≤ n − 1," and the simple greedy
  passed. A fast-check property against an independent brute-force oracle failed and shrank the problem to a
  4-person counterexample. We added AC US7.5 to the PRD in the red commit and implemented an exact algorithm. The
  test found a *requirements* bug, not just a code bug.
- While refactoring `computeBalances`, Claude noticed that a payer named `"constructor"` passed the membership
  check. It did not slip the fix into the refactor (exactly our P2 mistake). It went back to red with a new test,
  then green, then refactor. That is the P2 retro's action item ("one concern per PR, each with its own failing
test"), and this time it held without my asking. I have since made it explicit in CLAUDE.md.

Strict TDD did not catch everything. The green `splitShares` passed every test while comparing floating-point
remainders. The refactor that fixed it happened only because CLAUDE.md says "money is integer cents." Tests check
behaviour; the written rules check intent. I need both.

## 2. Context management strategies that worked best

1. **CLAUDE.md as the only place for durable rules, with `@imports`.** `@docs/PRD.md` meant every test could be
   named by AC id (`AC US7.5: …`) without restating requirements in prompts. `@AGENTS.md` forced the Next 16
   docs lookup. I iterated CLAUDE.md twice on purpose: once right after `/init`, whose output only knew
   file-level facts, and once after the first feature, adding the five things it had cost us a step to learn.
   Rules in chat get compacted away; rules in CLAUDE.md survive `/clear` and `/compact`.
2. **Externalising state so context can be dropped.** The plan lives in `docs/plans/`. Progress lives in
   commit bodies. After `/clear`, `git log` plus one `Read` restores everything, so I can clear between features
   without fear.
3. **Resuming instead of re-explaining.** The session was interrupted twice, once across a reboot. Resuming the
   same session (what `claude --continue` / `--resume` do) kept the approved plan and the commit sequence in
   context. My only message was "继续."
4. **Keeping noise out.** Every test run was piped through `Select-Object -Last N`. While iterating, Claude ran
   one test file and ran the full suite only before committing. This, not `/compact`, is what kept a
   ~180-tool-call session usable.
5. **Permissions as context.** The allowlist (tests, lint, `git add/commit`) kept the red-green loop prompt-free.
   The *ask* list (`npm install`, `git push`) is why Claude stopped at `npm audit` instead of upgrading Next
   when a build message told it to.

I recorded all four commands on this repo (`docs/hw4/context-demo/`). `/context` lists CLAUDE.md, PRD.md and
AGENTS.md as loaded memory. After `/compact` with a focus, the TDD checkpoint survives. After `/clear` the
checkpoint is gone, but the CLAUDE.md money rule is still known. That is exactly why durable rules belong in
CLAUDE.md and task state belongs in the conversation and in git.

What I would change: the session got long, and the boundary between Part 2 and Part 3 was the natural `/clear`
point. Next time I'll clear there and `/compact` with an explicit focus ("keep current AC, failing test, next AC")
inside long TDD runs.

## 3. What I'll keep for P3

One plan file per story, committed before code. `test(red)` commits that quote the failure. A property test for
every invariant, with an independent oracle where one is cheap. And a CLAUDE.md update at the end of every
feature, written from what actually went wrong.

*Evidence:* annotated session log `docs/hw4/session-log-annotated.md`; raw log `docs/hw4/session-log-raw.md`;
`git log --oneline` (9 red / 9 green / 6 refactor commits).
