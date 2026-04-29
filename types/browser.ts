export type BrowserTab = {
  id: string;
  title: string;
  url: string;
  incognito: boolean;
  userAgentMode: 'mobile' | 'desktop';
  readerModeEnabled: boolean;
};

export type DownloadTask = {
  id: string;
  url: string;
  filename: string;
  status: 'queued' | 'running' | 'paused' | 'failed' | 'complete';
  progress: number;
  retries: number;
  segments?: number;
};

export type ProxyProfile = {
  id: string;
  name: string;
  host: string;
  port: number;
  region: string;
  timezone: string;
  geoLat: number;
  geoLng: number;
};

export type ReaderPayload = {
  title: string;
  text: string;
};
