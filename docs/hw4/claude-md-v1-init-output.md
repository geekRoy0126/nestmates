# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — run all Vitest tests once
- `npx vitest run path/to/file.test.ts` — run a single test file; add `-t "name"` to run one test
- `npm run test:coverage` — coverage (v8) over `src/lib/**`

## Architecture

- Next.js 16 App Router app under `src/app/`; path alias `@/*` → `src/*`.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`; CSS goes through Tailwind v4 via the
  `@tailwindcss/turbopack` loader.
- Tests: Vitest in a jsdom environment with Testing Library (`vitest.setup.ts` loads jest-dom matchers). Test files
  live next to the code as `src/**/*.test.{ts,tsx}`. Coverage thresholds are enforced for `src/lib/domain/**`.
- `AGENTS.md` (managed by `next dev`) warns that this Next.js version has breaking changes: read the relevant guide
  in `node_modules/next/dist/docs/` before writing Next.js code.
- Product requirements live in `docs/PRD.md`.
