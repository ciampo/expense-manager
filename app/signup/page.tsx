import Link from 'next/link';

import { signup } from './actions';

export default function SignupPage() {
  // Use a Server Action to call the Supabase signup function.
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1 className="text-4xl font-thin">Create an Expense Manager account</h1>

      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 py-6 mb-4">
          <div className="mb-4">
            <label
              className="block text-gray-800 text-sm font-semibold mb-2"
              htmlFor="username"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              name="email"
              type="email"
              placeholder="user@domain.com"
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-800 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              name="password"
              type="password"
              placeholder="**************"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline"
              type="submit"
              formAction={signup}
            >
              Create an account
            </button>
          </div>
        </form>
        <p className="text-center text-gray-500 text-sm">
          Already have an account?
        </p>
        <p className="text-center text-gray-500 text-sm">
          <Link href={'/login'} className="underline">
            Sign in
          </Link>
          <span> or </span>
          <Link href={'/'} className="underline">
            navigate to the home page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
