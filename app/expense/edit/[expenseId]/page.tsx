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

  const { data: categoriesData, error: categoriesFetchedError } = await supabase
    .from('expenses')
    .select('category')
    .eq('user_id', user.id);

  if (categoriesFetchedError) {
    throw new Error(
      `Error while retrieving expense info. ${categoriesFetchedError.message}`
    );
  }

  const uniqueCategories = Array.from(
    new Set(
      (categoriesData ?? [])
        .filter(({ category }) => !!category)
        .map(({ category }) => category)
    )
  ) as string[];

  return (
    <div className="min-h-dvh -mt-12 flex flex-col items-center justify-center gap-12">
      <h1 className="text-4xl font-thin">Edit expense</h1>
      <div className="w-full max-w-xs">
        <EditExpenseForm
          expenseData={expenseData}
          categories={uniqueCategories}
        />
      </div>
    </div>
  );
}
