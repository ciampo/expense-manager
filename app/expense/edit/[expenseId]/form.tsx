'use client';

import { useState, useEffect, useActionState, useRef } from 'react';

import { useFormStatus } from 'react-dom';

import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@/utils/supabase/client';
import { Database } from '@/utils/supabase/database.types';

import { updateExpense } from './actions';

const initialState = {
  message: '',
};

const urlIsImage = (url: string) =>
  /\.(gif|jpe?g|tiff?|png|webp|bmp|heic)$/i.test(url);

const AttachmentPreview = ({
  url,
  isImage,
}: {
  url?: string;
  isImage: boolean;
}) => {
  if (!url) {
    return null;
  }

  return isImage ? (
    <Image
      width={0}
      height={0}
      src={url}
      alt="expense attachment"
      className="w-12 h-auto"
    />
  ) : (
    <Link href={url} target="_blank" rel="noopened noreferrer">
      Open in new tab (preview not available)
    </Link>
  );
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded px-4 py-2 bg-blue-700 text-white underline-offset-2 hover:bg-blue-600 hover:underline focus:bg-blue-600 focus:underline focus:outline-none focus:shadow-outline disabled:bg-slate-800 disabled:opacity-50 disabled:no-underline"
      type="submit"
      disabled={pending}
    >
      {children}
    </button>
  );
}

export default function EditExpenseForm({
  expenseData,
}: {
  expenseData: Database['public']['Tables']['expenses']['Row'];
}) {
  const supabase = createClient();

  const [state, formAction] = useActionState(updateExpense, initialState);

  const [removeFetchedExpenseAttachment, setRemoveFetchedExpenseAttachment] =
    useState(false);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState({
    isImage: false,
    value: '',
  });

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachmentInputValue, setAttachmentInputValue] = useState('');

  // update attachment preview URL every time the expense data updates OR
  // if the user selects a new attachment
  useEffect(() => {
    async function createAttachmentPreview() {
      // Create a preview URL for the user's selected new attachment
      if (
        attachmentInputValue &&
        attachmentInputRef.current?.files &&
        attachmentInputRef.current.files.length > 0
      ) {
        setAttachmentPreviewUrl({
          isImage: urlIsImage(attachmentInputRef.current.files[0].name),
          value: URL.createObjectURL(attachmentInputRef.current.files[0]),
        });
        return;
      }

      // Create a preview URL for the attachment of the fetched expense
      if (!removeFetchedExpenseAttachment && expenseData?.attachment) {
        const { data, error } = await supabase.storage
          .from('expenses')
          .download(expenseData.attachment);

        if (error) {
          console.error(error.message);
          return;
        }

        const url = URL.createObjectURL(data);

        setAttachmentPreviewUrl({
          isImage: urlIsImage(expenseData.attachment),
          value: url,
        });

        return;
      }

      // If none of the above scenarios happened, it means that there isn't
      // any attachment to preview.
      setAttachmentPreviewUrl({ isImage: false, value: '' });
    }

    createAttachmentPreview();
  }, [
    removeFetchedExpenseAttachment,
    attachmentInputValue,
    expenseData?.attachment,
    supabase,
  ]);

  return (
    <form action={formAction}>
      <input type="hidden" value={expenseData.id} id="id" name="id" />

      <input
        type="hidden"
        value={expenseData.attachment ?? ''}
        id="previous_attachment"
        name="previous_attachment"
      />

      <input
        type="hidden"
        value={removeFetchedExpenseAttachment ? 'true' : 'false'}
        id="remove_original_attachment"
        name="remove_original_attachment"
      />

      <p>
        <label htmlFor="date">Date</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={expenseData?.date ?? ''}
        />
      </p>

      <p>
        {/* Pre-populate with existing merchants? */}
        <label htmlFor="merchant_name">Merchant</label>
        <input
          id="merchant_name"
          name="merchant_name"
          required
          placeholder="Merchant name"
          defaultValue={expenseData?.merchant_name ?? ''}
        />
      </p>

      <p>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          id="amount"
          name="amount"
          required
          placeholder="Expense amount"
          defaultValue={expenseData?.amount ?? ''}
        />
      </p>

      <p>
        {/* Allow a new category + existing ones? */}
        {/* Store existing cats to an array */}
        <label htmlFor="category">Category</label>
        {/* Conditional loading to make defaultValue work on select */}
        {expenseData?.category ? (
          <select
            name="category"
            id="category"
            required
            defaultValue={expenseData.category}
          >
            <option value="" hidden>
              Expense category
            </option>
            {['coworking', 'test'].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        ) : null}
      </p>

      <p>
        {expenseData.attachment && !removeFetchedExpenseAttachment ? (
          <>
            Attachment
            <AttachmentPreview
              url={attachmentPreviewUrl.value}
              isImage={attachmentPreviewUrl.isImage}
            />
            <button
              onClick={() => setRemoveFetchedExpenseAttachment(true)}
              type="button"
            >
              Remove attachment
            </button>
          </>
        ) : (
          <>
            <label htmlFor="attachment">Attachment</label>
            <input
              name="attachment"
              id="attachment"
              type="file"
              ref={attachmentInputRef}
              onChange={(e) => setAttachmentInputValue(e.target.value)}
            />
            <AttachmentPreview
              url={attachmentPreviewUrl.value}
              isImage={attachmentPreviewUrl.isImage}
            />
            <button
              onClick={() => {
                if (attachmentInputRef.current) {
                  attachmentInputRef.current.value = '';
                  setAttachmentInputValue('');
                }
              }}
              type="button"
              className="mt-4 p-1 border-2 disabled:bg-slate-800 disabled:opacity-50 disabled:no-underline"
              disabled={!attachmentInputValue}
            >
              Remove attachment
            </button>
          </>
        )}
      </p>

      <SubmitButton>Save</SubmitButton>
      <p aria-live="polite">{state?.message}</p>
    </form>
  );
}
