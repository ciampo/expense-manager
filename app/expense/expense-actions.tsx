'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import Link from 'next/link';

import { deleteExpense } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="underline">
      {children}
    </button>
  );
}

export default function ExpenseActions({ expenseId }: { expenseId: number }) {
  const [state, formAction] = useActionState(deleteExpense, initialState);

  return (
    <>
      <Link href={`/expense/edit/${expenseId}`} className="underline">
        Edit
      </Link>
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
