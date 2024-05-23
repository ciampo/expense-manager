declare module 'multi-download' {
  /**
   * Returns a Promise that resolves when all the downloads have started.
   *
   * @param urls
   * @param options
   */
  export default function multiDownload(
    urls: string[],
    options?: {
      rename?: (arguments: {
        url: string;
        index: number;
        urls: string[];
      }) => string;
    }
  ): Promise;
}
