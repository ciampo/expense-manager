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
    <div className="min-h-dvh flex flex-col items-center justify-center gap-12">
      <h1 className="text-4xl font-thin">Add a new expense</h1>
      <div className="w-full max-w-xs">
        <AddExpenseForm categories={uniqueCategories} />
      </div>
    </div>
  );
}
