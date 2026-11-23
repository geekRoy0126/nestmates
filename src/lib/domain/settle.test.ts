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
