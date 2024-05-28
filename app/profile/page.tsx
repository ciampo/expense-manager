import { createClient } from '@/utils/supabase/server';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return (
    <section className="max-w-screen-lg mx-auto pt-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-blue-800 text-3xl">Profile</h1>
        <form action="/auth/signout" method="post">
          <button className="inline-block rounded px-4 py-2 bg-rose-700 text-white underline-offset-2 hover:bg-rose-600 hover:underline focus:bg-rose-600 focus:underline focus:outline-none focus:shadow-outline">
            Sign out
          </button>
        </form>
      </div>

      <dl>
        <dt>Email</dt>
        <dd>{data.user.email}</dd>
      </dl>
    </section>
  );
}
