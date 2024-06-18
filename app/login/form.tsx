'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

import { login } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {children}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="bg-white shadow-md rounded px-8 py-6 mb-4"
    >
      <div className="mb-4">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="email"
        >
          Email
        </label>
        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          id="email"
          name="email"
          type="email"
          placeholder="user@domain.com"
          autoComplete="username"
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
          autoComplete="current-password"
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <SubmitButton>Sign in</SubmitButton>
      </div>
      <p aria-live="polite">{state?.message}</p>
    </form>
  );
}
