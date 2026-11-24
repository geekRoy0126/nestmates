import { DomainError } from "./errors";
import type { Cents } from "./types";

/** PRD US1: 2–8 members. Also what keeps the O(3^n) partition search and 32-bit masks safe. */
export const MAX_HOUSEHOLD_SIZE = 8;

/** `from` pays `to` `amount` cents. */
export type Transfer = { from: string; to: string; amount: Cents };

/** Two-pointer settle of one zero-sum group: every transfer clears someone, so k people need ≤ k − 1 transfers. */
function settleGroup(ids: readonly string[], balances: Readonly<Record<string, Cents>>): Transfer[] {
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

/** sums[mask] = total of the values whose bits are set in mask. */
function subsetSums(values: readonly number[]): number[] {
  const sums = new Array<number>(1 << values.length).fill(0);
  for (let mask = 1; mask < sums.length; mask++) {
    const low = mask & -mask;
    sums[mask] = sums[mask ^ low] + values[31 - Math.clz32(low)];
  }
  return sums;
}

/**
 * Split all indices into the largest number of groups that each sum to 0 (as bitmasks).
 * DP over zero-sum masks; each step peels off a zero-sum sub-group containing the mask's lowest bit, so every
 * partition is considered once. O(3^n), fine for n ≤ 8 (PRD US1).
 */
function largestZeroSumPartition(values: readonly number[]): number[] {
  const sums = subsetSums(values);
  const full = sums.length - 1;
  const best = new Array<number>(sums.length).fill(-1); // -1: not a zero-sum mask
  const first = new Array<number>(sums.length).fill(0);
  best[0] = 0;

  for (let mask = 1; mask <= full; mask++) {
    if (sums[mask] !== 0) continue;
    const low = mask & -mask;
    for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
      const rest = mask ^ sub;
      if (!(sub & low) || sums[sub] !== 0 || best[rest] < 0) continue;
      if (best[rest] + 1 > best[mask]) {
        best[mask] = best[rest] + 1;
        first[mask] = sub;
      }
    }
  }

  const groups: number[] = [];
  for (let mask = full; mask > 0; mask ^= first[mask]) groups.push(first[mask]);
  return groups;
}

/**
 * US7: the fewest transfers that bring every balance to 0.
 * Minimum = (non-zero balances) − (most groups that settle among themselves); each group is then settled with
 * ≤ size − 1 transfers. Ids are sorted first, so the plan does not depend on key order.
 */
export function settleUp(balances: Readonly<Record<string, Cents>>): Transfer[] {
  const sum = Object.values(balances).reduce((s, v) => s + v, 0);
  if (sum !== 0) throw new DomainError("UNBALANCED", `Balances sum to ${sum}, not 0.`);
  if (Object.keys(balances).length > MAX_HOUSEHOLD_SIZE) {
    throw new DomainError("TOO_MANY_MEMBERS", `A household has at most ${MAX_HOUSEHOLD_SIZE} members.`);
  }

  const ids = Object.keys(balances)
    .sort()
    .filter((id) => balances[id] !== 0);

  return largestZeroSumPartition(ids.map((id) => balances[id])).flatMap((mask) =>
    settleGroup(
      ids.filter((_, i) => mask & (1 << i)),
      balances,
    ),
  );
}
