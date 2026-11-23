import { DomainError } from "./errors";
import type { Cents } from "./types";

export type Transfer = { from: string; to: string; amount: Cents };

export function settleUp(balances: Record<string, Cents>): Transfer[] {
  const sum = Object.values(balances).reduce((s, v) => s + v, 0);
  if (sum !== 0) throw new DomainError("UNBALANCED", `Balances sum to ${sum}, not 0.`);

  const ids = Object.keys(balances).sort();
  const creditors = ids.filter((id) => balances[id] > 0).map((id) => ({ id, left: balances[id] }));
  const debtors = ids.filter((id) => balances[id] < 0).map((id) => ({ id, left: -balances[id] }));

  const transfers: Transfer[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].left, debtors[d].left);
    transfers.push({ from: debtors[d].id, to: creditors[c].id, amount });
    creditors[c].left -= amount;
    debtors[d].left -= amount;
    if (creditors[c].left === 0) c++;
    if (debtors[d].left === 0) d++;
  }
  return transfers;
}
