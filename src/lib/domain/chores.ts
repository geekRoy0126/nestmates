import { DomainError } from "./errors";
import type { Chore, Member, Points } from "./types";

export type Assignment = {
  choreId: string;
  /** `null` when nobody was available (US3 AC d) — the chore is flagged, never dropped. */
  memberId: string | null;
  /** Human-readable explanation of the pick (CLAUDE.md decision 5). */
  reason: string;
};

export type WeekInput = {
  members: readonly Member[];
  chores: readonly Chore[];
  away?: readonly string[];
  points?: Points;
};

export type WeekResult = {
  assignments: Assignment[];
  points: Points;
};

const MIN_WEIGHT = 1;
const MAX_WEIGHT = 5;

function validate({ members, chores, away = [] }: WeekInput): void {
  if (members.length === 0) {
    throw new DomainError("NO_MEMBERS", "A household needs at least one member.");
  }
  const ids = new Set<string>();
  for (const m of members) {
    if (ids.has(m.id)) throw new DomainError("DUPLICATE_MEMBER", `Member ${m.id} appears twice.`);
    ids.add(m.id);
  }
  for (const id of away) {
    if (!ids.has(id)) throw new DomainError("UNKNOWN_MEMBER", `Away member ${id} is not in the household.`);
  }
  for (const c of chores) {
    if (!Number.isInteger(c.weight) || c.weight < MIN_WEIGHT || c.weight > MAX_WEIGHT) {
      throw new DomainError(
        "INVALID_WEIGHT",
        `Chore "${c.name}" has weight ${c.weight}; weights are whole numbers ${MIN_WEIGHT}–${MAX_WEIGHT}.`,
      );
    }
  }
}

/**
 * Assign one week of chores (PRD US3).
 * Heavier chores are placed first; each goes to the available member with the fewest cumulative points,
 * ties broken by join order. Inputs are never mutated.
 */
export function assignWeek(input: WeekInput): WeekResult {
  validate(input);
  const { members, chores, away = [] } = input;
  const awaySet = new Set(away);
  const available = members.filter((m) => !awaySet.has(m.id));

  const points: Record<string, number> = {};
  for (const m of members) points[m.id] = input.points?.[m.id] ?? 0;

  // Heaviest first, then by id so equal weights are ordered deterministically.
  const ordered = [...chores].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));

  const assignments: Assignment[] = [];
  for (const chore of ordered) {
    if (available.length === 0) {
      assignments.push({ choreId: chore.id, memberId: null, reason: "nobody available" });
      continue;
    }
    // `available` is in join order, and we only replace on strictly fewer points, so ties keep the earlier member.
    let pick = available[0];
    for (const m of available) if (points[m.id] < points[pick.id]) pick = m;

    const others = available
      .filter((m) => m.id !== pick.id)
      .map((m) => `${m.name} ${points[m.id]}`)
      .join(", ");
    assignments.push({
      choreId: chore.id,
      memberId: pick.id,
      reason: `fewest points: ${pick.name} ${points[pick.id]}${others ? ` (${others})` : ""}`,
    });
    points[pick.id] += chore.weight;
  }

  return { assignments, points };
}
