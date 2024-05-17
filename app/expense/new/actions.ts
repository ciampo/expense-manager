'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/utils/supabase/database.types';

type ExpenseData = Database['public']['Tables']['expenses']['Insert'] & {
  attachment?: File | null | undefined;
};

// TODO: create profile too?
export async function createExpense(prevState: any, formData: FormData) {
  // Since Supabase is being called from an Action,
  // use the client defined in @/utils/supabase/server.ts.
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user?.id || userError) {
    return {
      message: `Error while fetching user information. ${userError?.message}`,
    };
  }

  let attachmentUploadError;
  let filePath;

  const expenseData = {
    date: formData.get('date') as ExpenseData['date'],
    merchant_name: formData.get(
      'merchant_name'
    ) as ExpenseData['merchant_name'],
    amount: formData.get('amount') as ExpenseData['amount'],
    category: formData.get('category') as ExpenseData['category'],
    attachment: formData.get('attachment') as ExpenseData['attachment'],
    user_id: user.id as ExpenseData['user_id'],
  };

  console.log('NEW EXPENSE', expenseData);

  let hasNewAttachment = false;
  if (
    expenseData.attachment &&
    expenseData.attachment.size > 0 &&
    expenseData.attachment.name.length > 0
  ) {
    const fileExt = expenseData.attachment.name.split('.').pop();
    filePath = `${user.id}/${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('expenses')
      .upload(filePath, expenseData.attachment);

    attachmentUploadError = error;
    hasNewAttachment = true;
  }

  if (attachmentUploadError) {
    return {
      message: `Error while uploading attachment. ${attachmentUploadError.message}`,
    };
  }

  const { data, error: databaseError } = await supabase
    .from('expenses')
    .insert({ ...expenseData, attachment: hasNewAttachment ? filePath : null })
    .select()
    .single();

  if (databaseError) {
    return {
      message: `Error while adding expense to the database. ${databaseError?.message}`,
    };
  }

  // Everything went fine, redirect to home
  redirect('/');
}
