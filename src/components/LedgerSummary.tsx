import { computeBalances, type Expense } from "@/lib/domain/balances";
import { settleUp } from "@/lib/domain/settle";
import type { Cents, Member } from "@/lib/domain/types";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The only place cents become dollars (CLAUDE.md decision 2). */
export function formatCents(cents: Cents): string {
  const text = dollars.format(Math.abs(cents) / 100);
  return cents < 0 ? `−${text}` : text;
}

/** "is owed $60.00" / "owes $60.00" / "is settled" — sign convention from `Balance`. */
function describeBalance(balance: Cents): string {
  if (balance > 0) return `is owed ${formatCents(balance)}`;
  if (balance < 0) return `owes ${formatCents(-balance)}`;
  return "is settled";
}

type Props = {
  members: Member[];
  expenses: Expense[];
};

export function LedgerSummary({ members, expenses }: Props) {
  const ids = members.map((m) => m.id);
  const balances = computeBalances(ids, expenses);
  const plan = settleUp(Object.fromEntries(ids.map((id) => [id, balances[id].balance])));
  const nameOf = new Map(members.map((m) => [m.id, m.name]));

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section aria-labelledby="balances" className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 id="balances" className="mb-2 font-semibold">
          Balances
        </h2>
        <ul className="flex flex-col gap-3 text-sm">
          {members.map((m) => {
            const { balance, lines } = balances[m.id];
            return (
              <li key={m.id}>
                <p>
                  <span className="font-medium">{m.name}</span> {describeBalance(balance)}
                </p>
                <ul className="ml-4 list-disc text-zinc-600 dark:text-zinc-400">
                  {lines.map((l) => (
                    <li key={l.expenseId}>
                      {l.description}: paid {formatCents(l.paid)}, share {formatCents(l.owed)}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="settle" className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 id="settle" className="mb-2 font-semibold">
          Settle up
        </h2>
        {plan.length === 0 ? (
          <p className="text-sm">Everyone is settled.</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm">
            {plan.map((t) => (
              <li key={`${t.from}-${t.to}`}>
                {nameOf.get(t.from)} pays {nameOf.get(t.to)} {formatCents(t.amount)}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
