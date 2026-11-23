import type { Chore, Member } from "@/lib/domain/types";

// Seed data until persistence (Prisma/Neon) is wired up — see CLAUDE.md "Tech stack".
export const demoMembers: Member[] = [
  { id: "m-alex", name: "Alex" },
  { id: "m-sam", name: "Sam" },
  { id: "m-kim", name: "Kim" },
];

export const demoChores: Chore[] = [
  { id: "c-bathroom", name: "Clean bathroom", weight: 3 },
  { id: "c-kitchen", name: "Wipe kitchen", weight: 2 },
  { id: "c-vacuum", name: "Vacuum", weight: 2 },
  { id: "c-trash", name: "Take out trash", weight: 1 },
];

export const DEMO_WEEKS = 4;
