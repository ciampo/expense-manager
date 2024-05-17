'use client';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '../../../utils/supabase/client';
import type { Database } from '../../../utils/supabase/database.types';

export default function NewExpensePage() {
  const supabase = createClient();

  const router = useRouter();

  const [userId, setUserId] = useState<string>('');
  const [, setError] = useState();
  const [isUploading, setIsUploading] = useState(false);

  // fetch and store user info
  useEffect(() => {
    async function fetchUserId() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user?.id || error) {
        setError(() => {
          throw new Error('Error while fetching user information');
        });
      } else {
        setUserId(user.id);
      }
    }

    fetchUserId();
  }, [supabase]);

  // TODO: try moving it to server actions under lib/actions
  // TODO: create profile too?
  // TODO: error validation?
  // TODO: picture upload?
  // TODO: loading
  const addExpense = useCallback(
    (formData: FormData) => {
      async function insertExpense(
        newExpenseData: Database['public']['Tables']['expenses']['Insert'] & {
          attachment?: File | null | undefined;
        }
      ) {
        // TODO: data validation

        setIsUploading(true);

        let attachmentUploadError;
        let filePath;

        if (
          newExpenseData.attachment &&
          newExpenseData.attachment.size > 0 &&
          newExpenseData.attachment.name.length > 0
        ) {
          console.log(newExpenseData.attachment);
          const fileExt = newExpenseData.attachment.name.split('.').pop();
          filePath = `${userId}/${Math.random()}.${fileExt}`;

          const { error } = await supabase.storage
            .from('expenses')
            .upload(filePath, newExpenseData.attachment);

          attachmentUploadError = error;
        }

        if (attachmentUploadError) {
          console.error(attachmentUploadError);
          // TODO: show error to user
          setIsUploading(false);
          return;
        }

        const { data, error: databaseError } = await supabase
          .from('expenses')
          .insert({ ...newExpenseData, attachment: filePath })
          .select()
          .single();

        if (databaseError) {
          console.error(databaseError);
          // TODO: show error to user
          setIsUploading(false);
          return;
        }

        // Everything went fine, redirect to home
        router.push('/');
      }

      insertExpense(Object.fromEntries(formData.entries()));
    },
    [supabase, router, userId]
  );

  const onFormSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      if (isUploading) {
        e.preventDefault();
      }
    },
    [isUploading]
  );

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1>Add a new expense</h1>

      {/* TODO: do not submit while loading / not valid / userId not found */}
      <form action={addExpense} onSubmit={onFormSubmit}>
        <p>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            disabled={isUploading}
          />
        </p>

        <p>
          {/* Pre-populate with existing merchants? */}
          <label htmlFor="merchant_name">Merchant</label>
          <input
            id="merchant_name"
            name="merchant_name"
            required
            placeholder="Merchant name"
            disabled={isUploading}
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
            disabled={isUploading}
          />
        </p>

        <p>
          {/* Allow a new category + existing ones? */}
          <label htmlFor="category">Category</label>
          <select name="category" id="category" required disabled={isUploading}>
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
          <input
            name="attachment"
            id="attachment"
            type="file"
            disabled={isUploading}
          />
        </p>

        <input id="user_id" name="user_id" type="hidden" value={userId} />

        <button
          className="mt-4 p-1 border-2 disabled:bg-slate-800 disabled:opacity-50 disabled:no-underline"
          type="submit"
          disabled={isUploading}
        >
          Save
        </button>
      </form>
    </main>
  );
}
