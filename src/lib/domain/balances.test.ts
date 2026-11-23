import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { computeBalances, type Expense } from "./balances";
import { DomainError } from "./errors";

const members = ["alex", "sam", "kim"];

const groceries: Expense = {
  id: "e1",
  description: "Groceries",
  paidBy: "alex",
  total: 9000,
  split: { mode: "even" },
};
const internet: Expense = {
  id: "e2",
  description: "Internet",
  paidBy: "sam",
  total: 6000,
  split: { mode: "even", among: ["sam", "kim"] },
};

describe("computeBalances", () => {
  it("AC US6.1: balance is what you paid minus what you owe", () => {
    const b = computeBalances(members, [groceries, internet]);
    // alex: paid 9000, owes 3000 → +6000; sam: paid 6000, owes 3000+3000 → 0; kim: owes 3000+3000 → −6000
    expect(b.alex.balance).toBe(6000);
    expect(b.sam.balance).toBe(0);
    expect(b.kim.balance).toBe(-6000);
  });

  it("AC US6.1: members with no expenses have a zero balance and no lines", () => {
    expect(computeBalances(members, [])).toEqual({
      alex: { balance: 0, lines: [] },
      sam: { balance: 0, lines: [] },
      kim: { balance: 0, lines: [] },
    });
  });

  it("AC US6.3: explains each balance with one line per expense it was part of", () => {
    const b = computeBalances(members, [groceries, internet]);
    expect(b.kim.lines).toEqual([
      { expenseId: "e1", description: "Groceries", paid: 0, owed: 3000, net: -3000 },
      { expenseId: "e2", description: "Internet", paid: 0, owed: 3000, net: -3000 },
    ]);
    // alex was not part of the internet bill, so it doesn't appear in alex's explanation.
    expect(b.alex.lines.map((l) => l.expenseId)).toEqual(["e1"]);
  });

  it("AC US6.3: a payer outside the split still gets a line (paid, owes nothing)", () => {
    const gift: Expense = { id: "e3", description: "Kim's cake", paidBy: "alex", total: 2000, split: { mode: "exact", amounts: { kim: 2000 } } };
    const b = computeBalances(members, [gift]);
    expect(b.alex.lines).toEqual([{ expenseId: "e3", description: "Kim's cake", paid: 2000, owed: 0, net: 2000 }]);
  });

  it("AC US6.1: rejects a payer who is not a household member", () => {
    try {
      computeBalances(members, [{ ...groceries, paidBy: "zed" }]);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(DomainError);
      expect((e as DomainError).code).toBe("UNKNOWN_MEMBER");
    }
  });

  describe("invariants", () => {
    const expensesArb = fc.array(
      fc.record({
        payer: fc.integer({ min: 0, max: 4 }),
        total: fc.integer({ min: 1, max: 500_000 }),
        among: fc.uniqueArray(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 5 }),
      }),
      { maxLength: 20 },
    );
    const ids = ["m0", "m1", "m2", "m3", "m4"];
    const toExpenses = (rows: { payer: number; total: number; among: number[] }[]): Expense[] =>
      rows.map((r, i) => ({
        id: `e${i}`,
        description: `E${i}`,
        paidBy: ids[r.payer],
        total: r.total,
        split: { mode: "even", among: r.among.map((n) => ids[n]) },
      }));

    it("AC US6.2: all balances in a household sum to exactly 0", () => {
      fc.assert(
        fc.property(expensesArb, (rows) => {
          const b = computeBalances(ids, toExpenses(rows));
          expect(ids.reduce((s, id) => s + b[id].balance, 0)).toBe(0);
        }),
      );
    });

    it("AC US6.3: each member's line items add up to their balance", () => {
      fc.assert(
        fc.property(expensesArb, (rows) => {
          const b = computeBalances(ids, toExpenses(rows));
          for (const id of ids) {
            expect(b[id].lines.reduce((s, l) => s + l.net, 0)).toBe(b[id].balance);
            for (const l of b[id].lines) expect(l.net).toBe(l.paid - l.owed);
          }
        }),
      );
    });
  });
});
