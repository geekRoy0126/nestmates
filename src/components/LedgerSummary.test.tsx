import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Expense } from "@/lib/domain/balances";
import type { Member } from "@/lib/domain/types";

import { formatCents, LedgerSummary } from "./LedgerSummary";

const members: Member[] = [
  { id: "alex", name: "Alex" },
  { id: "sam", name: "Sam" },
  { id: "kim", name: "Kim" },
];
const expenses: Expense[] = [
  { id: "e1", description: "Groceries", paidBy: "alex", total: 9000, split: { mode: "even" } },
  { id: "e2", description: "Internet", paidBy: "sam", total: 6000, split: { mode: "even", among: ["sam", "kim"] } },
];

describe("formatCents", () => {
  it.each([
    [0, "$0.00"],
    [5, "$0.05"],
    [123456, "$1,234.56"],
    [-6000, "−$60.00"],
  ])("formats %i as %s", (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });
});

describe("LedgerSummary", () => {
  it("AC US6.1: shows each member's balance with who owes and who is owed", () => {
    render(<LedgerSummary members={members} expenses={expenses} />);
    const balances = screen.getByRole("region", { name: "Balances" });
    expect(within(balances).getByText("Alex").closest("li")).toHaveTextContent("is owed $60.00");
    expect(within(balances).getByText("Sam").closest("li")).toHaveTextContent("is settled");
    expect(within(balances).getByText("Kim").closest("li")).toHaveTextContent("owes $60.00");
  });

  it("AC US6.3: explains a balance line by line", () => {
    render(<LedgerSummary members={members} expenses={expenses} />);
    const kim = within(screen.getByRole("region", { name: "Balances" })).getByText("Kim").closest("li")!;
    expect(within(kim).getByText(/Groceries/)).toHaveTextContent("Groceries: paid $0.00, share $30.00");
    expect(within(kim).getByText(/Internet/)).toHaveTextContent("Internet: paid $0.00, share $30.00");
  });

  it("AC US7.1: lists the settle-up transfers", () => {
    render(<LedgerSummary members={members} expenses={expenses} />);
    const plan = screen.getByRole("region", { name: "Settle up" });
    expect(within(plan).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Kim pays Alex $60.00"]);
  });

  it("says when nobody owes anything", () => {
    render(<LedgerSummary members={members} expenses={[]} />);
    expect(within(screen.getByRole("region", { name: "Settle up" })).getByText("Everyone is settled.")).toBeInTheDocument();
  });
});
