import * as FileSystem from 'expo-file-system';
import { DownloadTask } from '../../types/browser';

type Listener = (tasks: DownloadTask[]) => void;

const DEFAULT_SEGMENTS = 4;
const MAX_RETRIES = 3;

class DownloadManager {
  private tasks: DownloadTask[] = [];
  private listeners = new Set<Listener>();
  private activeDownloads = new Set<string>();
  private maxConcurrent = 2;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.tasks);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.tasks]));
  }

  enqueue(url: string, filename: string, segments = DEFAULT_SEGMENTS) {
    if (this.tasks.some((task) => task.url === url && ['queued', 'running', 'paused'].includes(task.status))) {
      return;
    }

    const task: DownloadTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      filename,
      status: 'queued',
      progress: 0,
      retries: 0,
      segments,
    };
    this.tasks = [task, ...this.tasks];
    this.emit();
    this.pumpQueue();
  }

  private runningCount() {
    return this.tasks.filter((t) => t.status === 'running').length;
  }

  private getDownloadDirectory(): string | null {
    return FileSystem.documentDirectory ?? null;
  }

  private pumpQueue() {
    while (this.runningCount() < this.maxConcurrent) {
      const next = this.tasks.find((t) => t.status === 'queued');
      if (!next) break;
      this.start(next.id);
    }
  }

  async start(id: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task || task.status === 'running' || this.activeDownloads.has(id)) return;

    this.patch(id, { status: 'running' });

    const directory = this.getDownloadDirectory();
    if (!directory) {
      this.patch(id, { status: 'failed' });
      this.pumpQueue();
      return;
    }

    const fileUri = `${directory}${task.filename}`;
    this.activeDownloads.add(id);

    try {
      await FileSystem.downloadAsync(task.url, fileUri, {
        headers: {
          'X-Download-Segments': String(task.segments ?? DEFAULT_SEGMENTS),
        },
      });
      this.patch(id, { status: 'complete', progress: 1 });
    } catch {
      const retryCount = task.retries + 1;
      this.patch(id, { status: retryCount <= MAX_RETRIES ? 'queued' : 'failed', retries: retryCount });
    } finally {
      this.activeDownloads.delete(id);
      this.pumpQueue();
    }
  }

  async pause(id: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'queued') {
      this.patch(id, { status: 'paused' });
    }
  }

  async resume(id: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task || task.status !== 'paused') return;
    this.patch(id, { status: 'queued' });
    this.pumpQueue();
  }

  retry(id: string) {
    this.patch(id, { status: 'queued' });
    this.pumpQueue();
  }

  private patch(id: string, patch: Partial<DownloadTask>) {
    this.tasks = this.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
    this.emit();
  }
}

export const downloadManager = new DownloadManager();
