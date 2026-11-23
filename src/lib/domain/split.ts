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
