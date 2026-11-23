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

/** US5 "even": equal parts; the `total mod n` leftover cents go to the first participants, one each. */
export function splitEven(total: Cents, participants: readonly string[]): SplitParts {
  assertPositiveCents(total);
  assertParticipants(participants);

  const base = Math.floor(total / participants.length);
  const leftover = total % participants.length;
  return Object.fromEntries(participants.map((id, i) => [id, base + (i < leftover ? 1 : 0)]));
}

export function splitShares(total: Cents, shares: Record<string, number>): SplitParts {
  assertPositiveCents(total);
  const ids = Object.keys(shares);
  assertParticipants(ids);
  for (const id of ids) {
    if (!Number.isInteger(shares[id]) || shares[id] <= 0) {
      throw new DomainError("INVALID_SHARES", "Shares must be positive whole numbers.");
    }
  }
  const totalShares = ids.reduce((s, id) => s + shares[id], 0);
  const parts: SplitParts = {};
  const remainders: { id: string; rem: number; order: number }[] = [];
  let assigned = 0;
  ids.forEach((id, order) => {
    const exact = (total * shares[id]) / totalShares;
    parts[id] = Math.floor(exact);
    assigned += parts[id];
    remainders.push({ id, rem: exact - Math.floor(exact), order });
  });
  remainders.sort((a, b) => b.rem - a.rem || a.order - b.order);
  for (let i = 0; i < total - assigned; i++) parts[remainders[i].id] += 1;
  return parts;
}
