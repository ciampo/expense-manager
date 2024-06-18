import { createClient } from '@/utils/supabase/server';

import Link from 'next/link';
import Image from 'next/image';

import { AuthSessionMissingError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

import ExpensesList from './expense/expenses-list';

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return (
      <div className="min-h-dvh flex flex-col items-center gap-8 justify-center">
        <h1 className="text-5xl flex flex-col items-center gap-2 text-center">
          <Image src="/logo.svg" alt="" width={96} height={96} priority />
          Expense manager
        </h1>
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-base flex gap-4 items-center">
            <Button asChild>
              <Link href={'/signup'}>Sign Up</Link>
            </Button>
            <span>or</span>
            <Button asChild>
              <Link href={'/login'}>Log In</Link>
            </Button>
          </p>
          {error && !(error instanceof AuthSessionMissingError) ? (
            <p>{error.message}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-screen-lg mx-auto py-8 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Dashboard</h1>
        <Button asChild>
          <Link href="/expense/new">
            Add
            <span className="sr-only sm:not-sr-only">&nbsp;expense</span>
          </Link>
        </Button>
      </div>
      <ExpensesList userId={data.user.id} />
    </section>
  );
}
