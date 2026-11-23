import { DomainError } from "./errors";
import type { Cents } from "./types";

/** Who owes how much of one expense, keyed by member id. Always sums to the expense total. */
export type SplitParts = Record<string, Cents>;

function assertPositiveCents(total: Cents): void {
  if (!Number.isInteger(total) || total <= 0) {
    throw new DomainError("INVALID_AMOUNT", "Amount must be a positive number of cents.");
  }
}

function assertParticipants(participants: readonly string[]): void {
  if (participants.length === 0) {
    throw new DomainError("NO_PARTICIPANTS", "An expense needs at least one participant.");
  }
}

/**
 * Largest-remainder apportionment in pure integer arithmetic (decision 2: no floats on money).
 * Each id gets floor(total × weight / Σweight); the leftover cents go one each to the largest remainders,
 * ties broken by the order of `weights`.
 */
function apportion(total: Cents, weights: readonly (readonly [string, number])[]): SplitParts {
  const sum = weights.reduce((s, [, w]) => s + w, 0);
  const rows = weights.map(([id, w], order) => ({
    id,
    order,
    part: Math.floor((total * w) / sum),
    remainder: (total * w) % sum,
  }));
  let leftover = total - rows.reduce((s, r) => s + r.part, 0);
  for (const r of [...rows].sort((a, b) => b.remainder - a.remainder || a.order - b.order)) {
    if (leftover === 0) break;
    r.part += 1;
    leftover -= 1;
  }
  return Object.fromEntries(rows.map((r) => [r.id, r.part]));
}

/** US5 "even": equal parts; leftover cents go to the first participants, one each. */
export function splitEven(total: Cents, participants: readonly string[]): SplitParts {
  assertPositiveCents(total);
  assertParticipants(participants);
  return apportion(
    total,
    participants.map((id) => [id, 1] as const),
  );
}

/** US5 "shares": parts proportional to whole-number shares, e.g. 2:1:1. */
export function splitShares(total: Cents, shares: Readonly<Record<string, number>>): SplitParts {
  assertPositiveCents(total);
  const entries = Object.entries(shares);
  assertParticipants(entries.map(([id]) => id));
  if (entries.some(([, s]) => !Number.isInteger(s) || s <= 0)) {
    throw new DomainError("INVALID_SHARES", "Shares must be positive whole numbers.");
  }
  return apportion(total, entries);
}

export type SplitRule =
  | { mode: "even"; among?: string[] }
  | { mode: "shares"; shares: Record<string, number> }
  | { mode: "exact"; amounts: Record<string, Cents> };

export function splitExpense(expense: { total: Cents; split: SplitRule }, memberIds: readonly string[]): SplitParts {
  const { total, split } = expense;
  const known = new Set(memberIds);
  const check = (ids: string[]) => {
    for (const id of ids) {
      if (!known.has(id)) throw new DomainError("UNKNOWN_MEMBER", `${id} is not in the household.`);
    }
  };
  if (split.mode === "even") {
    const among = split.among ?? [...memberIds];
    check(among);
    return splitEven(total, among);
  }
  if (split.mode === "shares") {
    check(Object.keys(split.shares));
    return splitShares(total, split.shares);
  }
  assertPositiveCents(total);
  const ids = Object.keys(split.amounts);
  assertParticipants(ids);
  check(ids);
  let sum = 0;
  for (const id of ids) {
    const v = split.amounts[id];
    if (!Number.isInteger(v) || v < 0) throw new DomainError("INVALID_AMOUNT", "Amounts must be whole cents ≥ 0.");
    sum += v;
  }
  if (sum !== total) throw new DomainError("EXACT_MISMATCH", `Amounts add up to ${sum}, not ${total}.`);
  return { ...split.amounts };
}
