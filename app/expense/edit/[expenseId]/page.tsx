'use client';
import {
  FormEventHandler,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import { useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@/utils/supabase/client';
import { Database } from '@/utils/supabase/database.types';

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

export default function Page({ params }: { params: { expenseId: string } }) {
  const supabase = createClient();

  const router = useRouter();

  const [userId, setUserId] = useState<string>('');
  const [, setError] = useState();

  const [fetchedExpenseData, setFetchedExpenseData] =
    useState<Database['public']['Tables']['expenses']['Row']>();
  const [removeFetchedExpenseAttachment, setRemoveFetchedExpenseAttachment] =
    useState(false);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState({
    isImage: false,
    value: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachmentInputValue, setAttachmentInputValue] = useState('');

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

  // Fetch the expense info
  useEffect(() => {
    async function fetchExpenseData() {
      if (!userId) {
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('id', params.expenseId);

      if (error) {
        // TODO: handle error
        console.error(error.message);
      }

      setFetchedExpenseData(data?.length ? data[0] : undefined);
    }

    fetchExpenseData();
  }, [supabase, userId, params.expenseId]);

  // TODO: try moving it to server actions under lib/actions
  // TODO: create profile too?
  // TODO: error validation?
  // TODO: picture upload?
  // TODO: loading
  const updateExpense = useCallback(
    (formData: FormData) => {
      async function updateExpense(
        newExpenseData: Database['public']['Tables']['expenses']['Update'] & {
          attachment?: File | null | undefined;
        }
      ) {
        if (!userId || !fetchedExpenseData?.id) {
          return;
        }

        // TODO: data validation

        setIsUploading(true);

        let attachmentUploadError;
        let filePath;

        // Upload new attachment
        if (
          newExpenseData.attachment &&
          newExpenseData.attachment.size > 0 &&
          newExpenseData.attachment.name.length > 0
        ) {
          const fileExt = newExpenseData.attachment.name.split('.').pop();
          filePath = `${userId}/${Math.random()}.${fileExt}`;

          const { error } = await supabase.storage
            .from('expenses')
            .upload(filePath, newExpenseData.attachment);

          attachmentUploadError = error;
        }

        if (attachmentUploadError) {
          console.error(attachmentUploadError);
          // TODO: show error to user
          setIsUploading(false);
          return;
        }

        const { data, error: databaseError } = await supabase
          .from('expenses')
          .update({ ...newExpenseData, attachment: filePath })
          .eq('id', fetchedExpenseData.id);

        if (databaseError) {
          console.error(databaseError);
          // TODO: show error to user
          setIsUploading(false);
          return;
        }

        // if needed, delete the previous image
        if (removeFetchedExpenseAttachment && fetchedExpenseData?.attachment) {
          const { error } = await supabase.storage
            .from('expenses')
            .remove([fetchedExpenseData.attachment]);

          if (error) {
            console.error(error);
            // TODO: show error to user
            setIsUploading(false);
            return;
          } else {
            // Setting to null to remove attachment from database
            filePath ??= null;
          }
        }

        // TODO: avoid refreshing the page?
        // Everything went fine, redirect to home
        router.push('/');
      }

      updateExpense(Object.fromEntries(formData.entries()));
    },
    [
      userId,
      fetchedExpenseData?.id,
      fetchedExpenseData?.attachment,
      removeFetchedExpenseAttachment,
      supabase,
      router,
    ]
  );

  const onFormSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      if (isUploading) {
        e.preventDefault();
      }
    },
    [isUploading]
  );

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
      if (!removeFetchedExpenseAttachment && fetchedExpenseData?.attachment) {
        const { data, error } = await supabase.storage
          .from('expenses')
          .download(fetchedExpenseData.attachment);

        if (error) {
          console.error(error.message);
          return;
        }

        const url = URL.createObjectURL(data);

        setAttachmentPreviewUrl({
          isImage: urlIsImage(fetchedExpenseData.attachment),
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
    fetchedExpenseData?.attachment,
    supabase,
  ]);

  return (
    <div>
      <h1>Edit existing expense</h1>
      {fetchedExpenseData === undefined ? null : (
        <form action={updateExpense} onSubmit={onFormSubmit}>
          <p>
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              required
              disabled={isUploading}
              defaultValue={fetchedExpenseData?.date ?? ''}
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
              disabled={isUploading}
              defaultValue={fetchedExpenseData?.merchant_name ?? ''}
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
              disabled={isUploading}
              defaultValue={fetchedExpenseData?.amount ?? ''}
            />
          </p>

          <p>
            {/* Allow a new category + existing ones? */}
            {/* Store existing cats to an array */}
            <label htmlFor="category">Category</label>
            {/* Conditional loading to make defaultValue work on select */}
            {fetchedExpenseData?.category ? (
              <select
                name="category"
                id="category"
                required
                disabled={isUploading}
                defaultValue={fetchedExpenseData.category}
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
            {fetchedExpenseData?.attachment &&
            !removeFetchedExpenseAttachment ? (
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
                  disabled={isUploading}
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

          <button
            className="mt-4 p-1 border-2 disabled:bg-slate-800 disabled:opacity-50 disabled:no-underline"
            type="submit"
            disabled={isUploading}
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
