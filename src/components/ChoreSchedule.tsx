"use client";

import { useMemo, useState } from "react";

import { scheduleWeeks } from "@/lib/domain/chores";
import type { Chore, Member } from "@/lib/domain/types";

type Props = {
  members: Member[];
  chores: Chore[];
  weeks: number;
};

export function ChoreSchedule({ members, chores, weeks }: Props) {
  const [awayByWeek, setAwayByWeek] = useState<string[][]>(() => Array.from({ length: weeks }, () => []));
  const schedule = useMemo(() => scheduleWeeks({ members, chores, awayByWeek }), [members, chores, awayByWeek]);

  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  const choreOf = new Map(chores.map((c) => [c.id, c]));

  function toggleAway(week: number, memberId: string) {
    setAwayByWeek((prev) =>
      prev.map((away, i) =>
        i !== week ? away : away.includes(memberId) ? away.filter((id) => id !== memberId) : [...away, memberId],
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {schedule.weeks.map((assignments, week) => (
          <section key={week} aria-labelledby={`week-${week}`} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 id={`week-${week}`} className="mb-2 font-semibold">
              Week {week + 1}
            </h2>
            <fieldset className="mb-3 flex flex-wrap gap-3 text-sm">
              <legend className="sr-only">Away in week {week + 1}</legend>
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={awayByWeek[week].includes(m.id)}
                    onChange={() => toggleAway(week, m.id)}
                  />
                  {m.name} away
                </label>
              ))}
            </fieldset>
            <ul className="flex flex-col gap-1 text-sm">
              {assignments.map((a) => (
                <li key={a.choreId} className="flex justify-between gap-2" title={a.reason}>
                  <span>
                    {choreOf.get(a.choreId)?.name}{" "}
                    <span className="text-zinc-500">({choreOf.get(a.choreId)?.weight} pt)</span>
                  </span>
                  {a.memberId ? (
                    <span className="font-medium">{nameOf.get(a.memberId)}</span>
                  ) : (
                    <span className="rounded bg-amber-100 px-1.5 font-medium text-amber-900">Unassigned</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section aria-labelledby="totals">
        <h2 id="totals" className="mb-2 font-semibold">
          Effort points after {weeks} weeks
        </h2>
        <ul className="flex gap-4 text-sm">
          {members.map((m) => (
            <li key={m.id}>
              {m.name}: <span data-testid={`points-${m.id}`}>{schedule.points[m.id]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
