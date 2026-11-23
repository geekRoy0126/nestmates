import { DomainError } from "./errors";
import type { Cents } from "./types";

export type Transfer = { from: string; to: string; amount: Cents };

function settleGroup(ids: string[], balances: Record<string, Cents>): Transfer[] {
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

export function settleUp(balances: Record<string, Cents>): Transfer[] {
  const sum = Object.values(balances).reduce((s, v) => s + v, 0);
  if (sum !== 0) throw new DomainError("UNBALANCED", `Balances sum to ${sum}, not 0.`);

  const ids = Object.keys(balances)
    .sort()
    .filter((id) => balances[id] !== 0);
  const n = ids.length;
  const full = (1 << n) - 1;

  const sums = new Array<number>(1 << n).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    sums[mask] = sums[mask ^ low] + balances[ids[31 - Math.clz32(low)]];
  }

  // best[mask] = most zero-sum groups that mask (itself zero-sum) splits into; pick[mask] = first group.
  const best = new Array<number>(1 << n).fill(-1);
  const pick = new Array<number>(1 << n).fill(0);
  best[0] = 0;
  for (let mask = 1; mask <= full; mask++) {
    if (sums[mask] !== 0) continue;
    const low = mask & -mask;
    for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
      if (!(sub & low) || sums[sub] !== 0 || best[mask ^ sub] < 0) continue;
      if (best[mask ^ sub] + 1 > best[mask]) {
        best[mask] = best[mask ^ sub] + 1;
        pick[mask] = sub;
      }
    }
  }

  const transfers: Transfer[] = [];
  for (let mask = full; mask > 0; mask ^= pick[mask]) {
    const group = ids.filter((_, i) => pick[mask] & (1 << i));
    transfers.push(...settleGroup(group, balances));
  }
  return transfers;
}
