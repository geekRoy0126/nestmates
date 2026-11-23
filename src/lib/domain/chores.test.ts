import { describe, expect, it } from "vitest";

import { assignWeek } from "./chores";
import { DomainError } from "./errors";
import type { Chore, Member } from "./types";

const alex: Member = { id: "m1", name: "Alex" };
const sam: Member = { id: "m2", name: "Sam" };
const kim: Member = { id: "m3", name: "Kim" };
const members = [alex, sam, kim];

const bathroom: Chore = { id: "c-bath", name: "Bathroom", weight: 3 };
const dishes: Chore = { id: "c-dish", name: "Dishes", weight: 2 };
const trash: Chore = { id: "c-trash", name: "Trash", weight: 1 };

const memberOf = (r: ReturnType<typeof assignWeek>, choreId: string) =>
  r.assignments.find((a) => a.choreId === choreId)?.memberId;

describe("assignWeek", () => {
  it("AC US3.a: assigns every chore to exactly one member", () => {
    const r = assignWeek({ members, chores: [trash, dishes, bathroom] });
    expect(r.assignments.map((a) => a.choreId).sort()).toEqual(["c-bath", "c-dish", "c-trash"]);
    expect(r.assignments.every((a) => a.memberId !== null)).toBe(true);
  });

  it("AC US3.a: skips members marked away", () => {
    const r = assignWeek({ members, chores: [bathroom, dishes, trash], away: ["m1"] });
    expect(r.assignments.map((a) => a.memberId)).not.toContain("m1");
  });

  it("AC US3.b: gives each chore to the member with the fewest points", () => {
    const r = assignWeek({ members, chores: [trash], points: { m1: 4, m2: 1, m3: 2 } });
    expect(memberOf(r, "c-trash")).toBe("m2");
  });

  it("AC US3.b: places heavier chores first and carries points within the week", () => {
    // Bathroom (3) → Alex, Dishes (2) → Sam, Trash (1) → Kim, regardless of input order.
    const r = assignWeek({ members, chores: [trash, dishes, bathroom] });
    expect(r.assignments.map((a) => a.choreId)).toEqual(["c-bath", "c-dish", "c-trash"]);
    expect(r.assignments.map((a) => a.memberId)).toEqual(["m1", "m2", "m3"]);
    expect(r.points).toEqual({ m1: 3, m2: 2, m3: 1 });
  });

  it("AC US3.b: a member who already has points is skipped until others catch up", () => {
    const r = assignWeek({ members: [alex, sam], chores: [dishes, trash], points: { m1: 0, m2: 0 } });
    // Dishes → Alex (tie, join order); Trash → Sam (0 < 2).
    expect(memberOf(r, "c-dish")).toBe("m1");
    expect(memberOf(r, "c-trash")).toBe("m2");
  });

  it("AC US3.c: breaks ties by join order", () => {
    const r = assignWeek({ members: [kim, alex, sam], chores: [trash] });
    expect(memberOf(r, "c-trash")).toBe("m3");
  });

  it("AC US3.c: orders equal-weight chores by id so output is stable", () => {
    const a: Chore = { id: "c-a", name: "A", weight: 2 };
    const b: Chore = { id: "c-b", name: "B", weight: 2 };
    const r1 = assignWeek({ members, chores: [b, a] });
    const r2 = assignWeek({ members, chores: [a, b] });
    expect(r1).toEqual(r2);
  });

  it("AC US3.d: leaves chores unassigned and flagged when everyone is away", () => {
    const r = assignWeek({ members, chores: [bathroom, trash], away: ["m1", "m2", "m3"] });
    expect(r.assignments).toEqual([
      { choreId: "c-bath", memberId: null, reason: "nobody available" },
      { choreId: "c-trash", memberId: null, reason: "nobody available" },
    ]);
  });

  it("explains each pick with the points it compared", () => {
    const r = assignWeek({ members, chores: [trash], points: { m1: 5, m2: 2, m3: 3 } });
    expect(r.assignments[0].reason).toBe("fewest points: Sam 2 (Alex 5, Kim 3)");
  });

  it("does not mutate its inputs", () => {
    const chores = [trash, bathroom];
    const points = { m1: 1, m2: 0, m3: 0 };
    assignWeek({ members, chores, points });
    expect(chores).toEqual([trash, bathroom]);
    expect(points).toEqual({ m1: 1, m2: 0, m3: 0 });
  });

  describe("validation", () => {
    const codeOf = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return e instanceof DomainError ? e.code : "not a DomainError";
      }
      return "did not throw";
    };

    it.each([0, 6, -1, 2.5, Number.NaN])("rejects weight %s (US2: integers 1–5)", (weight) => {
      expect(codeOf(() => assignWeek({ members, chores: [{ id: "x", name: "X", weight }] }))).toBe("INVALID_WEIGHT");
    });

    it("rejects an empty household", () => {
      expect(codeOf(() => assignWeek({ members: [], chores: [trash] }))).toBe("NO_MEMBERS");
    });

    it("rejects duplicate member ids", () => {
      expect(codeOf(() => assignWeek({ members: [alex, { ...alex, name: "Al" }], chores: [] }))).toBe(
        "DUPLICATE_MEMBER",
      );
    });

    it("rejects an away id that is not a member", () => {
      expect(codeOf(() => assignWeek({ members, chores: [trash], away: ["ghost"] }))).toBe("UNKNOWN_MEMBER");
    });
  });
});
