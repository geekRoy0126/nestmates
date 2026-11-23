import { DomainError } from "./errors";
import { splitExpense, type SplitRule } from "./split";
import type { Cents } from "./types";

export type Expense = {
  id: string;
  description: string;
  paidBy: string;
  total: Cents;
  split: SplitRule;
};

export type BalanceLine = {
  expenseId: string;
  description: string;
  paid: Cents;
  owed: Cents;
  net: Cents;
};

export type Balance = {
  balance: Cents;
  lines: BalanceLine[];
};

export function computeBalances(memberIds: string[], expenses: Expense[]): Record<string, Balance> {
  const result: Record<string, Balance> = {};
  for (const id of memberIds) result[id] = { balance: 0, lines: [] };

  for (const e of expenses) {
    if (!memberIds.includes(e.paidBy)) throw new DomainError("UNKNOWN_MEMBER", `${e.paidBy} is not in the household.`);
    const parts = splitExpense(e, memberIds);
    for (const id of memberIds) {
      const paid = id === e.paidBy ? e.total : 0;
      const owed = parts[id] ?? 0;
      if (paid === 0 && owed === 0) continue;
      result[id].lines.push({ expenseId: e.id, description: e.description, paid, owed, net: paid - owed });
      result[id].balance += paid - owed;
    }
  }
  return result;
}
