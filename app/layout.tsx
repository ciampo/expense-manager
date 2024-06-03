import { createClient } from '@/utils/supabase/server';

import Link from 'next/link';
import Image from 'next/image';

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

  return (
    <html lang="en">
      <body className="font-sans">
        {!isLoggedIn ? (
          <>{children}</>
        ) : (
          <>
            <nav className="fixed w-full top-0 z-50">
              <ul className="h-12 border-b border-b-blue-900 px-4 md:px-8 flex items-stretch bg-blue-700 text-white">
                <li className="flex items-stretch mr-auto">
                  <Link
                    href="/"
                    className="-ml-4 px-4 flex gap-2 items-center text-base underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none"
                  >
                    <Image
                      src="/logo.svg"
                      className="invert"
                      alt="Expense Manager logo"
                      width={32}
                      height={32}
                      priority
                    />
                    <span className="sr-only sm:not-sr-only">
                      Expense manager
                    </span>
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <Link
                    href="/expense/new"
                    className="px-4 flex items-center text-base underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none"
                  >
                    Add
                    <span className="sr-only sm:not-sr-only">
                      &nbsp;expense
                    </span>
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <Link
                    href="/report"
                    className="px-4 flex items-center text-base underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none"
                  >
                    Report
                  </Link>
                </li>
                <li className="flex items-stretch">
                  <Link
                    href="/profile"
                    className="-mr-4 px-4 flex items-center text-base underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </nav>
            <main className="pt-12 min-h-dvh px-4 md:px-8">{children}</main>
          </>
        )}
      </body>
    </html>
  );
}
