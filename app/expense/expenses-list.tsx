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
    <table>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Merchant</th>
          <th scope="col">Amount</th>
          <th scope="col">Category</th>
          <th scope="col">Attachment</th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        {expensesData.map((expense, i) => {
          // TODO: check it's an image
          const attachmentHasImageExtension =
            /\.(gif|jpe?g|tiff?|png|webp|bmp|heic)$/i.test(
              expense.attachment ?? ''
            );
          const attachmentUrl = attachmentUrls.get(`${expense.id}`);
          return (
            <tr key={expense.id}>
              <td>{expense.date}</td>
              <td>{expense.merchant_name}</td>
              <td>{expense.amount}</td>
              <td>{expense.category}</td>
              {/* TODO: optimize resize */}
              <td>
                {attachmentUrl && attachmentHasImageExtension ? (
                  <Image
                    width={0}
                    height={0}
                    src={attachmentUrl}
                    alt="expense attachment"
                    className="w-12 h-auto"
                  />
                ) : attachmentUrl && expense.attachment ? (
                  <Link
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopened noreferrer"
                  >
                    Open in new tab (preview not available)
                  </Link>
                ) : (
                  'No attachment'
                )}
              </td>
              <td>
                <Link href={`/expense/edit/${expense.id}`}>Edit</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
