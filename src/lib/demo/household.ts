import type { Expense } from "@/lib/domain/balances";
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

// One month of shared costs, one of each split mode (PRD US5).
export const demoExpenses: Expense[] = [
  { id: "e-rent", description: "Rent", paidBy: "m-alex", total: 270000, split: { mode: "shares", shares: { "m-alex": 2, "m-sam": 1, "m-kim": 1 } } },
  { id: "e-power", description: "Electricity", paidBy: "m-sam", total: 8737, split: { mode: "even" } },
  { id: "e-costco", description: "Costco run", paidBy: "m-kim", total: 15420, split: { mode: "exact", amounts: { "m-alex": 4210, "m-sam": 6000, "m-kim": 5210 } } },
  { id: "e-pizza", description: "Pizza night", paidBy: "m-sam", total: 4200, split: { mode: "even", among: ["m-sam", "m-kim"] } },
];
