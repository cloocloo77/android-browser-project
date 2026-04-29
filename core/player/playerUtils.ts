import { detectMediaFromUrl } from '../media/mediaDetector';

export const canOpenInInternalPlayer = (url: string) => detectMediaFromUrl(url);
