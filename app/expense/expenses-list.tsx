import { createClient } from '@/utils/supabase/server';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// TODO: pagination / virtualisation
// TODO: split by month?
// TODO: multi selection?

import ExpenseActions from './expense-actions';

async function fetchExpensesData(userId: string) {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false });

  if (expenseError) {
    throw new Error(expenseError.message);
  }

  return expenseData;
}

export default async function ExpensesList({ userId }: { userId: string }) {
  const expensesData = await fetchExpensesData(userId);

  if (!expensesData || expensesData.length === 0) {
    return <p>No expense data found</p>;
  }

  return (
    <div className="w-full overflow-x-auto bg-white shadow-md rounded border">
      <Table className="w-full" style={{ minWidth: '40rem' }}>
        <TableHeader>
          <TableRow className="bg-accent text-left">
            <TableHead className="p-2 font-medium w-[112px] text-accent-foreground">
              Date
            </TableHead>
            <TableHead className="p-2 font-medium text-accent-foreground">
              Merchant
            </TableHead>
            <TableHead className="p-2 font-medium w-[80px] text-accent-foreground">
              Amount
            </TableHead>
            <TableHead className="p-2 font-medium w-[140px] text-accent-foreground">
              Category
            </TableHead>
            {/* <TableHead className="p-2 font-medium">
              Attachment
            </TableHead> */}
            <TableHead className="p-2 font-medium w-[80px] text-accent-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expensesData.map((expense, i) => (
            <TableRow
              className={`expense-row bg-opacity-30 ${i % 2 === 0 ? 'bg-blue-100' : 'bg-white'}`}
              key={expense.id}
            >
              <TableCell className="py-3 px-2">{expense.date}</TableCell>
              <TableCell className="py-3 px-2">
                {expense.merchant_name}
              </TableCell>
              <TableCell className="py-3 px-2 text-right font-mono">
                &euro;{' '}
                {(expense.amount ?? 0).toLocaleString('en', {
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="py-3 px-2">{expense.category}</TableCell>
              {/* TODO: open preview dialog instead */}
              {/* <TableCell className="py-3 px-2">
                <ExpenseAttachmentPreview attachment={expense.attachment} />
              </TableCell> */}
              <TableCell className="py-3 px-2">
                <ExpenseActions expenseId={expense.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
