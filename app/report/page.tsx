import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';

import AttachmentsButton from './attachmentDownloadButton';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="w-4 h-4"
      role="presentation"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12 3v13m0 0 4-4.38M12 16l-4-4.38M15 21H9c-2.83 0-4.24 0-5.12-.88C3 19.24 3 17.82 3 15m18 0c0 2.83 0 4.24-.88 5.12-.3.3-.66.5-1.12.63"
      />
    </svg>
  );
}

export default async function ReportPage() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user?.id || userError) {
    throw new Error(`Error while retrieving user info. ${userError?.message}`);
  }

  const { data: allExpensesByMonthData, error: allExpensesFetchError } =
    await supabase
      .from('how_many_expenses_by_month')
      .select('*')
      .eq('user_id', user.id);

  if (allExpensesFetchError) {
    throw new Error(
      `Error while retrieving expense info. ${allExpensesFetchError.message}`
    );
  }

  const { data: expenseSummaryData, error: expenseSummaryFetchError } =
    await supabase
      .from('expenses_summary_by_date_and_category')
      .select('*')
      .eq('user_id', user.id);

  if (expenseSummaryFetchError) {
    throw new Error(
      `Error while retrieving expense info. ${expenseSummaryFetchError.message}`
    );
  }

  type Data = {
    id: string;
    dateFormatted: string;
    count: number;
    csvFilename: string;
    csvData: string;
    dateStart: Date;
    dateEnd: Date;
  };
  const aggregatedData = allExpensesByMonthData.map(
    ({ count, month: dbStringDate }) => {
      if (!dbStringDate || !count) {
        return null;
      }

      const thisMonthDate = new Date(dbStringDate);

      const thisMonthYear = thisMonthDate.getFullYear();
      const thisMonthMonth = thisMonthDate.getMonth();

      const nextMonthYear =
        thisMonthMonth === 11 ? thisMonthYear + 1 : thisMonthYear;
      const nextMonthMonth = thisMonthMonth === 11 ? 0 : thisMonthMonth + 1;
      const nextMonthDate = new Date(
        `${nextMonthYear}-${nextMonthMonth + 1}-01`
      );

      const thisMonthDateFormatted = `${MONTH_NAMES[thisMonthMonth]} ${thisMonthYear}`;

      const thisMonthExpenseData = expenseSummaryData.filter(({ date }) => {
        if (!date) {
          return false;
        }

        const expenseDate = new Date(date);

        return expenseDate >= thisMonthDate && expenseDate < nextMonthDate;
      });

      const csvData = `data:text/csv;charset=utf-8,${MONTH_NAMES[thisMonthMonth]}\ngiorno,descrizione,aliquota,imponibile,imposta,imponibile,imposta,totale spese documentate\n${thisMonthExpenseData
        .map(({ date, category, total_amount }) => {
          if (!date || !category || !total_amount) {
            return;
          }
          return [
            new Date(date).getDate(),
            category,
            '',
            '',
            '',
            '',
            '',
            total_amount,
          ].join(',');
        })
        .filter(Boolean)
        .join('\n')}`;

      return {
        id: dbStringDate,
        dateFormatted: thisMonthDateFormatted,
        dateStart: thisMonthDate,
        dateEnd: nextMonthDate,
        count,
        csvFilename: `${thisMonthYear}-${`${thisMonthMonth + 1}`.padStart(2, '0')}-expense-report.csv`,
        csvData,
      } as Data;
    }
  );

  return (
    <div className="min-h-dvh pt-8 max-w-screen-lg mx-auto">
      <h1 className="text-3xl mb-8">Generate reports</h1>

      {aggregatedData.length === 0 ? (
        <p>No expense data available</p>
      ) : (
        <ul className="w-full bg-white shadow-md rounded border">
          {aggregatedData.map((e, i) =>
            e === null ? null : (
              <li
                className={`border-t first:border-none border-t-slate-400 bg-opacity-30 ${i % 2 === 0 ? 'bg-blue-100' : 'bg-white'} px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
                key={e.id}
              >
                <p className="flex flex-row items-center gap-2 sm:flex-col sm:items-start">
                  <span className="font-medium text-lg">{e.dateFormatted}</span>
                  <span>[{e.count} expenses]</span>
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={encodeURI(e.csvData)}
                      aria-label="Download CSV"
                      download={e.csvFilename}
                      className="gap-2"
                    >
                      <DownloadIcon /> CSV
                    </a>
                  </Button>
                  <AttachmentsButton
                    userId={user.id}
                    dateStart={e.dateStart}
                    dateEnd={e.dateEnd}
                    ariaLabel="Download attachments"
                  >
                    <DownloadIcon /> Attachments
                  </AttachmentsButton>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
