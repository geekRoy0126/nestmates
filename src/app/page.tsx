import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Nestmates</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Fair chores and clear bills for shared apartments.
      </p>
      <nav>
        <ul className="flex flex-col gap-2">
          <li>
            <Link href="/chores" className="font-medium underline underline-offset-4">
              Chore rotation
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
