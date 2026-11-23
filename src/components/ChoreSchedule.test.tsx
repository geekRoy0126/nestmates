import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Chore, Member } from "@/lib/domain/types";

import { ChoreSchedule } from "./ChoreSchedule";

const members: Member[] = [
  { id: "m1", name: "Alex" },
  { id: "m2", name: "Sam" },
];
const chores: Chore[] = [
  { id: "c-bath", name: "Bathroom", weight: 3 },
  { id: "c-trash", name: "Trash", weight: 1 },
];

const week = (n: number) => screen.getByRole("region", { name: `Week ${n}` });
const assigneeOf = (n: number, chore: string) =>
  within(week(n)).getByText(chore).closest("li")!.lastElementChild!.textContent;

describe("ChoreSchedule", () => {
  it("shows who does each chore every week, rotating the heavy chore", () => {
    render(<ChoreSchedule members={members} chores={chores} weeks={2} />);
    expect(assigneeOf(1, "Bathroom")).toBe("Alex");
    expect(assigneeOf(2, "Bathroom")).toBe("Sam");
    expect(screen.getByTestId("points-m1")).toHaveTextContent("4");
  });

  it("moves a member's chores to others when they are marked away", () => {
    render(<ChoreSchedule members={members} chores={chores} weeks={1} />);
    fireEvent.click(within(week(1)).getByLabelText("Alex away"));
    expect(assigneeOf(1, "Bathroom")).toBe("Sam");
    expect(assigneeOf(1, "Trash")).toBe("Sam");
  });

  it("flags chores as unassigned when everyone is away", () => {
    render(<ChoreSchedule members={members} chores={chores} weeks={1} />);
    fireEvent.click(within(week(1)).getByLabelText("Alex away"));
    fireEvent.click(within(week(1)).getByLabelText("Sam away"));
    expect(within(week(1)).getAllByText("Unassigned")).toHaveLength(2);
  });

  it("explains each pick in the row tooltip", () => {
    render(<ChoreSchedule members={members} chores={chores} weeks={1} />);
    expect(within(week(1)).getByText("Trash").closest("li")).toHaveAttribute("title", "fewest points: Sam 0 (Alex 3)");
  });
});
