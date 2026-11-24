import { describe, expect, it } from "vitest";

import { computeBalances } from "@/lib/domain/balances";
import { scheduleWeeks } from "@/lib/domain/chores";
import { settleUp } from "@/lib/domain/settle";

import { DEMO_WEEKS, demoChores, demoExpenses, demoMembers } from "./household";

describe("demo household", () => {
  const ids = demoMembers.map((m) => m.id);

  it("passes every domain check the pages rely on", () => {
    expect(() => scheduleWeeks({ members: demoMembers, chores: demoChores, awayByWeek: Array(DEMO_WEEKS).fill([]) })).not.toThrow();
    const balances = computeBalances(ids, demoExpenses);
    expect(() => settleUp(Object.fromEntries(ids.map((id) => [id, balances[id].balance])))).not.toThrow();
  });
});
