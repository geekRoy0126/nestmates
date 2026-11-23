import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { assignWeek, scheduleWeeks } from "./chores";
import type { Chore, Member } from "./types";

// Households of 2–8 members (PRD US1) with 0–8 chores of weight 1–5 (US2).
const membersArb = fc
  .uniqueArray(fc.integer({ min: 1, max: 99 }), { minLength: 2, maxLength: 8 })
  .map((ids): Member[] => ids.map((n) => ({ id: `m${n}`, name: `M${n}` })));

const choresArb = fc
  .uniqueArray(fc.integer({ min: 1, max: 99 }), { maxLength: 8 })
  .chain((ids) =>
    fc.tuple(...ids.map((n) => fc.integer({ min: 1, max: 5 }).map((weight): Chore => ({ id: `c${n}`, name: `C${n}`, weight })))),
  );

const householdArb = fc.tuple(membersArb, choresArb).chain(([members, chores]) =>
  fc.record({
    members: fc.constant(members),
    chores: fc.constant(chores as Chore[]),
    awayByWeek: fc.array(fc.subarray(members.map((m) => m.id)), { minLength: 1, maxLength: 6 }),
  }),
);

describe("chore rotation invariants", () => {
  it("every chore appears exactly once per week", () => {
    fc.assert(
      fc.property(householdArb, ({ members, chores, awayByWeek }) => {
        const { weeks } = scheduleWeeks({ members, chores, awayByWeek });
        for (const week of weeks) {
          expect(week.map((a) => a.choreId).sort()).toEqual(chores.map((c) => c.id).sort());
        }
      }),
    );
  });

  it("never assigns a chore to someone who is away, and only leaves chores unassigned when everyone is", () => {
    fc.assert(
      fc.property(householdArb, ({ members, chores, awayByWeek }) => {
        const { weeks } = scheduleWeeks({ members, chores, awayByWeek });
        weeks.forEach((week, i) => {
          const away = new Set(awayByWeek[i]);
          const everyoneAway = members.every((m) => away.has(m.id));
          for (const a of week) {
            if (a.memberId === null) expect(everyoneAway).toBe(true);
            else expect(away.has(a.memberId)).toBe(false);
          }
        });
      }),
    );
  });

  it("with nobody away, the points gap never exceeds the heaviest chore", () => {
    fc.assert(
      fc.property(membersArb, choresArb, fc.integer({ min: 1, max: 10 }), (members, chores, n) => {
        const { points } = scheduleWeeks({ members, chores, awayByWeek: Array.from({ length: n }, () => []) });
        const values = members.map((m) => points[m.id]);
        const maxWeight = Math.max(0, ...chores.map((c) => c.weight));
        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(maxWeight);
      }),
    );
  });

  it("total points added equal the weight of the chores actually assigned", () => {
    fc.assert(
      fc.property(householdArb, ({ members, chores, awayByWeek }) => {
        const { weeks, points } = scheduleWeeks({ members, chores, awayByWeek });
        const weightOf = new Map(chores.map((c) => [c.id, c.weight]));
        const assigned = weeks.flat().filter((a) => a.memberId !== null);
        const total = members.reduce((s, m) => s + points[m.id], 0);
        expect(total).toBe(assigned.reduce((s, a) => s + weightOf.get(a.choreId)!, 0));
      }),
    );
  });

  it("is deterministic: chore input order does not change the result", () => {
    fc.assert(
      fc.property(householdArb, ({ members, chores, awayByWeek }) => {
        const forward = scheduleWeeks({ members, chores, awayByWeek });
        const reversed = scheduleWeeks({ members, chores: [...chores].reverse(), awayByWeek });
        expect(reversed).toEqual(forward);
      }),
    );
  });
});

describe("scheduleWeeks", () => {
  const members: Member[] = [
    { id: "m1", name: "Alex" },
    { id: "m2", name: "Sam" },
  ];
  const chores: Chore[] = [
    { id: "c-bath", name: "Bathroom", weight: 3 },
    { id: "c-trash", name: "Trash", weight: 1 },
  ];

  it("carries points across weeks so the heavy chore rotates", () => {
    const { weeks, points } = scheduleWeeks({ members, chores, awayByWeek: [[], []] });
    expect(weeks[0].find((a) => a.choreId === "c-bath")?.memberId).toBe("m1");
    expect(weeks[1].find((a) => a.choreId === "c-bath")?.memberId).toBe("m2");
    expect(points).toEqual({ m1: 4, m2: 4 });
  });

  it("matches assignWeek for a single week", () => {
    const one = scheduleWeeks({ members, chores, awayByWeek: [["m2"]] });
    expect(one.weeks[0]).toEqual(assignWeek({ members, chores, away: ["m2"] }).assignments);
  });

  it("returns zeroed points for every member when there are no weeks", () => {
    expect(scheduleWeeks({ members, chores, awayByWeek: [] })).toEqual({ weeks: [], points: { m1: 0, m2: 0 } });
  });
});
