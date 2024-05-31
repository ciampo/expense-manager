'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/utils/supabase/sudo-client';
import type { Database } from '@/utils/supabase/database.types';

type ExpenseData = Database['public']['Tables']['expenses']['Update'] & {
  attachment?: File | null | undefined;
};

export async function deleteProfile(prevState: any, formData: FormData) {
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

  console.log('DELETE USER', user.id);

  // 1. Delete expenses
  const { error: databaseError } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', user.id);
  if (databaseError) {
    return {
      message: `Error while deleting expense data. ${databaseError.message}`,
    };
  }

  // 2. Delete attachments
  const { data: userFiles, error: listUserFilesError } = await supabase.storage
    .from('expenses')
    .list(user.id);

  if (listUserFilesError) {
    return {
      message: `Error while retrieving expense attachments. ${listUserFilesError.message}`,
    };
  }
  const filesToRemove = (userFiles ?? []).map(
    (x) => `${user.id}/expenses/${x.name}`
  );
  if (filesToRemove.length > 0) {
    const { error: deleteAttachmentError } = await supabase.storage
      .from('expenses')
      .remove(filesToRemove);
    if (deleteAttachmentError) {
      return {
        message: `Error while deleting expense attachments. ${deleteAttachmentError?.message}`,
      };
    }
  }

  // 3. Sign out
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    return {
      message: `Error while signing user out. ${signOutError.message}`,
    };
  }

  // 4. Delete user
  const { error: deletedUserError } = await supabase.auth.admin.deleteUser(
    user.id
  );
  if (deletedUserError) {
    return {
      message: `Error while deleting user from the database. ${deletedUserError.message}`,
    };
  }

  // Everything went fine, refresh

  revalidatePath('/', 'layout');
  redirect('/');
}
