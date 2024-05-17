'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function signup(prevState: any, formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { message: error.message };
  }

  if (!data.user?.identities?.length) {
    return { message: 'Email already in use. Sign up instead' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
