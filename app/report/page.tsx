import { createClient } from '@/utils/supabase/server';

// TODO:
// 2. Allow downloading attachments:
//   - Download multiple via set timeout (https://hyunbinseo.medium.com/download-multiple-files-with-javascript-and-anchor-element-20f89f500ab2)
//   - Download multiple with multi-download package (https://github.com/sindresorhus/multi-download)
//   - Create zip on the fly (https://stackoverflow.com/questions/56244902/how-in-js-to-download-more-than-10-files-in-browser-including-firefox)
//   - Produce bash script (current solution)

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

      const filteredExpenseData = expenseSummaryData.filter(({ date }) => {
        if (!date) {
          return false;
        }

        const expenseDate = new Date(date);

        return expenseDate >= thisMonthDate && expenseDate < nextMonthDate;
      });

      const csvData = `data:text/csv;charset=utf-8,${MONTH_NAMES[thisMonthMonth]}\ngiorno,descrizione,aliquota,imponibile,imposta,imponibile,imposta,totale spese documentate\n${filteredExpenseData
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
        count,
        csvFilename: `${thisMonthYear}-${`${thisMonthMonth + 1}`.padStart(2, '0')}-expense-report.csv`,
        csvData,
      } as Data;
    }
  );

  return (
    <div className="min-h-dvh pt-8 max-w-screen-lg mx-auto">
      <h1 className="text-blue-800 text-3xl mb-8">Generate reports</h1>

      {aggregatedData.length === 0 ? (
        <p>No expense data available</p>
      ) : (
        <ul className="w-full bg-white shadow-md rounded border border-blue-800">
          {aggregatedData.map((e, i) =>
            e === null ? null : (
              <li
                className={`border-t first:border-none border-t-slate-400 bg-opacity-30 ${i % 2 === 0 ? 'bg-blue-100' : 'bg-white'} px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between`}
                key={e.id}
              >
                <p className="flex flex-row items-center gap-2 md:flex-col md:items-start">
                  <span className="font-medium text-lg">{e.dateFormatted}</span>
                  <span>[{e.count} expenses]</span>
                </p>
                <div>
                  <a
                    href={encodeURI(e.csvData)}
                    download={e.csvFilename}
                    className="inline-block rounded px-4 py-1 bg-white text-blue-700 border border-current underline-offset-2 hover:bg-blue-100 hover:underline focus:bg-blue-100 focus:underline focus:outline-none focus:shadow-outline"
                  >
                    Download CSV
                  </a>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
