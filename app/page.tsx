import { createClient } from '@/utils/supabase/server';

import Link from 'next/link';

import ExpensesList from './expense/expenses-list';

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-thin">Expense manager</h1>
        <p className="text-sm">
          <Link href={'/signup'} className="underline">
            Sign Up
          </Link>{' '}
          or{' '}
          <Link href={'/login'} className="underline">
            Log In
          </Link>
        </p>
        {error ? <p>{error.message}</p> : null}
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <h1>Dashboard</h1>
      <p>Hello {data.user.email}</p>
      <h2>Expenses</h2>
      {/* TODO: use suspense */}
      <ExpensesList userId={data.user.id} />
    </main>
  );
}
