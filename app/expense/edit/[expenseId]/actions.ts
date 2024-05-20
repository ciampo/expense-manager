'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/utils/supabase/database.types';

type ExpenseData = Database['public']['Tables']['expenses']['Update'] & {
  attachment?: File | null | undefined;
};

export async function updateExpense(prevState: any, formData: FormData) {
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

  const expenseId = formData.get('id');

  if (!expenseId) {
    return {
      message: `Error: could not find expense id`,
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

  console.log('UPDATE EXPENSE', expenseData);

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

  const { error: databaseError } = await supabase
    .from('expenses')
    .update({ ...expenseData, attachment: hasNewAttachment ? filePath : null })
    .eq('id', expenseId)
    .eq('user_id', user.id);

  if (databaseError) {
    return {
      message: `Error while adding expense to the database. ${databaseError?.message}`,
    };
  }

  const previousAttachment = formData.get('previous_attachment') as
    | string
    | null;
  const shouldRemoveOriginalAttachment =
    formData.get('remove_original_attachment') === 'true';

  // if needed, delete the previous image
  // - previousAttachment is true if the original expense had an attachment
  // - expenseData.attachment is defined if the user deleted
  if (previousAttachment && shouldRemoveOriginalAttachment) {
    const { error: removePreviousAttachmentError } = await supabase.storage
      .from('expenses')
      .remove([previousAttachment]);

    if (removePreviousAttachmentError) {
      return {
        message: `Error while deleting previous attachment from storage. ${removePreviousAttachmentError?.message}`,
      };
    } else {
      // Setting to null to remove attachment from database
      filePath ??= null;
    }
  }

  // Everything went fine, redirect to home
  redirect('/');
}
