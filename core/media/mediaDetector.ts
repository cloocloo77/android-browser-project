const MEDIA_EXTENSIONS = ['.mp4', '.webm', '.m3u8', '.mp3', '.aac', '.wav', '.ogg', '.m4a'];
const DOWNLOAD_HINTS = ['download=', 'attachment', 'content-disposition'];

export const detectMediaFromUrl = (url: string): boolean => {
  const normalized = url.toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => normalized.includes(ext));
};

export const isLikelyDownloadUrl = (url: string): boolean => {
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
