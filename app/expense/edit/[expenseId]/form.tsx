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
  children,
  className,
}: {
  url?: string;
  isImage: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  if (!url) {
    return null;
  }

  return (
    <div className={`relative w-full ${className}`}>
      {isImage ? (
        <Image
          width={0}
          height={0}
          src={url}
          alt="expense attachment"
          className="w-full h-auto"
        />
      ) : (
        <Link href={url} target="_blank" rel="noopener noreferrer">
          Open in new tab (preview not available)
        </Link>
      )}
      {children}
    </div>
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
    <form
      className="bg-white shadow-md rounded px-8 py-6 mb-4"
      action={formAction}
    >
      <div className="mb-4">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="date"
        >
          Date
        </label>
        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          id="date"
          name="date"
          type="date"
          required
          defaultValue={expenseData?.date ?? ''}
        />
      </div>

      {/* TODO: use datalist to auto-suggest existing merchants? */}
      <div className="mb-4">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="merchant_name"
        >
          Merchant
        </label>
        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          id="merchant_name"
          name="merchant_name"
          required
          placeholder="Merchant name"
          defaultValue={expenseData?.merchant_name ?? ''}
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="amount"
        >
          Amount
        </label>
        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          type="number"
          min="0.01"
          step="0.01"
          id="amount"
          name="amount"
          required
          placeholder="Expense amount"
          defaultValue={expenseData?.amount ?? ''}
        />
      </div>

      {/* Allow a new category + existing ones? */}
      <div className="mb-4">
        {/* Store existing cats to an array */}
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="category"
        >
          Category
        </label>
        {/* Conditional loading to make defaultValue work on select */}
        <select
          className="shadow border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          name="category"
          id="category"
          required
          defaultValue={expenseData.category!}
        >
          <option value="">Expense category</option>
          {['coworking', 'test'].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        {expenseData.attachment && !removeFetchedExpenseAttachment ? (
          <>
            <p className="block text-gray-800 text-sm font-semibold mb-2">
              Attachment
            </p>
            <AttachmentPreview
              url={attachmentPreviewUrl.value}
              isImage={attachmentPreviewUrl.isImage}
            >
              <button
                onClick={() => setRemoveFetchedExpenseAttachment(true)}
                type="button"
                aria-label="Remove attachment"
                className="absolute right-0 top-0 flex items-center justify-center bg-white border border-black border-solid w-8 h-8"
              >
                X
              </button>
            </AttachmentPreview>
          </>
        ) : (
          <>
            <label
              className="block text-gray-800 text-sm font-semibold mb-2"
              htmlFor="new_attachment"
            >
              Attachment
            </label>
            <input
              className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
              name="new_attachment"
              id="new_attachment"
              type="file"
              ref={attachmentInputRef}
              onChange={(e) => {
                setAttachmentInputValue(e.target.value);
              }}
            />
            <AttachmentPreview
              url={attachmentPreviewUrl.value}
              isImage={attachmentPreviewUrl.isImage}
              className="mt-2"
            >
              <button
                onClick={() => {
                  if (attachmentInputRef.current) {
                    attachmentInputRef.current.value = '';
                    setAttachmentInputValue('');
                  }
                }}
                type="button"
                aria-label="Remove attachment"
                className="absolute right-0 top-0 flex items-center justify-center bg-white border border-black border-solid w-8 h-8"
                disabled={!attachmentInputValue}
              >
                X
              </button>
            </AttachmentPreview>
          </>
        )}
      </div>

      {/* Hidden */}
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
      <input type="hidden" value={expenseData.id} id="id" name="id" />

      {/* Submit */}
      <SubmitButton>Save</SubmitButton>

      {/* Message */}
      <p aria-live="polite">{state?.message}</p>
    </form>
  );
}
