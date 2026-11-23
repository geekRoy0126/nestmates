import type { Metadata } from "next";
import Link from "next/link";

import { ChoreSchedule } from "@/components/ChoreSchedule";
import { DEMO_WEEKS, demoChores, demoMembers } from "@/lib/demo/household";

export const metadata: Metadata = { title: "Chore rotation · Nestmates" };

export default function ChoresPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Nestmates
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Chore rotation</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Each chore goes to whoever has the fewest effort points so far. Mark someone away and their chores move to
          the others. Hover a row to see why it was assigned.
        </p>
      </div>
      <ChoreSchedule members={demoMembers} chores={demoChores} weeks={DEMO_WEEKS} />
    </main>
  );
}
