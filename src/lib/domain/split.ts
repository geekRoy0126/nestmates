import { DomainError } from "./errors";

export function splitEven(total: number, participants: string[]): Record<string, number> {
  if (!Number.isInteger(total) || total <= 0) {
    throw new DomainError("INVALID_AMOUNT", "Amount must be a positive number of cents.");
  }
  if (participants.length === 0) {
    throw new DomainError("NO_PARTICIPANTS", "An expense needs at least one participant.");
  }
  const base = Math.floor(total / participants.length);
  let leftover = total - base * participants.length;
  const parts: Record<string, number> = {};
  for (const id of participants) {
    parts[id] = base + (leftover > 0 ? 1 : 0);
    leftover--;
  }
  return parts;
}
