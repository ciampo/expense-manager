'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { deleteExpense } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="ghost-destructive"
      size="sm"
      className="underline"
    >
      {children}
    </Button>
  );
}

export default function ExpenseActions({ expenseId }: { expenseId: number }) {
  const [state, formAction] = useActionState(deleteExpense, initialState);

  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link
          href={`/expense/edit/${expenseId}`}
          className="underline"
          onClick={(e) => {
            if (!(e.target instanceof Element)) {
              return;
            }

            const disabledButton = e.target.parentElement?.querySelector(
              'button[type="submit"][disabled]'
            );

            if (disabledButton) {
              e.preventDefault();
            }
          }}
        >
          Edit
        </Link>
      </Button>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm('Are you sure?')) {
            e.preventDefault();
            return false;
          }
        }}
      >
        <input type="hidden" name="expense_id" value={expenseId} />
        <SubmitButton>Delete</SubmitButton>
      </form>
    </>
  );
}
