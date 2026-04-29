import * as FileSystem from 'expo-file-system';
import { DownloadTask } from '../../types/browser';

type Listener = (tasks: DownloadTask[]) => void;

class DownloadManager {
  private tasks: DownloadTask[] = [];
  private listeners = new Set<Listener>();
  private activeDownloads = new Map<string, FileSystem.DownloadResumable>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.tasks);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.tasks]));
  }

  enqueue(url: string, filename: string) {
    if (this.tasks.some((task) => task.url === url && ['queued', 'running'].includes(task.status))) {
      return;
    }

    const task: DownloadTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      filename,
      status: 'queued',
      progress: 0,
      retries: 0,
    };
    this.tasks = [task, ...this.tasks];
    this.emit();
    this.start(task.id);
  }

  async start(id: string) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    this.patch(id, { status: 'running' });

    const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
    const fileUri = `${directory}${task.filename}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      task.url,
      fileUri,
      {},
      ({ totalBytesExpectedToWrite, totalBytesWritten }) => {
        this.patch(id, {
          progress:
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0,
          status: 'running',
        });
      },
    );
    this.activeDownloads.set(id, downloadResumable);

    try {
      await downloadResumable.downloadAsync();
      this.patch(id, { status: 'complete', progress: 1 });
      this.activeDownloads.delete(id);
    } catch {
      this.patch(id, { status: 'failed', retries: task.retries + 1 });
      this.activeDownloads.delete(id);
    }
  }

  async pause(id: string) {
    const active = this.activeDownloads.get(id);
    if (!active) return;
    await active.pauseAsync();
    this.patch(id, { status: 'paused' });
  }

  async resume(id: string) {
    const active = this.activeDownloads.get(id);
    if (!active) {
      await this.start(id);
      return;
    }
    await active.resumeAsync();
    this.patch(id, { status: 'running' });
  }

  retry(id: string) {
    this.start(id);
  }

  private patch(id: string, patch: Partial<DownloadTask>) {
    this.tasks = this.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
    this.emit();
  }
}

export const downloadManager = new DownloadManager();
