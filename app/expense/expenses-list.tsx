'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { Database } from '@/utils/supabase/database.types';
import { createClient } from '@/utils/supabase/client';

export default function ExpensesList({ userId }: { userId: string }) {
  const supabase = createClient();

  const [expensesData, setExpensesData] = useState<
    Array<Database['public']['Tables']['expenses']['Row']>
  >([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Map<string, string>>(
    new Map()
  );

  // Fetch the expense list
  useEffect(() => {
    async function fetchExpensesData() {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        // TODO: handle error
        console.error(error.message);
      }

      // Reset attachment URL and expense data state.
      setAttachmentUrls(new Map());
      setExpensesData(data ?? []);
    }

    fetchExpensesData();
  }, [supabase, userId]);

  // Download images every time the expense list updates
  useEffect(() => {
    // TODO: handle errors
    Promise.all(
      expensesData.map(
        (expense) =>
          new Promise(async (resolve, reject) => {
            if (!expense.attachment) {
              resolve('');
              return;
            }
            const { data, error } = await supabase.storage
              .from('expenses')
              .download(expense.attachment);

            if (error) {
              reject(error.message);
              return;
            }

            const url = URL.createObjectURL(data);

            setAttachmentUrls(
              (prevAttachmentUrls) =>
                new Map(prevAttachmentUrls.set(`${expense.id}`, url))
            );
          })
      )
    );
  }, [expensesData, supabase]);

  if (expensesData.length === 0) {
    return <p>No expense data found</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full" style={{ minWidth: '40rem' }}>
        <thead className="sticky t-12">
          <tr className="bg-blue-800 text-white text-left">
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
          {expensesData.map((expense, i) => {
            // TODO: check it's an image
            const attachmentIsImage =
              /\.(gif|jpe?g|tiff?|png|webp|bmp|heic)$/i.test(
                expense.attachment ?? ''
              );
            const attachmentUrl = attachmentUrls.get(`${expense.id}`);
            return (
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
                  {!!attachmentUrl ? (
                    <Link
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachmentIsImage ? (
                        <Image
                          width={0}
                          height={0}
                          src={attachmentUrl}
                          alt="expense attachment"
                          className="w-32 h-auto max-h-20 object-cover"
                        />
                      ) : (
                        <span className="underline">Preview not available</span>
                      )}
                    </Link>
                  ) : (
                    'No attachment'
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
