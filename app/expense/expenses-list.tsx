import Link from 'next/link';

import { createClient } from '@/utils/supabase/server';

import ExpenseAttachmentPreview from './expense-attachment-preview';

async function fetchExpensesData(userId: string) {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
    return;
  }

  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userData.user.id);

  if (expenseError) {
    throw new Error(expenseError.message);
    return;
  }

  return expenseData;
}

export default async function ExpensesList({ userId }: { userId: string }) {
  const expensesData = await fetchExpensesData(userId);

  if (!expensesData || expensesData.length === 0) {
    return <p>No expense data found</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full" style={{ minWidth: '40rem' }}>
        <thead className="sticky t-12">
          <tr className="bg-blue-700 text-white text-left">
            <th scope="col" className="p-2">
              Date
            </th>
            <th scope="col" className="p-2">
              Merchant
            </th>
            <th scope="col" className="p-2">
              Amount
            </th>
            <th scope="col" className="p-2">
              Category
            </th>
            <th scope="col" className="p-2">
              Attachment
            </th>
            <th scope="col" className="p-2">
              Edit
            </th>
          </tr>
        </thead>
        <tbody>
          {expensesData.map((expense, i) => (
            <tr
              className={`border-b border-b-blue-900 ${i % 2 === 0 && 'bg-blue-100 bg-opacity-30'}`}
              key={expense.id}
            >
              <td className="py-3 px-2">{expense.date}</td>
              <td className="py-3 px-2">{expense.merchant_name}</td>
              <td className="py-3 px-2">&euro; {expense.amount}</td>
              <td className="py-3 px-2">{expense.category}</td>
              {/* TODO: optimize resize */}
              <td className="py-3 px-2">
                <ExpenseAttachmentPreview attachment={expense.attachment} />
              </td>
              <td className="py-3 px-2">
                <Link
                  href={`/expense/edit/${expense.id}`}
                  className="underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
