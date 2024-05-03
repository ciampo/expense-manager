import { createClient } from '@/utils/supabase/server';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { logout } from './lib/actions';

import './globals.css';

export async function generateMetadata() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  return {
    title:
      error || !data?.user ? 'Expense Manager' : 'Dashboard | Expense Manager',
    description: 'Manage expenses and create reports',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="font-sans min-h-dvh">
        <nav>
          <ul className="border-b border-b-black py-2 px-2 flex">
            <li>
              <Link href="/" className="flex items-center gap-2 text-sm">
                <Image
                  src="/logo.svg"
                  alt="Expense Manager logo"
                  className="dark:invert"
                  width={24}
                  height={24}
                  priority
                />
                Expense manager
              </Link>
            </li>
            <li>
              <Link href="/report" className="flex items-center gap-2 text-sm">
                Report
              </Link>
            </li>
            <li>
              <Link
                href="/expense/new"
                className="flex items-center gap-2 text-sm"
              >
                Add expense
              </Link>
            </li>

            <li className="ml-auto">
              {error || !data?.user ? (
                <>
                  <Link href={'/login'} className="text-sm underline">
                    Log In
                  </Link>{' '}
                  or{' '}
                  <Link href={'/signup'} className="text-sm underline">
                    Sign Up
                  </Link>
                </>
              ) : (
                <form>
                  <button className="text-sm underline" formAction={logout}>
                    Logout
                  </button>
                </form>
              )}
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
