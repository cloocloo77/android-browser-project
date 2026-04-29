import { BrowserTab } from '../../types/browser';

const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createTab = (url = 'https://example.com', incognito = false): BrowserTab => ({
  id: mkId(),
  title: 'New Tab',
  url,
  incognito,
  userAgentMode: 'mobile',
});

export const updateTab = (tabs: BrowserTab[], id: string, patch: Partial<BrowserTab>) =>
  tabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab));
