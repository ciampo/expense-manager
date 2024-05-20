'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import Image from 'next/image';
import Link from 'next/link';

import { createExpense } from './actions';

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
  categories,
}: {
  categories?: string[];
}) {
  const [state, formAction] = useActionState(createExpense, initialState);
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

      // If none of the above scenarios happened, it means that there isn't
      // any attachment to preview.
      setAttachmentPreviewUrl({ isImage: false, value: '' });
    }

    createAttachmentPreview();
  }, [attachmentInputValue]);

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
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="category"
        >
          Category
        </label>

        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          id="category"
          name="category"
          list={categories?.length ? 'category-options' : undefined}
          required
          placeholder="Expense category"
        />

        {categories?.length && (
          <datalist id="category-options">
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </datalist>
        )}
      </div>

      <div className="mb-6">
        <label
          className="block text-gray-800 text-sm font-semibold mb-2"
          htmlFor="attachment"
        >
          Attachment
        </label>
        <input
          className="shadow appearance-none border border-gray-500 rounded w-full py-2 px-3 text-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          name="attachment"
          id="attachment"
          type="file"
          ref={attachmentInputRef}
          onChange={(e) => setAttachmentInputValue(e.target.value)}
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
      </div>

      <SubmitButton>Save</SubmitButton>
      <p aria-live="polite">{state?.message}</p>
    </form>
  );
}
