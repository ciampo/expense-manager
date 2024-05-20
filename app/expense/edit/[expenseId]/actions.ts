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
  let newAttachmentStoragePath = null;

  const newAttachmentFile = formData.get(
    'new_attachment'
  ) as ExpenseData['attachment'];
  const previousAttachmentStoragePath = formData.get('previous_attachment') as
    | string
    | null;
  const shouldRemoveOriginalAttachment =
    formData.get('remove_original_attachment') === 'true';

  const editedExpenseData = {
    date: formData.get('date') as ExpenseData['date'],
    merchant_name: formData.get(
      'merchant_name'
    ) as ExpenseData['merchant_name'],
    amount: formData.get('amount') as ExpenseData['amount'],
    category: formData.get('category') as ExpenseData['category'],
    user_id: user.id as ExpenseData['user_id'],
  };

  if (
    newAttachmentFile &&
    newAttachmentFile.size > 0 &&
    newAttachmentFile.name.length > 0
  ) {
    const fileExt = newAttachmentFile.name.split('.').pop();
    newAttachmentStoragePath = `${user.id}/${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('expenses')
      .upload(newAttachmentStoragePath, newAttachmentFile);

    attachmentUploadError = error;
  }

  if (attachmentUploadError) {
    return {
      message: `Error while uploading attachment. ${attachmentUploadError.message}`,
    };
  }

  const updatedExpenseData = {
    ...editedExpenseData,
    attachment: shouldRemoveOriginalAttachment
      ? newAttachmentStoragePath
      : // if !shouldRemoveOriginalAttachment, one possibility
        // is that there was not a previous attachment, and that the
        // user simply specified a new image.
        newAttachmentStoragePath ?? previousAttachmentStoragePath,
  };

  console.log('UPDATE EXPENSE', updatedExpenseData);

  const { error: databaseError } = await supabase
    .from('expenses')
    .update(updatedExpenseData)
    .eq('id', expenseId)
    .eq('user_id', user.id);

  if (databaseError) {
    return {
      message: `Error while adding expense to the database. ${databaseError?.message}`,
    };
  }

  // if needed, delete the previous image
  // - previousAttachmentStoragePath is true if the original expense had an attachment
  // - editedExpenseData.attachment is defined if the user deleted
  if (previousAttachmentStoragePath && shouldRemoveOriginalAttachment) {
    const { error: removePreviousAttachmentError } = await supabase.storage
      .from('expenses')
      .remove([previousAttachmentStoragePath]);

    if (removePreviousAttachmentError) {
      return {
        message: `Error while deleting previous attachment from storage. ${removePreviousAttachmentError?.message}`,
      };
    }
  }

  // Everything went fine, redirect to home
  redirect('/');
}
