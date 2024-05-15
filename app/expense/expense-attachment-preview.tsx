'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { Database } from '@/utils/supabase/database.types';

import { createClient } from '@/utils/supabase/client';

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
      <span className="block min-w-40">
        <span className="sr-only">
          {!attachment ? 'No attachment' : 'Loading attachment'}
        </span>
        <span aria-hidden="true">
          {!attachment ? '—' : 'Loading preview...'}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={previewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-40"
    >
      {urlHasImageExtension(attachment!) ? (
        <Image
          width={0}
          height={0}
          src={previewUrl}
          alt="expense attachment"
          className="w-32 h-auto max-h-20 object-cover"
        />
      ) : (
        <span className="underline">Preview not available</span>
      )}
    </Link>
  );
}
