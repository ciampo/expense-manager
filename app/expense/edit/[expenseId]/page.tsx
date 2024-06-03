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

  const { data: existingExpensesData, error: existingExpensesFetchError } =
    await supabase
      .from('expenses')
      .select('category, merchant_name')
      .eq('user_id', user.id);

  if (existingExpensesFetchError) {
    throw new Error(
      `Error while retrieving expense info. ${existingExpensesFetchError.message}`
    );
  }

  const uniqueCategories = Array.from(
    new Set(
      (existingExpensesData ?? [])
        .filter(({ category }) => !!category)
        .map(({ category }) => category)
    )
  ) as string[];

  const uniqueMerchants = Array.from(
    new Set(
      (existingExpensesData ?? [])
        .filter(({ merchant_name }) => !!merchant_name)
        .map(({ merchant_name }) => merchant_name)
    )
  ) as string[];

  return (
    <div className="pt-8 flex flex-col items-center justify-center gap-12">
      <h1 className="text-blue-800 text-3xl text-center">Edit expense</h1>
      <div className="w-full max-w-xs">
        <EditExpenseForm
          expenseData={expenseData}
          categories={uniqueCategories}
          merchants={uniqueMerchants}
        />
      </div>
    </div>
  );
}
