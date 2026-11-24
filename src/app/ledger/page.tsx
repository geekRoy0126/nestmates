import type { Metadata } from "next";
import Link from "next/link";

import { LedgerSummary } from "@/components/LedgerSummary";
import { demoExpenses, demoMembers } from "@/lib/demo/household";

export const metadata: Metadata = { title: "Bills · Nestmates" };

export default function LedgerPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Nestmates
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Bills</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Every balance shows the expenses behind it. Settle up pays everything off in the fewest transfers.
        </p>
      </div>
      <LedgerSummary members={demoMembers} expenses={demoExpenses} />
    </main>
  );
}
