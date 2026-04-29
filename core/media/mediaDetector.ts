const MEDIA_EXTENSIONS = ['.mp4', '.webm', '.m3u8', '.mp3', '.aac', '.wav'];

export const detectMediaFromUrl = (url: string): boolean =>
  MEDIA_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

export const extractFilename = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop();
    return lastSegment && lastSegment.length > 0 ? lastSegment : `download-${Date.now()}`;
  } catch {
    return `download-${Date.now()}`;
  }
};
