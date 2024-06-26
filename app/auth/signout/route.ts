import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Check if a user's logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(error);
      throw error;
    }
  }

  revalidatePath('/', 'layout');
  return NextResponse.redirect(new URL('/', req.url), {
    status: 302,
  });
}
