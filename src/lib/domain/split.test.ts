import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { DomainError } from "./errors";
import { splitEven, splitShares } from "./split";

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : "not a DomainError";
  }
  return "did not throw";
};

describe("splitEven", () => {
  it("AC US5.2: splits an amount that divides evenly", () => {
    expect(splitEven(9000, ["a", "b", "c"])).toEqual({ a: 3000, b: 3000, c: 3000 });
  });

  it("AC US5.2: gives leftover cents one at a time, in participant order", () => {
    // $10.00 / 3 = 333.33… → 334, 333, 333
    expect(splitEven(1000, ["a", "b", "c"])).toEqual({ a: 334, b: 333, c: 333 });
    // 1001 / 3 → 334, 334, 333
    expect(splitEven(1001, ["a", "b", "c"])).toEqual({ a: 334, b: 334, c: 333 });
  });

  it("AC US5.2: parts always add up to exactly the total", () => {
    const parts = splitEven(8420, ["a", "b", "c", "d", "e", "f", "g"]);
    expect(Object.values(parts).reduce((s, v) => s + v, 0)).toBe(8420);
  });

  it("AC US5.1: rejects amounts that are not positive whole cents", () => {
    for (const total of [0, -100, 10.5, Number.NaN]) {
      expect(codeOf(() => splitEven(total, ["a"]))).toBe("INVALID_AMOUNT");
    }
  });

  it("AC US5.4: rejects an empty participant list", () => {
    expect(codeOf(() => splitEven(100, []))).toBe("NO_PARTICIPANTS");
  });
});

describe("splitShares", () => {
  it("AC US5.3: splits by shares (2:1:1)", () => {
    expect(splitShares(1000, { a: 2, b: 1, c: 1 })).toEqual({ a: 500, b: 250, c: 250 });
  });

  it("AC US5.2: gives leftover cents to the largest fractional remainders first", () => {
    // 1000 × 2/3 = 666.67, 1000 × 1/3 = 333.33 → the extra cent goes to a.
    expect(splitShares(1000, { a: 2, b: 1 })).toEqual({ a: 667, b: 333 });
    // 2:1:3 of 1000 = 333.33, 166.67, 500 → the extra cent goes to b (.67 beats .33).
    expect(splitShares(1000, { a: 2, b: 1, c: 3 })).toEqual({ a: 333, b: 167, c: 500 });
  });

  it("AC US5.2: breaks equal remainders by participant order", () => {
    expect(splitShares(100, { a: 1, b: 1, c: 1 })).toEqual({ a: 34, b: 33, c: 33 });
  });

  it("AC US5.3: equal shares give the same result as an even split", () => {
    expect(splitShares(8420, { a: 1, b: 1, c: 1, d: 1 })).toEqual(splitEven(8420, ["a", "b", "c", "d"]));
  });

  it("AC US5.2: parts add up to exactly the total for any shares", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 8 }),
        (total, shares) => {
          const parts = splitShares(total, Object.fromEntries(shares.map((s, i) => [`m${i}`, s])));
          expect(Object.values(parts).reduce((s, v) => s + v, 0)).toBe(total);
          expect(Object.values(parts).every((v) => Number.isInteger(v) && v >= 0)).toBe(true);
        },
      ),
    );
  });

  it("AC US5.4: rejects shares that are not positive whole numbers", () => {
    for (const share of [0, -1, 1.5]) {
      expect(codeOf(() => splitShares(100, { a: 1, b: share }))).toBe("INVALID_SHARES");
    }
  });

  it("AC US5.4: rejects an empty share map", () => {
    expect(codeOf(() => splitShares(100, {}))).toBe("NO_PARTICIPANTS");
  });
});
