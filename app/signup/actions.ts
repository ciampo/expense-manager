'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function signup(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    console.log(error);
    throw error;
  }

  if (!data.user?.identities?.length) {
    console.log('User already exists');
    throw new Error('Email already in use. Sign up instead');
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
