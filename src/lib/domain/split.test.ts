import { describe, expect, it } from "vitest";

import { DomainError } from "./errors";
import { splitEven } from "./split";

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
