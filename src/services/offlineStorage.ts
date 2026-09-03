export interface QueuedAction {
  id: string;
  type: 'CREATE_SALE' | 'CREATE_PRODUCT' | 'CREATE_REFUND' | 'CREATE_CASH_MOVEMENT';
  payload: unknown;
  timestamp: string;
  retryCount: number;
}

const CACHE_PREFIX = 'boutiquepro_cache_';
const QUEUE_KEY = 'boutiquepro_offline_queue';

export const offlineStorage = {
  getCache<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(CACHE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCache<T>(key: string, data: T) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch {
      // LocalStorage full or private browsing
    }
  },

  getQueue(): QueuedAction[] {
    try {
      const q = localStorage.getItem(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  },

  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): QueuedAction {
    const queue = this.getQueue();
    const item: QueuedAction = {
      ...action,
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item;
  },

  dequeue(id: string) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },
};
