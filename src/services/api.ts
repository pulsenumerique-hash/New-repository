import {
  User,
  Boutique,
  Product,
  Sale,
  Client,
  Refund,
  CashMovement,
  CashClosing,
  DashboardStats,
  ActiveSession,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'boutiquepro_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // If hosted statically (e.g. Netlify) and server API is not available
    throw new Error(`API endpoint unavailable or returned non-JSON (${response.status})`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null);
    }
    const errorMsg = data.error || data.message || `Erreur serveur (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  syncSession: (user: Partial<User>) =>
    request<{
      message: string;
      token: string;
      user: User;
      boutique: Boutique;
      session_id: string;
    }>('/api/auth/sync-session', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  register: (payload: {
    first_name: string;
    last_name: string;
    boutique_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) =>
    request<{
      message: string;
      token: string;
      user: User;
      boutique: Boutique;
      session_id: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{
      message: string;
      token: string;
      user: User;
      boutique: Boutique;
      session_id: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleLogin: (payload: { email: string; name: string; picture?: string; google_id?: string }) =>
    request<{
      message: string;
      token: string;
      user: User;
      boutique: Boutique;
      session_id: string;
    }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{
      user: User;
      boutique: Boutique;
      stats?: DashboardStats;
      session_id: string;
    }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; simulation_link?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getSessions: () => request<{ sessions: ActiveSession[] }>('/api/auth/sessions'),
  revokeSession: (sessionId: string) =>
    request<{ message: string }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' }),
  revokeAllOtherSessions: () =>
    request<{ message: string }>('/api/auth/sessions/revoke-all', { method: 'POST' }),

  // Cashiers
  getCashiers: () => request<{ cashiers: User[] }>('/api/cashiers'),
  createCashier: (payload: { first_name: string; last_name: string; email: string; password: string }) =>
    request<{ message: string; cashier: User }>('/api/cashiers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  toggleCashierStatus: (id: string, is_active: boolean) =>
    request<{ message: string; cashier: User }>(`/api/cashiers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),
  deleteCashier: (id: string) => request<{ message: string }>(`/api/cashiers/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: () => request<{ products: Product[] }>('/api/products'),
  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) => request<{ message: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: () => request<{ sales: Sale[] }>('/api/sales'),
  createSale: (payload: {
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
    payment_type: 'cash' | 'credit';
    client_id?: string | null;
    client_name?: string | null;
  }) =>
    request<{ message: string; sale: Sale; stats: DashboardStats }>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Clients
  getClients: () => request<{ clients: Client[] }>('/api/clients'),
  createClient: (payload: { name: string; phone?: string; notes?: string }) =>
    request<{ client: Client }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteClient: (id: string) => request<{ message: string }>(`/api/clients/${id}`, { method: 'DELETE' }),

  // Refunds
  getRefunds: () => request<{ refunds: Refund[] }>('/api/refunds'),
  createRefund: (payload: { client_id: string; amount: number; note?: string }) =>
    request<{ message: string; refund: Refund; client: Client; stats: DashboardStats }>('/api/refunds', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Cash Movements
  getCashMovements: () => request<{ movements: CashMovement[] }>('/api/cash/movements'),
  createWithdrawal: (payload: { amount: number; reason: string; author: string }) =>
    request<{ message: string; movement: CashMovement; stats: DashboardStats }>('/api/cash/withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createInjection: (payload: { amount: number; reason: string; author: string }) =>
    request<{ message: string; movement: CashMovement; stats: DashboardStats }>('/api/cash/injections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Cash Closings
  getCashClosings: () => request<{ closings: CashClosing[] }>('/api/cash/closings'),
  createCashClosing: (payload: { counted_cash: number; notes?: string }) =>
    request<{ message: string; closing: CashClosing }>('/api/cash/closings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Stats & Audit
  getDashboardStats: () => request<{ stats: DashboardStats }>('/api/dashboard/stats'),
  getAuditLogs: () => request<{ logs: AuditLog[] }>('/api/audit-logs'),

  // Sync
  getDelta: (since?: string) =>
    request<{
      products: Product[];
      sales: Sale[];
      clients: Client[];
      refunds: Refund[];
      cash_movements: CashMovement[];
      cash_closings: CashClosing[];
      stats: DashboardStats;
      server_timestamp: string;
    }>(`/api/sync/delta${since ? `?since=${encodeURIComponent(since)}` : ''}`),

  // Reset
  resetBoutiqueBusinessData: () =>
    request<{ message: string }>('/api/boutique/reset', {
      method: 'POST',
    }),
};
