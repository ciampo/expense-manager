'use client';

import { useState } from 'react';
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { extension } from 'mime-types';

import { createClient } from '@/utils/supabase/client';

// Allow downloading attachments. Options:
//   - Download multiple via set timeout (https://hyunbinseo.medium.com/download-multiple-files-with-javascript-and-anchor-element-20f89f500ab2)
//   - Download multiple with multi-download package (https://github.com/sindresorhus/multi-download)
//   - Create zip on the fly (https://stackoverflow.com/questions/56244902/how-in-js-to-download-more-than-10-files-in-browser-including-firefox)
//   - Produce bash script (current solution)

function slugify(str: string) {
  return str
    .replace(/^\s+|\s+$/g, '') // trim leading/trailing white space
    .toLowerCase() // convert string to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
}

export default function AttachmentsButton({
  children,
  ariaLabel,
  userId,
  dateStart,
  dateEnd,
}: {
  children: React.ReactNode;
  ariaLabel?: string;
  userId: string;
  dateStart: Date;
  dateEnd: Date;
}) {
  const supabase = createClient();
  const [downloading, setDownloading] = useState(false);
  const [noAttachmentsAvailable, setNoAttachmentsAvailable] = useState(false);

  const onButtonClick = async function () {
    setDownloading(true);

    const {
      data: expensesWithAttachmentsData,
      error: expensesWithAttachmentsError,
    } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .neq('attachment', null)
      .neq('attachment', '')
      .gte(
        'date',
        `${dateStart.getFullYear()}-${dateStart.getMonth() + 1}-${dateStart.getDate()}`
      )
      .lt(
        'date',
        `${dateEnd.getFullYear()}-${dateEnd.getMonth() + 1}-${dateEnd.getDate()}`
      );

    if (expensesWithAttachmentsError) {
      setDownloading(false);
      throw new Error(
        `Error while retrieving attachments data. ${expensesWithAttachmentsError.message}`
      );
    }

    if (expensesWithAttachmentsData.length === 0) {
      setDownloading(false);
      setNoAttachmentsAvailable(true);
      return;
    }

    try {
      const fileNames: string[] = [];

      const attachmentURLs = await Promise.allSettled(
        expensesWithAttachmentsData
          .filter(({ attachment }) => (attachment?.length ?? 0) > 0)
          .map((expense) => {
            fileNames.push(
              slugify(
                `${expense.date}-${expense.category}-${expense.merchant_name}-${expense.id}`
              )
            );
            return supabase.storage
              .from('expenses')
              .download(expense.attachment!);
          })
      );

      const attachmentBlobs = attachmentURLs.map((result, index) => {
        if (result.status === 'fulfilled' && result.value.data !== null) {
          const ext = extension(result.value.data.type) || '';

          return {
            // TODO: improve filename
            name: `${fileNames[index]}${!!ext ? `.${ext}` : ''}`,
            blob: result.value.data,
          };
        }
      });

      // Create a new zip file
      const zipFileWriter = new BlobWriter('application/zip');
      const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true });

      // Add each file to the zip file
      attachmentBlobs.forEach((downloadedFile) => {
        if (downloadedFile) {
          zipWriter.add(
            downloadedFile.name,
            new BlobReader(downloadedFile.blob)
          );
        }
      });

      // Download the zip file
      const url = URL.createObjectURL(await zipWriter.close());
      const link = document.createElement('a');

      const filenameYear = dateStart.getFullYear();
      const filenameMonth = `${dateStart.getMonth() + 1}`.padStart(2, '0');

      link.href = url;
      link.setAttribute(
        'download',
        `${filenameYear}-${filenameMonth}-expense-report.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(
          `Error while retrieving attachments data. ${e.message}`
        );
      }
    } finally {
      setDownloading(false);
    }
  };

  return noAttachmentsAvailable ? (
    <span className="inline-flex items-center gap-2 rounded px-4 py-1 bg-white text-slate-600 border border-current cursor-not-allowed">
      No attachments available
    </span>
  ) : (
    <button
      aria-label={ariaLabel}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded px-4 py-1 bg-white text-blue-700 border border-current underline-offset-2 hover:bg-blue-100 hover:underline focus:bg-blue-100 focus:underline focus:outline-none focus:shadow-outline disabled:text-slate-600 disabled:no-underline disabled:bg-white disabled:cursor-progress"
      onClick={onButtonClick}
    >
      {children}
    </button>
  );
}
