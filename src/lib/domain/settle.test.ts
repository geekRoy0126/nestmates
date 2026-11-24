import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { DomainError } from "./errors";
import { settleUp, type Transfer } from "./settle";

/** Apply transfers to balances: the payer's balance goes up, the receiver's goes down. */
function apply(balances: Record<string, number>, transfers: Transfer[]): Record<string, number> {
  const after = { ...balances };
  for (const t of transfers) {
    after[t.from] += t.amount;
    after[t.to] -= t.amount;
  }
  return after;
}

/**
 * Test oracle, deliberately a different algorithm from the implementation: enumerate every set partition of the
 * non-zero balances and keep the one with the most zero-sum blocks. Minimum transfers = n − blocks.
 */
function minimumTransfers(values: number[]): number {
  const xs = values.filter((v) => v !== 0);
  let best = 0;
  const blocks: number[] = [];
  const visit = (i: number) => {
    if (i === xs.length) {
      if (blocks.every((s) => s === 0)) best = Math.max(best, blocks.length);
      return;
    }
    for (let b = 0; b < blocks.length; b++) {
      blocks[b] += xs[i];
      visit(i + 1);
      blocks[b] -= xs[i];
    }
    blocks.push(xs[i]);
    visit(i + 1);
    blocks.pop();
  };
  visit(0);
  return xs.length === 0 ? 0 : xs.length - best;
}

/** Arbitrary balances for 2–8 members that sum to exactly 0 (what computeBalances guarantees). */
const balancesArb = fc
  .array(fc.integer({ min: -100_000, max: 100_000 }), { minLength: 1, maxLength: 7 })
  .map((xs) => {
    const ids = xs.map((_, i) => `m${i}`);
    const balances: Record<string, number> = Object.fromEntries(xs.map((x, i) => [ids[i], x]));
    balances[`m${xs.length}`] = -xs.reduce((s, x) => s + x, 0);
    return balances;
  });

describe("settleUp", () => {
  it("AC US7.1: one debtor pays one creditor", () => {
    expect(settleUp({ alex: 6000, sam: 0, kim: -6000 })).toEqual([{ from: "kim", to: "alex", amount: 6000 }]);
  });

  it("AC US7.1: nothing to do when everyone is even", () => {
    expect(settleUp({ alex: 0, sam: 0 })).toEqual([]);
  });

  it("AC US7.1: transfers bring every balance to exactly 0", () => {
    fc.assert(
      fc.property(balancesArb, (balances) => {
        const after = apply(balances, settleUp(balances));
        expect(Object.values(after).every((v) => v === 0)).toBe(true);
      }),
    );
  });

  it("AC US7.2: never more than n − 1 transfers for n non-zero balances", () => {
    fc.assert(
      fc.property(balancesArb, (balances) => {
        const nonZero = Object.values(balances).filter((v) => v !== 0).length;
        expect(settleUp(balances).length).toBeLessThanOrEqual(Math.max(0, nonZero - 1));
      }),
    );
  });

  it("AC US7.3: no zero, negative, fractional, or self transfers", () => {
    fc.assert(
      fc.property(balancesArb, (balances) => {
        for (const t of settleUp(balances)) {
          expect(Number.isInteger(t.amount) && t.amount > 0).toBe(true);
          expect(t.from).not.toBe(t.to);
        }
      }),
    );
  });

  it("AC US7.4: deterministic — key order does not change the plan", () => {
    fc.assert(
      fc.property(balancesArb, (balances) => {
        const reversed = Object.fromEntries(Object.entries(balances).reverse());
        expect(settleUp(reversed)).toEqual(settleUp(balances));
      }),
    );
  });

  it("AC US7.5: settles sub-groups that balance on their own separately (4 transfers, not 5)", () => {
    // {a, e, f} and {b, c, d} each sum to 0, so 2 + 2 transfers suffice.
    const balances = { a: 400, b: 600, c: -300, d: -300, e: -200, f: -200 };
    const plan = settleUp(balances);
    expect(plan).toHaveLength(4);
    expect(Object.values(apply(balances, plan)).every((v) => v === 0)).toBe(true);
  });

  it("AC US7.5: uses the minimum possible number of transfers", () => {
    fc.assert(
      fc.property(balancesArb, (balances) => {
        expect(settleUp(balances)).toHaveLength(minimumTransfers(Object.values(balances)));
      }),
    );
  });

  it("AC US1.3: rejects more than 8 members (households have 2–8)", () => {
    const nine = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`m${i}`, i < 8 ? 1 : -8]));
    try {
      settleUp(nine);
      expect.unreachable();
    } catch (e) {
      expect((e as DomainError).code).toBe("TOO_MANY_MEMBERS");
    }
  });

  it("AC US1.3: 8 members is fine", () => {
    const eight = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`m${i}`, i < 7 ? 1 : -7]));
    expect(settleUp(eight)).toHaveLength(7);
  });

  it("rejects balances that don't sum to 0", () => {
    try {
      settleUp({ a: 100, b: -50 });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(DomainError);
      expect((e as DomainError).code).toBe("UNBALANCED");
    }
  });
});
