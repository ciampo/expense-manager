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

  const isLoggedIn = !error && data?.user;

  // ERROR missing sub claim
  // see https://github.com/supabase/supabase-js/issues/992

  return (
    <html lang="en">
      <body className="font-sans">
        {!isLoggedIn ? (
          <main className="min-h-dvh">{children}</main>
        ) : (
          <>
            <nav className="fixed w-full top-0">
              <ul className="h-12 border-b border-b-blue-900 px-2 flex items-stretch bg-blue-800 text-white">
                <li className="flex items-stretch mr-auto">
                  <Link
                    href="/"
                    className="-ml-4 px-4 flex gap-2 items-center text-base underline-offset-2 hover:bg-blue-700 hover:underline focus:bg-blue-700 focus:underline focus:outline-none"
                  >
                    <Image
                      src="/logo.svg"
                      className="invert"
                      alt="Expense Manager logo"
                      width={32}
                      height={32}
                      priority
                    />
                    Expense manager
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <Link
                    href="/report"
                    className="px-4 flex items-center text-base underline-offset-2 hover:bg-blue-700 hover:underline focus:bg-blue-700 focus:underline focus:outline-none"
                  >
                    Report
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <Link
                    href="/expense/new"
                    className="px-4 flex items-center text-base underline-offset-2 hover:bg-blue-700 hover:underline focus:bg-blue-700 focus:underline focus:outline-none"
                  >
                    Add expense
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <button
                    type="button"
                    className="-mr-2 px-4 flex items-center text-base underline-offset-2 hover:bg-blue-700 hover:underline focus:bg-blue-700 focus:underline focus:outline-none"
                    // @ts-expect-error
                    popovertarget="popover-profile"
                  >
                    Profile
                  </button>
                </li>
              </ul>
            </nav>
            <main className="pt-12 min-h-dvh px-2">{children}</main>
            <div
              id="popover-profile"
              className="fixed inset-auto top-12 right-0 p-3 bg-white text-blue-800"
              // @ts-expect-error
              popover=""
            >
              <p>{data.user.email}</p>

              <form>
                <button className="text-base underline" formAction={logout}>
                  Logout
                </button>
              </form>
            </div>
          </>
        )}
      </body>
    </html>
  );
}
