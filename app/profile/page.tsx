import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';

import DeleteProfileForm from './delete-profile-form';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return (
    <section className="max-w-screen-lg mx-auto pt-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Profile</h1>
        <form action="/auth/signout" method="post">
          <Button variant="ghost-destructive" className="underline">
            Sign out
          </Button>
        </form>
      </div>

      <dl>
        <dt>Email</dt>
        <dd>{data.user.email}</dd>
      </dl>

      <div className="mt-8">
        <DeleteProfileForm />
      </div>
    </section>
  );
}
