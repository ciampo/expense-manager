import Link from 'next/link';

import LoginForm from './form';

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1 className="text-4xl font-thin ">Sign in to Expense Manager</h1>

      <div className="w-full max-w-xs">
        <LoginForm />
        <p className="text-center text-gray-500 text-sm">
          Don&rsquo;t have an account yet?
        </p>
        <p className="text-center text-gray-500 text-sm">
          <Link href={'/signup'} className="underline">
            Sign up
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
