export type QueuedActionType =
  | 'CREATE_SALE'
  | 'CANCEL_SALE'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'CREATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'CREATE_REFUND'
  | 'CREATE_CASH_MOVEMENT'
  | 'CREATE_CASH_CLOSING'
  | 'CREATE_SUPPLIER'
  | 'UPDATE_SUPPLIER'
  | 'DELETE_SUPPLIER'
  | 'CREATE_SUPPLIER_PAYMENT'
  | 'CREATE_EXPENSE'
  | 'DELETE_EXPENSE';

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  title: string;
  details?: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
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
      id: 'q_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_queue_updated', { detail: { count: queue.length } }));
    } catch {}
    return item;
  },

  dequeue(id: string) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_queue_updated', { detail: { count: queue.length } }));
    } catch {}
  },

  removeQueuedActionsForEntity(entityId: string) {
    if (!entityId) return;
    const queue = this.getQueue().filter((item) => {
      const p = item.payload;
      if (!p) return true;
      if (p.id === entityId || (p.product && p.product.id === entityId) || (p.client && p.client.id === entityId)) {
        return false;
      }
      return true;
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_queue_updated', { detail: { count: queue.length } }));
    } catch {}
  },

  updateItem(id: string, updates: Partial<QueuedAction>) {
    const queue = this.getQueue().map((item) => (item.id === id ? { ...item, ...updates } : item));
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_queue_updated', { detail: { count: queue.length } }));
    } catch {}
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_queue_updated', { detail: { count: 0 } }));
    } catch {}
  },

  clearBoutiqueData(boutiqueId: string) {
    if (!boutiqueId) return;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX) && key.includes(boutiqueId)) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  },

  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      this.clearQueue();
    } catch {}
  },
};
