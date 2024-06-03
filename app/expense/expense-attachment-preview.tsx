'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { Database } from '@/utils/supabase/database.types';

import { createClient } from '@/utils/supabase/client';

const eyeSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="w-6 h-6"
    role="presentation"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      d="M12 3c-7.41 0-9 1.59-9 9s1.59 9 9 9 9-1.59 9-9"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20.5 3.5 15 9m1-6h4.67c.18 0 .33.15.33.33V8"
    />
  </svg>
);

function urlHasImageExtension(url: string) {
  return /\.(gif|jpe?g|tiff?|png|webp|bmp|heic)$/i.test(url);
}

async function updateAttachmentPreviewURL(attachment: string | null) {
  const supabase = createClient();

  if (!attachment) {
    return undefined;
  }

  const { data, error } = await supabase.storage
    .from('expenses')
    .download(attachment);

  if (error) {
    throw new Error(error.message);
  }

  return URL.createObjectURL(data);
}

export default function ExpenseAttachmentPreview({
  attachment,
}: {
  attachment: Database['public']['Tables']['expenses']['Row']['attachment'];
}) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    updateAttachmentPreviewURL(attachment)
      .then((url) => {
        setPreviewUrl(url);
      })
      .catch((error) => {
        setErrorMessage(error);
      });
  }, [attachment]);

  if (errorMessage) {
    return <span>Error: ${errorMessage}</span>;
  }

  if (!previewUrl) {
    return (
      <span>
        <span className="sr-only">
          {!attachment ? 'No attachment' : 'Loading attachment'}
        </span>
        <span aria-hidden="true">{!attachment ? '—' : '...'}</span>
      </span>
    );
  }

  return (
    <Link href={previewUrl} target="_blank" rel="noopener noreferrer">
      {/* {urlHasImageExtension(attachment!) ? (
        <Image
          width={0}
          height={0}
          src={previewUrl}
          alt="expense attachment preview"
          className="w-20 h-20 object-cover rounded"
        />
      ) : ( */}
      <span>
        <span className="sr-only">Open preview in new tab</span>
        {eyeSvg}
      </span>
      {/* )} */}
    </Link>
  );
}
