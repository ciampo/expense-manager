'use client';

import { useState, useEffect, useActionState, useRef } from 'react';

import { useFormStatus } from 'react-dom';

import { createClient } from '@/utils/supabase/client';

import { deleteProfile } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded px-4 py-2 bg-white text-red-900 border border-current underline-offset-2 hover:bg-red-50 hover:underline focus:bg-red-50 focus:underline focus:outline-none focus:shadow-outline disabled:text-slate-700 disabled:opacity-50 disabled:no-underline"
      type="submit"
      disabled={pending}
    >
      {children}
    </button>
  );
}

export default function DeleteProfileForm() {
  const supabase = createClient();

  const [state, formAction] = useActionState(deleteProfile, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            'Are you sure? All user data will be deleted. This action cannot be undone.'
          )
        ) {
          e.preventDefault();
          return false;
        }
      }}
    >
      {/* Submit */}
      <SubmitButton>Delete profile</SubmitButton>

      {/* Message */}
      <p aria-live="polite">{state?.message}</p>
    </form>
  );
}
