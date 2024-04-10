import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

import { logout } from './actions'

export default async function PrivatePage() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <>
    <p>Hello {data.user.email}</p>
    <form>
      <button formAction={logout}>Logout</button>
    </form>
  </>
}