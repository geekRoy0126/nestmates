# Plan — US3 Fair automatic chore rotation (HW4 Part 2)

## Context
HW4 Part 2 requires one real P3 feature built with Explore → Plan → Implement → Commit, with ≥3 commits showing the
pattern. US3 (docs/PRD.md) was chosen: it is the core "fairness" promise of Nestmates and is pure logic plus one page.

Explore findings (Glob/Grep/Read, this session):
- `src/` contains only the create-next-app scaffold (`src/app/page.tsx`, `layout.tsx`); no domain code, no types, no
  `DomainError` yet → this feature creates the domain layer CLAUDE.md describes.
- US3 ACs: (a) each chore → exactly one *available* member, away members skipped; (b) goes to available member with
  fewest cumulative effort points, heavier chores placed first; (c) deterministic tie-break by join order;
  (d) nobody available → chore unassigned and flagged.
- US2 constrains weights to integers 1–5.
- `next.config.ts` has `cacheComponents: true`; Next 16 docs (`node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`,
  `.../file-conventions/page.md`) say `searchParams` is a request-time API needing `<Suspense>`. Avoid it: the page
  stays static and a client component recomputes the schedule with the same pure function.
- No DB/auth yet (planned in CLAUDE.md) → page uses a seed household in `src/lib/demo/household.ts`.

## Design
`src/lib/domain/errors.ts` — `class DomainError extends Error { code }` (codes: `INVALID_WEIGHT`, `DUPLICATE_MEMBER`,
`UNKNOWN_MEMBER`, `NO_MEMBERS`).

`src/lib/domain/types.ts` — `Member {id, name}` (array order = join order), `Chore {id, name, weight}`,
`Points = Record<memberId, number>`.

`src/lib/domain/chores.ts`
- `assignWeek({members, chores, away, points})` → `{ assignments: {choreId, memberId|null, reason}[], points }`
  1. validate (weights int 1–5, unique member ids, away ⊆ members, ≥1 member)
  2. sort chores by weight desc, then id (heavier first, deterministic)
  3. for each chore pick the available member with min points; tie → earlier join order; add weight
  4. no available member → `memberId: null`, reason `"nobody available"`
  5. `reason` text explains the pick, e.g. `"fewest points: Sam 2 (Alex 5, Kim 3)"` (PRD decision 5: explainable)
  Never mutates inputs.
- `scheduleWeeks({members, chores, awayByWeek: string[][], points?})` → folds `assignWeek` across weeks, carrying points.

`src/components/ChoreSchedule.tsx` (`"use client"`) — renders a 4-week table for the seed household; checkbox per
member/week toggles "away" and recomputes via `scheduleWeeks`; unassigned chores shown with a warning badge;
running point totals per member.

`src/app/chores/page.tsx` — static Server Component rendering `<ChoreSchedule>` with seed data; home page links to it.

## Tests (Vitest, `src/lib/domain/chores.test.ts`, names carry AC ids)
- examples for each AC (a)–(d) and each validation error
- fast-check properties: every chore appears exactly once per week; assigned member is never away; with nobody away
  and zero starting points, `max(points) − min(points) ≤ max weight` after any number of weeks; same input → same output
- `src/components/ChoreSchedule.test.tsx`: renders assignments; toggling a member away moves their chores; all-away
  shows "Unassigned"

## Commits (Plan → Implement → Commit, one logical step each)
1. `docs(plan): plan US3 chore rotation` — this plan + explore notes to `docs/plans/us3-chore-rotation.md`
2. `feat(domain): add domain types and DomainError`
3. `feat(chores): assign one week of chores by fewest effort points` (+ example tests)
4. `feat(chores): schedule multiple weeks and cover invariants with fast-check`
5. `feat(ui): chore schedule page with away toggles` (+ component test, home link)
6. `docs: tighten CLAUDE.md after the chore-rotation feature` (second CLAUDE.md iteration)

## Verification
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:coverage` (domain thresholds) all green
- `npm run build` succeeds (checks the Cache Components constraint)
- `npm run dev` → open `/chores`, toggle away boxes, confirm reassignment and unassigned warning

## After this (rest of HW4, not part of this approval's code)
Part 3: US5–US7 (split → balances → settle-up) in strict TDD with `test(red)` / `feat(green)` / `refactor` commits
per AC. Part 4: annotated session log from this session's transcript + 1–2 page reflection, copied with the repo
link into `D:\CS6983\HW4-Submission\`.
