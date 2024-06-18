import Link from 'next/link';

import SignupForm from './form';

export default function SignupPage() {
  // Use a Server Action to call the Supabase signup function.
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1 className="text-3xl text-center">Create an account</h1>

      <div className="w-full max-w-xs">
        <SignupForm />
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
