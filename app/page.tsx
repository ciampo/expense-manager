import { createClient } from '@/utils/supabase/server';

import Link from 'next/link';

import ExpensesList from './expense/expenses-list';

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return (
      <>
        <h1 className="text-4xl font-thin">Expense manager</h1>
        <div className="flex flex-col items-center justify-center gap-4">
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
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Dashboard</h1>
      {/* TODO: use suspense */}
      <ExpensesList userId={data.user.id} />
    </>
  );
}
