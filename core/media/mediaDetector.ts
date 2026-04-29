const MEDIA_EXTENSIONS = ['.mp4', '.webm', '.m3u8', '.mp3', '.aac', '.wav', '.ogg', '.m4a'];
const DOWNLOAD_HINTS = ['download', 'attachment', 'content-disposition', 'filename'];

const safeParseUrl = (input: string) => {
  try {
    return new URL(input);
  } catch {
    return null;
  }
};

export const detectMediaFromUrl = (url: string): boolean => {
  const parsed = safeParseUrl(url);
  if (parsed) {
    const pathname = parsed.pathname.toLowerCase();
    return MEDIA_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  }

  const normalized = url.toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => normalized.includes(ext));
};

export const isLikelyDownloadUrl = (url: string): boolean => {
  const parsed = safeParseUrl(url);
  if (parsed) {
    const pathname = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();
    const hasDownloadParam = Array.from(parsed.searchParams.entries()).some(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      const normalizedValue = value.toLowerCase();
      return (
        DOWNLOAD_HINTS.some((hint) => normalizedKey.includes(hint)) ||
        DOWNLOAD_HINTS.some((hint) => normalizedValue.includes(hint))
      );
    });

    return pathname.includes('/download') || hasDownloadParam || DOWNLOAD_HINTS.some((hint) => query.includes(hint));
  }

  const normalized = url.toLowerCase();
  return DOWNLOAD_HINTS.some((hint) => normalized.includes(hint));
};

export const extractFilename = (url: string): string => {
  const fallback = `download-${Date.now()}`;
  const sanitize = (value: string) =>
    value
      .replace(/[\\/:*?"<>|]/g, '_')
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 0x20;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop();
    const safeName = sanitize(lastSegment?.split('?')[0] ?? '');
    return safeName.length > 0 ? safeName : fallback;
  } catch {
    return fallback;
  }
};
