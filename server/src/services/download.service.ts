import type { DownloadQueueItem, CreateDownloadInput} from '../types/download.types.js';

export const downloadService = {
  getQueue: async (): Promise<DownloadQueueItem[]> => {
    // TODO: Query download queue
    return [];
  },

  addToQueue: async (data: CreateDownloadInput): Promise<DownloadQueueItem> => {
    // TODO: Add to download queue
    throw new Error('Not implemented');
  },

  removeFromQueue: async (id: string): Promise<void> => {
    // TODO: Remove from queue
    throw new Error('Not implemented');
  },

  updateProgress: async (id: string, progress: number): Promise<void> => {
    // TODO: Update download progress
    throw new Error('Not implemented');
  },
};
