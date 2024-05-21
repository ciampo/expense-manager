import { createClient } from '@/utils/supabase/server';

import Link from 'next/link';
import Image from 'next/image';

import ExpensesList from './expense/expenses-list';

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return (
      <div className="min-h-dvh flex flex-col items-center gap-8 justify-center">
        <h1 className="text-5xl flex flex-col items-center gap-2">
          <Image src="/logo.svg" alt="" width={96} height={96} priority />
          Expense manager
        </h1>
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-base flex gap-4 items-center">
            <Link
              href={'/signup'}
              className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline"
            >
              Sign Up
            </Link>
            <span>or</span>
            <Link
              href={'/login'}
              className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline"
            >
              Log In
            </Link>
          </p>
          {error ? <p>{error.message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-screen-lg mx-auto pt-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-blue-800 text-3xl">Dashboard</h1>
        <Link
          className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline"
          href="/expense/new"
        >
          Add expense
        </Link>
      </div>
      <ExpensesList userId={data.user.id} />
    </section>
  );
}
