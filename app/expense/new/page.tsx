import { createClient } from '@/utils/supabase/server';

import AddExpenseForm from './form';

export default async function NewExpensePage() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user?.id || userError) {
    throw new Error(`Error while retrieving user info. ${userError?.message}`);
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
      <h1 className="text-blue-800 text-3xl text-center">Add expense</h1>
      <div className="w-full max-w-xs">
        <AddExpenseForm
          categories={uniqueCategories}
          merchants={uniqueMerchants}
        />
      </div>
    </div>
  );
}
