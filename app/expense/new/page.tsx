'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { createExpense } from './actions';

const initialState = {
  message: '',
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline disabled:bg-slate-800 disabled:opacity-50 disabled:no-underline"
      type="submit"
      disabled={pending}
    >
      {children}
    </button>
  );
}

export default function NewExpensePage() {
  const [state, formAction] = useActionState(createExpense, initialState);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1>Add a new expense</h1>

      <form action={formAction}>
        <p>
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" required />
        </p>

        <p>
          {/* Pre-populate with existing merchants? */}
          <label htmlFor="merchant_name">Merchant</label>
          <input
            id="merchant_name"
            name="merchant_name"
            required
            placeholder="Merchant name"
          />
        </p>

        <p>
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            id="amount"
            name="amount"
            required
            placeholder="Expense amount"
          />
        </p>

        <p>
          {/* Allow a new category + existing ones? */}
          <label htmlFor="category">Category</label>
          <select name="category" id="category" required>
            <option value="">Expense category</option>
            {['coworking', 'test'].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </p>

        <p>
          <label htmlFor="attachment">Attachment</label>
          <input name="attachment" id="attachment" type="file" />
        </p>

        <SubmitButton>Save</SubmitButton>
        <p aria-live="polite">{state?.message}</p>
      </form>
    </main>
  );
}
