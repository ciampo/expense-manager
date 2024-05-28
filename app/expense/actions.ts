'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/utils/supabase/database.types';

type ExpenseData = Database['public']['Tables']['expenses']['Update'] & {
  attachment?: File | null | undefined;
};

export async function deleteExpense(prevState: any, formData: FormData) {
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

  const expenseId = formData.get('expense_id');

  if (!expenseId) {
    return {
      message: `Error: could not find expense id`,
    };
  }

  console.log('DELETE EXPENSE', expenseId);

  const { data: deletedExpenseData, error: databaseError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', user.id)
    .select();

  if (databaseError) {
    return {
      message: `Error while deleting expense from the database. ${databaseError?.message}`,
    };
  }

  if (deletedExpenseData?.length > 0 && !!deletedExpenseData[0].attachment) {
    const { error: deleteAttachmentError } = await supabase.storage
      .from('expenses')
      .remove([deletedExpenseData[0].attachment]);

    if (deleteAttachmentError) {
      return {
        message: `Error while deleting expense's attachment from storage. ${deleteAttachmentError?.message}`,
      };
    }
  }

  // Everything went fine, refresh
  revalidatePath('/');
}
