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

/** One expense's effect on one member — the "why" behind a balance (decision 5). */
export type BalanceLine = {
  expenseId: string;
  description: string;
  paid: Cents;
  owed: Cents;
  /** paid − owed */
  net: Cents;
};

export type Balance = {
  /** Positive: the household owes this member. Negative: this member owes the household. */
  balance: Cents;
  lines: BalanceLine[];
};

/**
 * US6: each member's balance (paid − owed) with one line per expense they paid for or took part in.
 * Balances always sum to 0 because every split sums to its expense total.
 */
export function computeBalances(memberIds: readonly string[], expenses: readonly Expense[]): Record<string, Balance> {
  // A Map, not a plain object, so ids such as "constructor" or "__proto__" are just ids.
  const byMember = new Map<string, Balance>(memberIds.map((id) => [id, { balance: 0, lines: [] }]));

  for (const expense of expenses) {
    if (!byMember.has(expense.paidBy)) {
      throw new DomainError("UNKNOWN_MEMBER", `${expense.paidBy} is not in the household.`);
    }
    const parts = new Map(Object.entries(splitExpense(expense, memberIds)));

    for (const [id, account] of byMember) {
      const paid = id === expense.paidBy ? expense.total : 0;
      const owed = parts.get(id) ?? 0;
      if (paid === 0 && owed === 0) continue;
      const net = paid - owed;
      account.lines.push({ expenseId: expense.id, description: expense.description, paid, owed, net });
      account.balance += net;
    }
  }
  return Object.fromEntries(byMember);
}
