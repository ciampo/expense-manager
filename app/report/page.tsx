'use client';
import { ChangeEventHandler, useEffect, useState } from 'react';

import { createClient } from '@/utils/supabase/client';

import type { Database } from '@/utils/supabase/database.types';

function slugify(str: string) {
  return str
    .replace(/^\s+|\s+$/g, '') // trim leading/trailing white space
    .toLowerCase() // convert string to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
}

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

export default function Home() {
  const supabase = createClient();

  const [, setError] = useState();
  const [userId, setUserId] = useState<string>();

  const [allExpensesByMonth, setAllExpensesByMonth] = useState<
    Array<Database['public']['Views']['how_many_expenses_by_month']['Row']>
  >([]);

  const [selectedMonth, setSelectedMonth] = useState<string>();

  const [selectedMonthReportData, setSelectedMonthReportData] = useState<
    Array<
      Database['public']['Views']['expenses_summary_by_date_and_category']['Row']
    >
  >([]);

  const [dataAsCSV, setDataAsCSV] = useState<string>();

  const [selectedMonthAttachments, setSelectedMonthAttachments] = useState<
    Array<{ url: string; filename: string }>
  >([]);

  // fetch and store user info
  useEffect(() => {
    async function fetchUserId() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user?.id || error) {
        setError(() => {
          throw new Error('Error while fetching user information');
        });
      } else {
        setUserId(user.id);
      }
    }

    fetchUserId();
  }, [supabase]);

  // Fetch the expense by month
  useEffect(() => {
    async function fetchExpenseData() {
      if (!userId) {
        return;
      }

      const { data, error } = await supabase
        .from('how_many_expenses_by_month')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        // TODO: handle error
        console.error(error.message);
      }

      setAllExpensesByMonth(data ?? []);
    }

    fetchExpenseData();
  }, [supabase, userId]);

  // fetch month report when user makes a month selection
  const onMonthSelected: ChangeEventHandler<HTMLSelectElement> = async (e) => {
    const date = new Date(e.target.value);

    const year = date.getFullYear();
    const month = date.getMonth();

    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthMonth = month === 11 ? 0 : month + 1;

    setSelectedMonth(`${year}-${`${month + 1}`.padStart(2, '0')}`);

    if (!userId) {
      return;
    }

    const { data, error } = await supabase
      .from('expenses_summary_by_date_and_category')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${year}-${month + 1}-01`)
      .lt('date', `${nextMonthYear}-${nextMonthMonth + 1}-01`);

    if (error) {
      // TODO: handle error
      console.error(error.message);
      setSelectedMonthReportData([]);
      return;
    }

    if (data && data.length > 0) {
      setSelectedMonthReportData(data);
    }
  };

  // create CSV report
  useEffect(() => {
    if (selectedMonthReportData.length === 0) {
      setDataAsCSV('');
      return;
    }

    setDataAsCSV(
      `data:text/csv;charset=utf-8,giorno,descrizione,aliquota,imponibile,imposta,imponibile,imposta,totale spese documentate\n${selectedMonthReportData
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
        .join('\n')}`
    );
  }, [selectedMonthReportData]);

  // get attachment list
  useEffect(() => {
    async function fetchedSelectedMonthAttachments() {
      if (!userId || !selectedMonth) {
        setSelectedMonthAttachments([]);
        return;
      }

      const date = new Date(selectedMonth);

      const year = date.getFullYear();
      const month = date.getMonth();

      const nextMonthYear = month === 11 ? year + 1 : year;
      const nextMonthMonth = month === 11 ? 0 : month + 1;

      const { data: expensesWithAttachments, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .neq('attachment', null)
        .gte('date', `${year}-${month + 1}-01`)
        .lt('date', `${nextMonthYear}-${nextMonthMonth + 1}-01`);

      if (error) {
        // TODO: handle error
        console.error(error.message);
      }

      if (expensesWithAttachments && expensesWithAttachments.length) {
        // TODO: handle errors
        Promise.all(
          expensesWithAttachments.map(
            (expense) =>
              new Promise<{ url: string; filename: string }>(
                async (resolve, reject) => {
                  if (!expense.attachment) {
                    reject(undefined);
                    return;
                  }
                  const { data, error } = await supabase.storage
                    .from('expenses')
                    .createSignedUrl(expense.attachment, 60);

                  if (error) {
                    reject(error.message);
                    return;
                  }

                  const { extension } =
                    data.signedUrl.match(/(?<extension>\.\w+)\\?\?/i)?.groups ||
                    {};

                  console.log(extension);

                  resolve({
                    url: data.signedUrl,
                    filename: `${selectedMonth}/${slugify(
                      `${expense.date}-${expense.category}-${expense.merchant_name}-${expense.id}`
                    )}${extension ?? ''}`,
                  });
                }
              )
          )
        ).then((values) => {
          setSelectedMonthAttachments(values);
        });
      }
    }

    fetchedSelectedMonthAttachments();
  }, [supabase, userId, selectedMonth]);

  console.log(
    selectedMonthAttachments
      .map(({ url, filename }, i) => `curl --create-dirs -o ${filename} ${url}`)
      .join(' && ')
  );

  return (
    <main className="min-h-dvh">
      <h1>Generate report</h1>

      <select name="expenses_month" onChange={onMonthSelected}>
        {allExpensesByMonth.length === 0 ? (
          <option value="">Loading data</option>
        ) : (
          <>
            <option value="">Select a month</option>
            {allExpensesByMonth.map(({ count, month }) => {
              if (!month || !count) {
                return null;
              }

              const date = new Date(month);
              const monthFormatted = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

              return (
                <option key={month} value={month}>
                  {monthFormatted} [{count} expenses]
                </option>
              );
            })}
          </>
        )}
      </select>

      {selectedMonthReportData.length > 0 && (
        <>
          <p>Report</p>
          <table>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedMonthReportData.map(
                ({ category, date, total_amount }) => {
                  if (!date || !category || !total_amount) {
                    return null;
                  }

                  return (
                    <tr key={slugify(`${date}-${category}`)}>
                      <td>{new Date(date).getDate()}</td>
                      <td>{category}</td>
                      <td>{total_amount}</td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </>
      )}

      {!!selectedMonth && !!dataAsCSV && (
        <a
          href={encodeURI(dataAsCSV)}
          download={`${selectedMonth}-expense-report.csv`}
        >
          Download CSV
        </a>
      )}
    </main>
  );
}
