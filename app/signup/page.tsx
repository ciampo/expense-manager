import Link from "next/link";

import { signup } from '../lib/actions'

export default function SignupPage() {
  // Use a Server Action to call the Supabase signup function.
  return (
    <main className='min-h-dvh flex flex-col items-center justify-center gap-12'>

      <h1 className='text-4xl font-thin'>Create an account</h1>
      <form className="flex flex-col items-stretch justify-center">
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label className="mt-4" htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button className="mt-8 bg-emerald-200 py-1 px-2 dark:bg-emerald-900" formAction={signup}>Sign up</button>
      </form>

      <p className="text-sm">Already have an account? <Link href={"/login"} className="underline">Log in</Link></p>
    </main>
  )
}