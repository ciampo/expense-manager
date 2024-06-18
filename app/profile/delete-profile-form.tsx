'use client';

import { useState, useEffect, useActionState, useRef } from 'react';

import { useFormStatus } from 'react-dom';

import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

import { deleteProfile } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant="destructive">
      {children}
    </Button>
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
