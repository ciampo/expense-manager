import { createClient } from '@/utils/supabase/server';

import EditExpenseForm from './form';

export default async function Page({
  params,
}: {
  params: { expenseId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user?.id || userError) {
    throw new Error(`Error while retrieving user info. ${userError?.message}`);
  }

  const { data: expenseData, error: expenseFetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', params.expenseId)
    .single();

  if (expenseFetchError) {
    throw new Error(
      `Error while retrieving expense info. ${expenseFetchError.message}`
    );
  }

  if (!expenseData) {
    throw new Error(
      `Error while retrieving expense info. ${params.expenseId} couldn't be found`
    );
  }

  return (
    <div>
      <h1>Edit existing expense</h1>
      <EditExpenseForm expenseData={expenseData} />
    </div>
  );
}
