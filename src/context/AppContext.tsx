import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Product,
  Sale,
  Client,
  ClientReminderRecord,
  Refund,
  CashMovement,
  CashClosing,
  DashboardStats,
  ActiveSession,
  Supplier,
  SupplierPayment,
  Expense,
  ExpenseCategory,
  AuditLog,
  PaymentType,
  PaymentMethodDetail,
  Boutique,
  User,
} from '../types';
import { firebaseDb } from '../services/firebaseDb';
import { offlineStorage, QueuedAction } from '../services/offlineStorage';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  refunds: Refund[];
  movements: CashMovement[];
  closings: CashClosing[];
  sessions: ActiveSession[];
  suppliers: Supplier[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  stats: DashboardStats | null;
  realtimeStatus: 'connected' | 'reconnecting' | 'offline';
  isLoadingData: boolean;
  lastSyncTime: string | null;
  pendingSyncCount: number;
  pendingQueue: QueuedAction[];
  isSyncingQueue: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  lockPin: string;
  setLockPin: (pin: string) => void;
  unlockWithPin: (pin: string) => boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  refreshData: () => Promise<void>;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; errorCount: number }>;
  clearOfflineQueue: () => void;
  createSale: (payload: {
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
    payment_type: PaymentType;
    payment_method_detail?: PaymentMethodDetail;
    client_id?: string | null;
    client_name?: string | null;
    client_phone?: string | null;
  }) => Promise<Sale>;
  cancelSale: (saleId: string, reason: string) => Promise<void>;
  createProduct: (payload: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, payload: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  createClient: (payload: { name: string; phone?: string; notes?: string; due_date?: string }) => Promise<Client>;
  updateClient: (id: string, payload: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  sendClientReminder: (client: Client) => Promise<void>;
  createRefund: (payload: { client_id: string; amount: number; note?: string }) => Promise<Refund>;
  createWithdrawal: (payload: { amount: number; reason: string; author: string }) => Promise<CashMovement>;
  createInjection: (payload: { amount: number; reason: string; author: string }) => Promise<CashMovement>;
  createCashClosing: (payload: { counted_cash: number; notes?: string }) => Promise<CashClosing>;
  createSupplier: (payload: Partial<Supplier>) => Promise<Supplier>;
  updateSupplier: (id: string, payload: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;
  createSupplierPayment: (payload: {
    supplier_id: string;
    amount: number;
    payment_method: 'cash' | 'mobile_money' | 'other';
    notes?: string;
  }) => Promise<SupplierPayment>;
  createExpense: (payload: {
    category: ExpenseCategory;
    category_label: string;
    amount: number;
    description: string;
    payment_method: 'cash' | 'mobile_money';
  }) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  createAuditLog: (
    action: AuditLog['action'],
    entity_type: AuditLog['entity_type'],
    details: string,
    entity_id?: string
  ) => Promise<void>;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => Promise<{ success: boolean; message: string; counts: Record<string, number> }>;
  saveCloudBackup: () => Promise<string>;
  getCloudBackups: () => Promise<Array<{
    id: string;
    title: string;
    item_count: number;
    created_by: string;
    created_at: string;
    data_json: string;
  }>>;
  restoreCloudBackup: (backupId: string) => Promise<void>;
  resetAllBusinessData: () => Promise<void>;
  updateBoutiqueSettings: (settings: Partial<Boutique>) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  cashiers: User[];
  createCashier: (payload: { first_name: string; last_name: string; email: string; password?: string }) => Promise<void>;
  toggleCashierStatus: (id: string, is_active: boolean) => Promise<void>;
  deleteCashier: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to guarantee a pure zeroed stats state on any new boutique
const createZeroStats = (): DashboardStats => ({
  solde_caisse: 0,
  ventes_jour: 0,
  ventes_semaine: 0,
  ventes_mois: 0,
  ventes_cash_total: 0,
  ventes_mobile_money_total: 0,
  ventes_credit_total: 0,
  valeur_stock_achat: 0,
  valeur_stock_vente: 0,
  total_credits_en_cours: 0,
  nb_clients_debiteurs: 0,
  nb_credits_en_retard: 0,
  total_dettes_fournisseurs: 0,
  total_depenses_mois: 0,
  benefice_brut_estime: 0,
  benefice_net_reel: 0,
  nb_produits: 0,
  nb_produits_alerte: 0,
  nb_produits_perimes: 0,
  nb_produits_bientot_perimes: 0,
  retraits_total: 0,
  injections_total: 0,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, boutique, role } = useAuth();
  const activeBoutiqueIdRef = useRef<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cashiers, setCashiers] = useState<User[]>([]);

  const [isAppLocked, setIsAppLocked] = useState(false);
  const [lockPin, setLockPinState] = useState<string>(() => localStorage.getItem('boutiquepro_lock_pin') || '1234');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('boutiquepro_theme') as 'light' | 'dark') || 'light');

  const setLockPin = useCallback((pin: string) => {
    setLockPinState(pin);
    localStorage.setItem('boutiquepro_lock_pin', pin);
  }, []);

  const unlockWithPin = useCallback((pin: string): boolean => {
    if (pin === lockPin) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  }, [lockPin]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('boutiquepro_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auto-lock after 5 minutes of inactivity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isAuthenticated) {
          setIsAppLocked(true);
        }
      }, 5 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [isAuthenticated]);

  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connected'
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingQueue, setPendingQueue] = useState<QueuedAction[]>(() => offlineStorage.getQueue());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => offlineStorage.getQueue().length);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const isSyncingQueueRef = useRef(false);

  // Default tab based on role: Cashier starts on POS, Admin on Dashboard
  const [activeTab, setActiveTab] = useState<string>('pos');

  // Adjust active tab when role is loaded
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab((prev) => (prev === 'pos' ? 'dashboard' : prev));
    } else if (role === 'cashier') {
      setActiveTab('pos');
    }
  }, [role]);

  // Initial local cache hydration on boutique load (Zero waiting offline)
  useEffect(() => {
    activeBoutiqueIdRef.current = boutique?.id || null;

    if (boutique?.id) {
      // Purge any stale memory from another account and load strictly this boutique's cache
      const cachedProducts = offlineStorage.getCache<Product[]>(`products_${boutique.id}`) || [];
      const cachedSales = offlineStorage.getCache<Sale[]>(`sales_${boutique.id}`) || [];
      const cachedClients = offlineStorage.getCache<Client[]>(`clients_${boutique.id}`) || [];
      const cachedRefunds = offlineStorage.getCache<Refund[]>(`refunds_${boutique.id}`) || [];
      const cachedMovements = offlineStorage.getCache<CashMovement[]>(`movements_${boutique.id}`) || [];
      const cachedClosings = offlineStorage.getCache<CashClosing[]>(`closings_${boutique.id}`) || [];
      const cachedSuppliers = offlineStorage.getCache<Supplier[]>(`suppliers_${boutique.id}`) || [];
      const cachedExpenses = offlineStorage.getCache<Expense[]>(`expenses_${boutique.id}`) || [];
      const cachedAuditLogs = offlineStorage.getCache<AuditLog[]>(`auditlogs_${boutique.id}`) || [];
      const cachedCashiers = offlineStorage.getCache<User[]>(`cashiers_${boutique.id}`) || [];
      const cachedStats = offlineStorage.getCache<DashboardStats>(`stats_${boutique.id}`);

      setProducts(cachedProducts);
      setSales(cachedSales);
      setClients(cachedClients);
      setRefunds(cachedRefunds);
      setMovements(cachedMovements);
      setClosings(cachedClosings);
      setSuppliers(cachedSuppliers);
      setExpenses(cachedExpenses);
      setAuditLogs(cachedAuditLogs);
      setCashiers(cachedCashiers);

      if (cachedStats) {
        setStats(cachedStats);
      } else {
        // ALWAYS start a brand-new boutique with strictly 0 FCFA in the cash register
        setStats(createZeroStats());
      }
    } else {
      setProducts([]);
      setSales([]);
      setClients([]);
      setRefunds([]);
      setMovements([]);
      setClosings([]);
      setSessions([]);
      setSuppliers([]);
      setExpenses([]);
      setAuditLogs([]);
      setCashiers([]);
      setStats(null);
    }
  }, [boutique?.id]);

  // Listen to offline queue events across the application
  useEffect(() => {
    const handleQueueUpdate = () => {
      const q = offlineStorage.getQueue();
      setPendingQueue(q);
      setPendingSyncCount(q.length);
    };
    window.addEventListener('boutiquepro_queue_updated', handleQueueUpdate);
    handleQueueUpdate();
    return () => {
      window.removeEventListener('boutiquepro_queue_updated', handleQueueUpdate);
    };
  }, []);

  // Compute live dashboard stats whenever boutique or sub-collections change
  useEffect(() => {
    if (boutique && activeBoutiqueIdRef.current === boutique.id) {
      const liveStats = firebaseDb.calculateDashboardStats(
        boutique,
        products,
        sales,
        clients,
        refunds,
        movements,
        suppliers,
        expenses
      );
      setStats(liveStats);
      offlineStorage.setCache(`stats_${boutique.id}`, liveStats);
    }
  }, [boutique, products, sales, clients, refunds, movements, suppliers, expenses]);

  // Synchronization Engine: Replay queued offline items to Firestore
  const syncNow = useCallback(async () => {
    if (isSyncingQueueRef.current) {
      return { success: true, syncedCount: 0, errorCount: 0 };
    }
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, errorCount: 0 };
    }

    isSyncingQueueRef.current = true;
    setIsSyncingQueue(true);

    const currentQueue = offlineStorage.getQueue();
    let synced = 0;
    let errors = 0;

    for (const item of currentQueue) {
      try {
        switch (item.type) {
          case 'CREATE_SALE':
            await firebaseDb.saveSale(item.payload.sale, products, clients);
            break;
          case 'CANCEL_SALE':
            await firebaseDb.cancelSale(
              item.payload.sale,
              item.payload.reason,
              item.payload.cancelledByName,
              products,
              clients
            );
            break;
          case 'CREATE_PRODUCT':
            await firebaseDb.saveProduct(item.payload);
            break;
          case 'UPDATE_PRODUCT':
            await firebaseDb.updateProduct(item.payload.id, item.payload.updates);
            break;
          case 'DELETE_PRODUCT':
            await firebaseDb.deleteProduct(item.payload.id);
            break;
          case 'CREATE_CLIENT':
            await firebaseDb.saveClient(item.payload);
            break;
          case 'DELETE_CLIENT':
            await firebaseDb.deleteClient(item.payload.id);
            break;
          case 'CREATE_REFUND':
            await firebaseDb.saveRefund(item.payload.refund, item.payload.client);
            break;
          case 'CREATE_CASH_MOVEMENT':
            await firebaseDb.saveCashMovement(item.payload);
            break;
          case 'CREATE_CASH_CLOSING':
            await firebaseDb.saveCashClosing(item.payload);
            break;
          case 'CREATE_SUPPLIER':
            await firebaseDb.saveSupplier(item.payload);
            break;
          case 'UPDATE_SUPPLIER':
            await firebaseDb.updateSupplier(item.payload.id, item.payload.updates);
            break;
          case 'DELETE_SUPPLIER':
            await firebaseDb.deleteSupplier(item.payload.id);
            break;
          case 'CREATE_SUPPLIER_PAYMENT':
            await firebaseDb.saveSupplierPayment(item.payload.payment, item.payload.supplier);
            break;
          case 'CREATE_EXPENSE':
            await firebaseDb.saveExpense(item.payload);
            break;
          case 'DELETE_EXPENSE':
            await firebaseDb.deleteExpense(item.payload.id);
            break;
        }
        offlineStorage.dequeue(item.id);
        synced++;
      } catch (err: any) {
        console.warn(`Sync queue item ${item.id} (${item.title}) failed:`, err);
        offlineStorage.updateItem(item.id, {
          retryCount: (item.retryCount || 0) + 1,
          lastError: err?.message || 'Erreur réseau',
        });
        errors++;
      }
    }

    const updatedQueue = offlineStorage.getQueue();
    setPendingQueue(updatedQueue);
    setPendingSyncCount(updatedQueue.length);
    setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    setIsSyncingQueue(false);
    isSyncingQueueRef.current = false;

    return { success: errors === 0, syncedCount: synced, errorCount: errors };
  }, [products, clients]);

  // Network connection monitor & automatic sync replay
  useEffect(() => {
    const handleOnline = () => {
      setRealtimeStatus('connected');
      // Auto-trigger sync when returning online
      syncNow();
    };
    const handleOffline = () => setRealtimeStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check to replay pending actions if online
    const interval = setInterval(() => {
      if (navigator.onLine && offlineStorage.getQueue().length > 0 && !isSyncingQueueRef.current) {
        syncNow();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncNow]);

  // Real-time Firestore Multi-Device Subscriptions (`onSnapshot`)
  useEffect(() => {
    if (!isAuthenticated || !boutique?.id) {
      setProducts([]);
      setSales([]);
      setClients([]);
      setRefunds([]);
      setMovements([]);
      setClosings([]);
      setSessions([]);
      setSuppliers([]);
      setExpenses([]);
      setAuditLogs([]);
      setCashiers([]);
      setStats(null);
      return;
    }

    setIsLoadingData(true);

    const unsubProducts = firebaseDb.subscribeProducts(boutique.id, (prods) => {
      setProducts(prods);
      offlineStorage.setCache(`products_${boutique.id}`, prods);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      setIsLoadingData(false);
    });

    const unsubSales = firebaseDb.subscribeSales(boutique.id, (sList) => {
      setSales(sList);
      offlineStorage.setCache(`sales_${boutique.id}`, sList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubClients = firebaseDb.subscribeClients(boutique.id, (cList) => {
      setClients(cList);
      offlineStorage.setCache(`clients_${boutique.id}`, cList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubRefunds = firebaseDb.subscribeRefunds(boutique.id, (rList) => {
      setRefunds(rList);
      offlineStorage.setCache(`refunds_${boutique.id}`, rList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubMovements = firebaseDb.subscribeCashMovements(boutique.id, (mList) => {
      setMovements(mList);
      offlineStorage.setCache(`movements_${boutique.id}`, mList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubClosings = firebaseDb.subscribeCashClosings(boutique.id, (cList) => {
      setClosings(cList);
      offlineStorage.setCache(`closings_${boutique.id}`, cList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubSessions = firebaseDb.subscribeActiveSessions(boutique.id, (sList) => {
      setSessions(sList);
    });

    const unsubSuppliers = firebaseDb.subscribeSuppliers(boutique.id, (supList) => {
      setSuppliers(supList);
      offlineStorage.setCache(`suppliers_${boutique.id}`, supList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubExpenses = firebaseDb.subscribeExpenses(boutique.id, (expList) => {
      setExpenses(expList);
      offlineStorage.setCache(`expenses_${boutique.id}`, expList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubAuditLogs = firebaseDb.subscribeAuditLogs(boutique.id, (logList) => {
      setAuditLogs(logList);
      offlineStorage.setCache(`auditlogs_${boutique.id}`, logList);
    });

    const unsubCashiers = firebaseDb.subscribeCashiers(boutique.id, (cList) => {
      setCashiers(cList);
      offlineStorage.setCache(`cashiers_${boutique.id}`, cList);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubClients();
      unsubRefunds();
      unsubMovements();
      unsubClosings();
      unsubSessions();
      unsubSuppliers();
      unsubExpenses();
      unsubAuditLogs();
      unsubCashiers();
    };
  }, [isAuthenticated, boutique?.id, user?.id, user?.role, user?.first_name, user?.last_name]);

  const refreshData = useCallback(async () => {
    setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    const q = offlineStorage.getQueue();
    setPendingSyncCount(q.length);
    setPendingQueue(q);
    if (navigator.onLine && q.length > 0) {
      await syncNow();
    }
  }, [syncNow]);

  const clearOfflineQueue = useCallback(() => {
    offlineStorage.clearQueue();
    setPendingQueue([]);
    setPendingSyncCount(0);
  }, []);

  // --- ACTIONS WITH OPTIMISTIC UPDATES & OFFLINE PERSISTENCE ---

  // --- AUDIT TRAIL LOGGING ---
  const createAuditLog = async (
    action: AuditLog['action'],
    entity_type: AuditLog['entity_type'],
    details: string,
    entity_id?: string
  ): Promise<void> => {
    if (!boutique || !user) return;
    const now = new Date().toISOString();
    const log: AuditLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      user_role: user.role,
      action,
      entity_type,
      entity_id,
      details,
      timestamp: now,
      created_at: now,
    };
    setAuditLogs((prev) => [log, ...prev]);
    firebaseDb.saveAuditLog(log).catch(() => {});
  };

  const createSale = async (payload: {
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
    payment_type: PaymentType;
    payment_method_detail?: PaymentMethodDetail;
    client_id?: string | null;
    client_name?: string | null;
    client_phone?: string | null;
  }): Promise<Sale> => {
    if (!boutique || !user) throw new Error('Utilisateur non connecté.');

    let finalClientId = payload.client_id || null;
    let finalClientName = payload.client_name || null;
    const cleanPhone = payload.client_phone ? payload.client_phone.trim() : null;

    if (payload.payment_type === 'credit') {
      if (!finalClientName && !finalClientId && !cleanPhone) {
        throw new Error('Pour une vente à crédit, le nom et le numéro WhatsApp du client sont obligatoires.');
      }

      // 1. Chercher d'abord si un client existe avec ce numéro WhatsApp
      if (cleanPhone) {
        const normalizedDigits = cleanPhone.replace(/[^0-9]/g, '');
        const matchByPhone = clients.find(
          (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === normalizedDigits
        );
        if (matchByPhone) {
          finalClientId = matchByPhone.id;
          finalClientName = matchByPhone.name;
        }
      }

      // 2. Si pas trouvé par téléphone, chercher par nom ou identifiant
      if (!finalClientId && finalClientName) {
        const match = clients.find((c) => c.name.toLowerCase() === finalClientName!.trim().toLowerCase());
        if (match) {
          finalClientId = match.id;
          finalClientName = match.name;
          if (!match.phone && cleanPhone) {
            updateClient(match.id, { phone: cleanPhone });
          }
        } else {
          const newClient: Client = {
            id: 'cli_' + Math.random().toString(36).substring(2, 9),
            boutique_id: boutique.id,
            name: finalClientName.trim(),
            phone: cleanPhone || undefined,
            credit_balance: 0,
            total_credit_purchased: 0,
            total_repaid: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          // Optimistic local add
          setClients((prev) => [newClient, ...prev]);
          if (navigator.onLine) {
            firebaseDb.saveClient(newClient).catch(() => {
              offlineStorage.enqueue({
                type: 'CREATE_CLIENT',
                title: `Nouveau client : ${newClient.name}`,
                payload: newClient,
              });
            });
          } else {
            offlineStorage.enqueue({
              type: 'CREATE_CLIENT',
              title: `Nouveau client : ${newClient.name}`,
              payload: newClient,
            });
          }
          finalClientId = newClient.id;
          finalClientName = newClient.name;
        }
      }
    }

    let totalAmount = 0;
    const processedItems = [];

    for (const item of payload.items) {
      const product = products.find((p) => p.id === item.product_id);
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || (product ? product.unit_sale_price : 0);
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;

      processedItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: lineTotal,
        unit_purchase_price: product ? product.unit_purchase_price : 0,
      });
    }

    const now = new Date().toISOString();
    const defaultDetail =
      payload.payment_type === 'cash'
        ? 'cash'
        : payload.payment_type === 'credit'
        ? 'credit'
        : 'wave';

    const sale: Sale = {
      id: 'sale_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      items: processedItems,
      total_amount: totalAmount,
      payment_type: payload.payment_type,
      payment_method_detail: payload.payment_method_detail || defaultDetail,
      status: 'completed',
      client_id: finalClientId,
      client_name: finalClientName,
      cashier_id: user.id,
      cashier_name: `${user.first_name} ${user.last_name}`,
      date: now,
      created_at: now,
    };

    // 1. Optimistic Stock Deduction (Immediate feedback in UI & local cache)
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const itemMatch = processedItems.find((i) => i.product_id === p.id);
        if (itemMatch) {
          const newUnitStock = Math.max(0, (p.unit_stock || 0) - itemMatch.quantity);
          const newPkgStock = Math.floor(newUnitStock / (p.units_per_package || 1));
          return {
            ...p,
            unit_stock: newUnitStock,
            package_stock: newPkgStock,
            updated_at: now,
          };
        }
        return p;
      });
      offlineStorage.setCache(`products_${boutique.id}`, updated);
      return updated;
    });

    // 2. Optimistic Client Credit Update if credit sale
    if (payload.payment_type === 'credit' && finalClientId) {
      setClients((prev) => {
        const updated = prev.map((c) => {
          if (c.id === finalClientId) {
            return {
              ...c,
              credit_balance: (c.credit_balance || 0) + totalAmount,
              total_credit_purchased: (c.total_credit_purchased || 0) + totalAmount,
              updated_at: now,
            };
          }
          return c;
        });
        offlineStorage.setCache(`clients_${boutique.id}`, updated);
        return updated;
      });
    }

    // 3. Optimistic Sale list update
    setSales((prev) => {
      const updated = [sale, ...prev];
      offlineStorage.setCache(`sales_${boutique.id}`, updated);
      return updated;
    });

    // 4. Send to Firebase or Enqueue safely for offline persistence
    if (navigator.onLine) {
      try {
        await firebaseDb.saveSale(sale, products, clients);
        setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      } catch (err) {
        console.warn('Network error during saveSale, queuing for sync:', err);
        offlineStorage.enqueue({
          type: 'CREATE_SALE',
          title: `Vente #${sale.id.slice(-5)} — ${totalAmount.toLocaleString('fr-FR')} FCFA`,
          details: `${processedItems.length} article(s) • ${payload.payment_type}`,
          payload: { sale, items: processedItems },
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_SALE',
        title: `Vente #${sale.id.slice(-5)} — ${totalAmount.toLocaleString('fr-FR')} FCFA`,
        details: `${processedItems.length} article(s) • ${payload.payment_type}`,
        payload: { sale, items: processedItems },
      });
    }

    createAuditLog(
      'CREATE',
      'sale',
      `Vente #${sale.id.slice(-5)} (${totalAmount.toLocaleString('fr-FR')} FCFA via ${payload.payment_type})`,
      sale.id
    );

    return sale;
  };

  const cancelSale = async (saleId: string, reason: string): Promise<void> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Vente introuvable.');
    if (sale.status === 'cancelled') throw new Error('Cette vente a déjà été annulée.');

    const cancelledByName = `${user.first_name} ${user.last_name}`;
    const cancelledAt = new Date().toISOString();

    // 1. Optimistic update in sales
    setSales((prev) => {
      const updated = prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'cancelled' as const,
              cancellation_reason: reason,
              cancelled_at: cancelledAt,
              cancelled_by_name: cancelledByName,
            }
          : s
      );
      offlineStorage.setCache(`sales_${boutique.id}`, updated);
      return updated;
    });

    // 2. Optimistic Stock Restitution
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const itemMatch = sale.items.find((it) => it.product_id === p.id);
        if (itemMatch) {
          const newUnitStock = (p.unit_stock || 0) + itemMatch.quantity;
          const newPkgStock = p.units_per_package > 0 ? Math.floor(newUnitStock / p.units_per_package) : 0;
          return {
            ...p,
            unit_stock: newUnitStock,
            package_stock: newPkgStock,
            updated_at: cancelledAt,
          };
        }
        return p;
      });
      offlineStorage.setCache(`products_${boutique.id}`, updated);
      return updated;
    });

    // 3. Optimistic Client Debt Reversion if credit sale
    if (sale.payment_type === 'credit' && sale.client_id) {
      setClients((prev) => {
        const updated = prev.map((c) => {
          if (c.id === sale.client_id) {
            return {
              ...c,
              credit_balance: Math.max(0, (c.credit_balance || 0) - sale.total_amount),
              total_credit_purchased: Math.max(0, (c.total_credit_purchased || 0) - sale.total_amount),
              updated_at: cancelledAt,
            };
          }
          return c;
        });
        offlineStorage.setCache(`clients_${boutique.id}`, updated);
        return updated;
      });
    }

    // 4. Firebase or Enqueue
    if (navigator.onLine) {
      try {
        await firebaseDb.cancelSale(sale, reason, cancelledByName, products, clients);
      } catch {
        offlineStorage.enqueue({
          type: 'CANCEL_SALE',
          title: `Annulation vente #${sale.id.slice(-5)}`,
          details: `Motif : ${reason}`,
          payload: { sale, reason, cancelledByName },
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CANCEL_SALE',
        title: `Annulation vente #${sale.id.slice(-5)}`,
        details: `Motif : ${reason}`,
        payload: { sale, reason, cancelledByName },
      });
    }

    createAuditLog(
      'CANCEL_SALE',
      'sale',
      `Annulation vente #${sale.id.slice(-5)} (${sale.total_amount.toLocaleString('fr-FR')} FCFA). Motif : ${reason}`,
      sale.id
    );
  };

  const createProduct = async (payload: Partial<Product>): Promise<Product> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');

    const pkgPrice = Number(payload.package_purchase_price) || 0;
    const unitsPerPkg = Math.max(1, Number(payload.units_per_package) || 1);
    const calculatedUnitPurchasePrice = Math.round((pkgPrice / unitsPerPkg) * 100) / 100;
    const salePrice = Number(payload.unit_sale_price) || 0;
    const pkgStock = Number(payload.package_stock) || 0;
    const totalUnitStock = payload.unit_stock !== undefined && Number(payload.unit_stock) > 0 ? Number(payload.unit_stock) : pkgStock * unitsPerPkg;

    const now = new Date().toISOString();
    const product: Product = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      name: payload.name ? payload.name.trim() : 'Nouveau Produit',
      category: payload.category ? payload.category.trim() : 'Épicerie',
      package_type: payload.package_type ? payload.package_type.trim() : 'Unité',
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: salePrice,
      package_stock: pkgStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: Number(payload.min_alert_threshold) || 10,
      expiration_date: payload.expiration_date ? String(payload.expiration_date) : undefined,
      supplier_id: payload.supplier_id ? String(payload.supplier_id) : undefined,
      barcode: payload.barcode ? String(payload.barcode).trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    setProducts((prev) => {
      const updated = [product, ...prev];
      offlineStorage.setCache(`products_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveProduct(product);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_PRODUCT',
          title: `Ajout produit : ${product.name}`,
          details: `Stock initial: ${product.unit_stock} unités`,
          payload: product,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_PRODUCT',
        title: `Ajout produit : ${product.name}`,
        details: `Stock initial: ${product.unit_stock} unités`,
        payload: product,
      });
    }

    createAuditLog('CREATE', 'product', `Création produit "${product.name}" (stock: ${product.unit_stock})`, product.id);
    return product;
  };

  const updateProduct = async (id: string, payload: Partial<Product>): Promise<Product> => {
    const existing = products.find((p) => p.id === id);
    if (!existing) throw new Error('Produit introuvable.');

    const pkgPrice = payload.package_purchase_price !== undefined ? Number(payload.package_purchase_price) : existing.package_purchase_price;
    const unitsPerPkg = payload.units_per_package !== undefined ? Math.max(1, Number(payload.units_per_package)) : existing.units_per_package;
    const calculatedUnitPurchasePrice = Math.round((pkgPrice / unitsPerPkg) * 100) / 100;

    let totalUnitStock = existing.unit_stock;
    if (payload.unit_stock !== undefined) {
      totalUnitStock = Number(payload.unit_stock);
    } else if (payload.package_stock !== undefined) {
      totalUnitStock = Number(payload.package_stock) * unitsPerPkg;
    }

    const packageStock = payload.package_stock !== undefined ? Number(payload.package_stock) : Math.floor(totalUnitStock / unitsPerPkg);

    const updates: Partial<Product> = {
      name: payload.name ? payload.name.trim() : existing.name,
      category: payload.category ? payload.category.trim() : existing.category,
      package_type: payload.package_type ? payload.package_type.trim() : existing.package_type,
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: payload.unit_sale_price !== undefined ? Number(payload.unit_sale_price) : existing.unit_sale_price,
      package_stock: packageStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: payload.min_alert_threshold !== undefined ? Number(payload.min_alert_threshold) : existing.min_alert_threshold,
      expiration_date: payload.expiration_date !== undefined ? payload.expiration_date : existing.expiration_date,
      supplier_id: payload.supplier_id !== undefined ? payload.supplier_id : existing.supplier_id,
      barcode: payload.barcode !== undefined ? String(payload.barcode) : existing.barcode,
    };

    const updatedProduct = { ...existing, ...updates, updated_at: new Date().toISOString() };

    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? updatedProduct : p));
      if (boutique) offlineStorage.setCache(`products_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.updateProduct(id, updates);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'UPDATE_PRODUCT',
          title: `Mise à jour : ${existing.name}`,
          details: `Nouveau stock : ${totalUnitStock} unités`,
          payload: { id, updates },
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'UPDATE_PRODUCT',
        title: `Mise à jour : ${existing.name}`,
        details: `Nouveau stock : ${totalUnitStock} unités`,
        payload: { id, updates },
      });
    }

    createAuditLog('UPDATE', 'product', `Modification produit "${updatedProduct.name}"`, id);
    return updatedProduct;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const existing = products.find((p) => p.id === id);

    // Prevent any enqueued offline creation/update from reviving this product later
    offlineStorage.removeQueuedActionsForEntity(id);

    // Immediate optimistic local update
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (boutique) offlineStorage.setCache(`products_${boutique.id}`, updated);
      return updated;
    });

    // Remove from active cart in localStorage if present
    try {
      localStorage.removeItem('boutiquepro_cart');
      if (boutique) localStorage.removeItem(`boutiquepro_cart_${boutique.id}`);
      window.dispatchEvent(new CustomEvent('boutiquepro_cart_clear'));
    } catch {}

    // Delete in Firebase & Backend API
    try {
      await firebaseDb.deleteProduct(id);
    } catch (err) {
      console.warn('Firebase deleteProduct enqueued:', err);
      offlineStorage.enqueue({
        type: 'DELETE_PRODUCT',
        title: `Suppression : ${existing?.name || id}`,
        payload: { id },
      });
    }

    api.deleteProduct(id).catch(() => {});
    createAuditLog('DELETE', 'product', `Suppression définitive du produit "${existing?.name || id}"`, id);
  };

  const createClient = async (payload: { name: string; phone?: string; notes?: string; due_date?: string }): Promise<Client> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');
    const now = new Date().toISOString();
    const client: Client = {
      id: 'cli_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : undefined,
      credit_balance: 0,
      total_credit_purchased: 0,
      total_repaid: 0,
      notes: payload.notes ? payload.notes.trim() : undefined,
      due_date: payload.due_date ? payload.due_date : undefined,
      created_at: now,
      updated_at: now,
    };

    setClients((prev) => {
      const updated = [client, ...prev];
      offlineStorage.setCache(`clients_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveClient(client);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_CLIENT',
          title: `Nouveau client : ${client.name}`,
          details: client.phone || 'Sans contact',
          payload: client,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_CLIENT',
        title: `Nouveau client : ${client.name}`,
        details: client.phone || 'Sans contact',
        payload: client,
      });
    }

    createAuditLog('CREATE', 'client', `Client "${client.name}" créé`, client.id);
    return client;
  };

  const updateClient = async (id: string, payload: Partial<Client>): Promise<Client> => {
    const existing = clients.find((c) => c.id === id);
    if (!existing) throw new Error('Client introuvable.');

    const now = new Date().toISOString();
    const updatedClient: Client = {
      ...existing,
      ...payload,
      updated_at: now,
    };

    setClients((prev) => {
      const updated = prev.map((c) => (c.id === id ? updatedClient : c));
      if (boutique) offlineStorage.setCache(`clients_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveClient(updatedClient);
      } catch {
        offlineStorage.enqueue({
          type: 'CREATE_CLIENT',
          title: `Mise à jour client : ${updatedClient.name}`,
          payload: updatedClient,
        });
      }
    }

    return updatedClient;
  };

  const deleteClient = async (id: string): Promise<void> => {
    const client = clients.find((c) => c.id === id);
    if (!client) throw new Error('Client introuvable.');
    if (client.credit_balance > 0) {
      throw new Error(`Impossible de supprimer : le client a une dette en cours de ${client.credit_balance.toLocaleString('fr-FR')} FCFA.`);
    }

    // Prevent any enqueued offline creation/update from reviving this client later
    offlineStorage.removeQueuedActionsForEntity(id);

    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (boutique) offlineStorage.setCache(`clients_${boutique.id}`, updated);
      return updated;
    });

    try {
      await firebaseDb.deleteClient(id);
    } catch (err) {
      console.warn('Firebase deleteClient enqueued:', err);
      offlineStorage.enqueue({
        type: 'DELETE_CLIENT',
        title: `Suppression client : ${client.name}`,
        payload: { id },
      });
    }

    api.deleteClient(id).catch(() => {});
    createAuditLog('DELETE', 'client', `Suppression définitive du client "${client.name}"`, id);
  };

  const sendClientReminder = async (client: Client): Promise<void> => {
    const now = new Date().toISOString();
    const todayDateStr = now.split('T')[0];

    const newRecord: ClientReminderRecord = {
      date: now,
      amount: client.credit_balance,
      channel: 'whatsapp',
      sent_by: user ? `${user.first_name} ${user.last_name}` : 'Admin',
    };

    const updatedHistory = [...(client.reminder_history || []), newRecord];
    await updateClient(client.id, {
      last_reminder_date: now,
      reminder_history: updatedHistory,
    });

    const boutiqueName = boutique?.name || 'Notre boutique';
    const amount = (client.credit_balance || 0).toLocaleString('fr-FR');
    const message = encodeURIComponent(
      `Bonjour ${client.name}, sauf erreur de notre part, vous avez un solde restant dû de ${amount} FCFA chez ${boutiqueName}. Merci de bien vouloir passer en boutique dès que possible pour régulariser votre compte. Excellente journée !`
    );

    if (client.phone) {
      const cleanPhone = client.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    createAuditLog(
      'UPDATE',
      'client',
      `Relance de créance envoyée à ${client.name} (${amount} FCFA)`,
      client.id
    );
  };

  const createRefund = async (payload: { client_id: string; amount: number; note?: string }): Promise<Refund> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const refundAmount = Number(payload.amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw new Error('Montant de remboursement invalide.');
    }
    const client = clients.find((c) => c.id === payload.client_id);
    if (!client) throw new Error('Client introuvable.');

    const now = new Date().toISOString();
    const refund: Refund = {
      id: 'ref_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      client_id: client.id,
      client_name: client.name,
      amount: refundAmount,
      note: payload.note ? payload.note.trim() : undefined,
      cashier_id: user.id,
      cashier_name: `${user.first_name} ${user.last_name}`,
      date: now,
      created_at: now,
    };

    setRefunds((prev) => {
      const updated = [refund, ...prev];
      offlineStorage.setCache(`refunds_${boutique.id}`, updated);
      return updated;
    });

    setClients((prev) => {
      const updated = prev.map((c) => {
        if (c.id === client.id) {
          return {
            ...c,
            credit_balance: Math.max(0, (c.credit_balance || 0) - refundAmount),
            total_repaid: (c.total_repaid || 0) + refundAmount,
            updated_at: now,
          };
        }
        return c;
      });
      offlineStorage.setCache(`clients_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveRefund(refund, client);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_REFUND',
          title: `Remboursement dette : ${client.name}`,
          details: `${refundAmount.toLocaleString('fr-FR')} FCFA`,
          payload: { refund, client },
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_REFUND',
        title: `Remboursement dette : ${client.name}`,
        details: `${refundAmount.toLocaleString('fr-FR')} FCFA`,
        payload: { refund, client },
      });
    }

    return refund;
  };

  const createWithdrawal = async (payload: { amount: number; reason: string; author: string }): Promise<CashMovement> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const numAmount = Number(payload.amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Le montant doit être supérieur à 0.');
    if (!payload.reason?.trim()) throw new Error('Le motif du retrait est obligatoire.');
    if (!payload.author?.trim()) throw new Error('L’auteur du retrait est obligatoire.');

    const now = new Date().toISOString();
    const movement: CashMovement = {
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      type: 'withdrawal',
      amount: numAmount,
      reason: payload.reason.trim(),
      author: payload.author.trim(),
      cashier_id: user.id,
      date: now,
      created_at: now,
    };

    setMovements((prev) => {
      const updated = [movement, ...prev];
      offlineStorage.setCache(`movements_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveCashMovement(movement);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_CASH_MOVEMENT',
          title: `Retrait de caisse : ${numAmount.toLocaleString('fr-FR')} FCFA`,
          details: `${movement.reason} (par ${movement.author})`,
          payload: movement,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_CASH_MOVEMENT',
        title: `Retrait de caisse : ${numAmount.toLocaleString('fr-FR')} FCFA`,
        details: `${movement.reason} (par ${movement.author})`,
        payload: movement,
      });
    }

    return movement;
  };

  const createInjection = async (payload: { amount: number; reason: string; author: string }): Promise<CashMovement> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const numAmount = Number(payload.amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Le montant doit être supérieur à 0.');
    if (!payload.reason?.trim()) throw new Error('Le motif de l’injection est obligatoire.');
    if (!payload.author?.trim()) throw new Error('L’auteur de l’injection est obligatoire.');

    const now = new Date().toISOString();
    const movement: CashMovement = {
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      type: 'injection',
      amount: numAmount,
      reason: payload.reason.trim(),
      author: payload.author.trim(),
      cashier_id: user.id,
      date: now,
      created_at: now,
    };

    setMovements((prev) => {
      const updated = [movement, ...prev];
      offlineStorage.setCache(`movements_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveCashMovement(movement);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_CASH_MOVEMENT',
          title: `Apport de caisse : ${numAmount.toLocaleString('fr-FR')} FCFA`,
          details: `${movement.reason} (par ${movement.author})`,
          payload: movement,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_CASH_MOVEMENT',
        title: `Apport de caisse : ${numAmount.toLocaleString('fr-FR')} FCFA`,
        details: `${movement.reason} (par ${movement.author})`,
        payload: movement,
      });
    }

    return movement;
  };

  const createCashClosing = async (payload: { counted_cash: number; notes?: string }): Promise<CashClosing> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const numCounted = Number(payload.counted_cash);
    if (isNaN(numCounted) || numCounted < 0) throw new Error('Montant compté invalide.');

    const currentSolde = stats?.solde_caisse || 0;
    const discrepancy = numCounted - currentSolde;
    const now = new Date().toISOString();

    const cashSales = sales.filter((s) => s.payment_type === 'cash').reduce((acc, s) => acc + s.total_amount, 0);
    const creditSales = sales.filter((s) => s.payment_type === 'credit').reduce((acc, s) => acc + s.total_amount, 0);
    const totalRefunds = refunds.reduce((acc, r) => acc + r.amount, 0);

    const closing: CashClosing = {
      id: 'cls_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      date: now,
      theoretical_cash: currentSolde,
      counted_cash: numCounted,
      discrepancy,
      total_cash_sales: cashSales,
      total_credit_sales: creditSales,
      total_refunds: totalRefunds,
      total_withdrawals: stats?.retraits_total || 0,
      total_injections: stats?.injections_total || 0,
      notes: payload.notes ? payload.notes.trim() : undefined,
      closed_by_id: user.id,
      closed_by_name: `${user.first_name} ${user.last_name}`,
      created_at: now,
    };

    setClosings((prev) => {
      const updated = [closing, ...prev];
      offlineStorage.setCache(`closings_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveCashClosing(closing);
      } catch (err) {
        offlineStorage.enqueue({
          type: 'CREATE_CASH_CLOSING',
          title: `Clôture de caisse : ${closing.counted_cash.toLocaleString('fr-FR')} FCFA`,
          details: `Écart : ${closing.discrepancy.toLocaleString('fr-FR')} FCFA`,
          payload: closing,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_CASH_CLOSING',
        title: `Clôture de caisse : ${closing.counted_cash.toLocaleString('fr-FR')} FCFA`,
        details: `Écart : ${closing.discrepancy.toLocaleString('fr-FR')} FCFA`,
        payload: closing,
      });
    }

    return closing;
  };

  const createSupplier = async (payload: Partial<Supplier>): Promise<Supplier> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');
    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: 'sup_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      name: (payload.name || 'Fournisseur').trim(),
      phone: payload.phone ? payload.phone.trim() : undefined,
      address: payload.address ? payload.address.trim() : undefined,
      notes: payload.notes ? payload.notes.trim() : undefined,
      total_purchased: Number(payload.total_purchased) || 0,
      total_paid: Number(payload.total_paid) || 0,
      debt_balance: Number(payload.debt_balance) || 0,
      created_at: now,
      updated_at: now,
    };

    setSuppliers((prev) => {
      const updated = [supplier, ...prev];
      offlineStorage.setCache(`suppliers_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveSupplier(supplier);
      } catch {
        offlineStorage.enqueue({
          type: 'CREATE_SUPPLIER',
          title: `Nouveau fournisseur : ${supplier.name}`,
          payload: supplier,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_SUPPLIER',
        title: `Nouveau fournisseur : ${supplier.name}`,
        payload: supplier,
      });
    }

    createAuditLog('CREATE', 'supplier', `Ajout du fournisseur "${supplier.name}"`, supplier.id);
    return supplier;
  };

  const updateSupplier = async (id: string, payload: Partial<Supplier>): Promise<Supplier> => {
    const existing = suppliers.find((s) => s.id === id);
    if (!existing) throw new Error('Fournisseur introuvable.');

    const now = new Date().toISOString();
    const updated: Supplier = {
      ...existing,
      ...payload,
      updated_at: now,
    };

    setSuppliers((prev) => {
      const list = prev.map((s) => (s.id === id ? updated : s));
      if (boutique) offlineStorage.setCache(`suppliers_${boutique.id}`, list);
      return list;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveSupplier(updated);
      } catch {
        offlineStorage.enqueue({
          type: 'UPDATE_SUPPLIER',
          title: `Mise à jour fournisseur : ${updated.name}`,
          payload: { id, updates: payload },
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'UPDATE_SUPPLIER',
        title: `Mise à jour fournisseur : ${updated.name}`,
        payload: { id, updates: payload },
      });
    }

    createAuditLog('UPDATE', 'supplier', `Modification fournisseur "${updated.name}"`, id);
    return updated;
  };

  const deleteSupplier = async (id: string): Promise<void> => {
    const existing = suppliers.find((s) => s.id === id);
    if (existing && existing.debt_balance > 0) {
      throw new Error(`Dette en cours (${existing.debt_balance.toLocaleString('fr-FR')} FCFA). Réglez la dette avant suppression.`);
    }

    offlineStorage.removeQueuedActionsForEntity(id);

    setSuppliers((prev) => {
      const list = prev.filter((s) => s.id !== id);
      if (boutique) offlineStorage.setCache(`suppliers_${boutique.id}`, list);
      return list;
    });

    try {
      await firebaseDb.deleteSupplier(id);
    } catch {
      offlineStorage.enqueue({
        type: 'DELETE_SUPPLIER',
        title: `Suppression fournisseur : ${existing?.name || id}`,
        payload: { id },
      });
    }

    createAuditLog('DELETE', 'supplier', `Suppression fournisseur "${existing?.name || id}"`, id);
  };

  const createSupplierPayment = async (payload: {
    supplier_id: string;
    amount: number;
    payment_method: 'cash' | 'mobile_money' | 'other';
    notes?: string;
  }): Promise<SupplierPayment> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const supplier = suppliers.find((s) => s.id === payload.supplier_id);
    if (!supplier) throw new Error('Fournisseur introuvable.');

    const numAmount = Number(payload.amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Montant invalide.');

    const now = new Date().toISOString();
    const payment: SupplierPayment = {
      id: 'spay_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      amount: numAmount,
      payment_method: payload.payment_method,
      notes: payload.notes ? payload.notes.trim() : undefined,
      author_name: `${user.first_name} ${user.last_name}`,
      created_by: `${user.first_name} ${user.last_name}`,
      date: now,
      created_at: now,
    };

    // Optimistic supplier balance update
    const newDebt = Math.max(0, (supplier.debt_balance || 0) - numAmount);
    const newPaid = (supplier.total_paid || 0) + numAmount;
    await updateSupplier(supplier.id, { debt_balance: newDebt, total_paid: newPaid });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveSupplierPayment(payment);
      } catch {
        offlineStorage.enqueue({
          type: 'CREATE_SUPPLIER_PAYMENT',
          title: `Règlement fournisseur : ${supplier.name}`,
          details: `${numAmount.toLocaleString('fr-FR')} FCFA via ${payload.payment_method}`,
          payload: payment,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_SUPPLIER_PAYMENT',
        title: `Règlement fournisseur : ${supplier.name}`,
        details: `${numAmount.toLocaleString('fr-FR')} FCFA via ${payload.payment_method}`,
        payload: payment,
      });
    }

    createAuditLog(
      'CREATE',
      'supplier',
      `Règlement dette fournisseur "${supplier.name}" : ${numAmount.toLocaleString('fr-FR')} FCFA`,
      supplier.id
    );

    return payment;
  };

  const createExpense = async (payload: {
    category: ExpenseCategory;
    category_label: string;
    amount: number;
    description: string;
    payment_method: 'cash' | 'mobile_money';
  }): Promise<Expense> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const numAmount = Number(payload.amount);
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Montant invalide.');

    const now = new Date().toISOString();
    const expense: Expense = {
      id: 'exp_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      category: payload.category,
      category_label: payload.category_label,
      amount: numAmount,
      description: payload.description.trim(),
      payment_method: payload.payment_method,
      author_id: user.id,
      author_name: `${user.first_name} ${user.last_name}`,
      date: now,
      created_at: now,
    };

    setExpenses((prev) => {
      const updated = [expense, ...prev];
      offlineStorage.setCache(`expenses_${boutique.id}`, updated);
      return updated;
    });

    if (navigator.onLine) {
      try {
        await firebaseDb.saveExpense(expense);
      } catch {
        offlineStorage.enqueue({
          type: 'CREATE_EXPENSE',
          title: `Dépense : ${expense.category_label}`,
          details: `${numAmount.toLocaleString('fr-FR')} FCFA (${expense.description})`,
          payload: expense,
        });
      }
    } else {
      offlineStorage.enqueue({
        type: 'CREATE_EXPENSE',
        title: `Dépense : ${expense.category_label}`,
        details: `${numAmount.toLocaleString('fr-FR')} FCFA (${expense.description})`,
        payload: expense,
      });
    }

    createAuditLog(
      'CREATE',
      'expense',
      `Dépense enregistrée : ${expense.category_label} - ${numAmount.toLocaleString('fr-FR')} FCFA (${expense.description})`,
      expense.id
    );

    return expense;
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const existing = expenses.find((e) => e.id === id);

    offlineStorage.removeQueuedActionsForEntity(id);

    setExpenses((prev) => {
      const list = prev.filter((e) => e.id !== id);
      if (boutique) offlineStorage.setCache(`expenses_${boutique.id}`, list);
      return list;
    });

    try {
      await firebaseDb.deleteExpense(id);
    } catch {
      offlineStorage.enqueue({
        type: 'DELETE_EXPENSE',
        title: `Suppression dépense : ${existing?.category_label || id}`,
        payload: { id },
      });
    }

    createAuditLog('DELETE', 'expense', `Suppression définitive de la dépense "${existing?.description || id}"`, id);
  };

  // --- BACKUP & RESTORATION ---
  const exportDataJson = (): string => {
    const data = {
      version: '1.2.0',
      exported_at: new Date().toISOString(),
      boutique,
      products,
      sales,
      clients,
      refunds,
      movements,
      closings,
      suppliers,
      expenses,
      auditLogs,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = async (
    jsonString: string
  ): Promise<{ success: boolean; message: string; counts: Record<string, number> }> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');
    try {
      const parsed = JSON.parse(jsonString);
      const counts: Record<string, number> = {};

      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        setProducts(parsed.products);
        offlineStorage.setCache(`products_${boutique.id}`, parsed.products);
        counts.products = parsed.products.length;
        if (navigator.onLine) {
          for (const p of parsed.products) {
            await firebaseDb.saveProduct(p).catch(() => {});
          }
        }
      }

      if (Array.isArray(parsed.clients) && parsed.clients.length > 0) {
        setClients(parsed.clients);
        offlineStorage.setCache(`clients_${boutique.id}`, parsed.clients);
        counts.clients = parsed.clients.length;
        if (navigator.onLine) {
          for (const c of parsed.clients) {
            await firebaseDb.saveClient(c).catch(() => {});
          }
        }
      }

      if (Array.isArray(parsed.suppliers) && parsed.suppliers.length > 0) {
        setSuppliers(parsed.suppliers);
        offlineStorage.setCache(`suppliers_${boutique.id}`, parsed.suppliers);
        counts.suppliers = parsed.suppliers.length;
        if (navigator.onLine) {
          for (const s of parsed.suppliers) {
            await firebaseDb.saveSupplier(s).catch(() => {});
          }
        }
      }

      if (Array.isArray(parsed.expenses) && parsed.expenses.length > 0) {
        setExpenses(parsed.expenses);
        offlineStorage.setCache(`expenses_${boutique.id}`, parsed.expenses);
        counts.expenses = parsed.expenses.length;
      }

      if (Array.isArray(parsed.sales) && parsed.sales.length > 0) {
        setSales(parsed.sales);
        offlineStorage.setCache(`sales_${boutique.id}`, parsed.sales);
        counts.sales = parsed.sales.length;
      }

      createAuditLog('RESTORE', 'backup', `Restauration de données depuis un fichier JSON`);
      return { success: true, message: 'Importation réussie avec succès !', counts };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      return { success: false, message: `Fichier JSON invalide : ${errorMsg}`, counts: {} };
    }
  };

  const saveCloudBackup = async (): Promise<string> => {
    if (!boutique || !user) throw new Error('Non connecté.');
    const backupData = {
      products,
      sales,
      clients,
      refunds,
      movements,
      closings,
      suppliers,
      expenses,
      auditLogs,
      exported_at: new Date().toISOString(),
    };
    const itemCount =
      products.length +
      sales.length +
      clients.length +
      suppliers.length +
      expenses.length;
    const authorName = `${user.first_name} ${user.last_name}`;
    const backupId = await firebaseDb.saveCloudBackup(boutique.id, backupData, authorName, itemCount);
    createAuditLog('BACKUP', 'backup', `Création sauvegarde Cloud (${itemCount} éléments)`, backupId);
    return backupId;
  };

  const getCloudBackups = async () => {
    if (!boutique) return [];
    return firebaseDb.getCloudBackups(boutique.id);
  };

  const restoreCloudBackup = async (backupId: string): Promise<void> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');
    const backups = await getCloudBackups();
    const target = backups.find((b) => b.id === backupId);
    if (!target) throw new Error('Sauvegarde introuvable.');
    await importDataJson(target.data_json);
    createAuditLog('RESTORE', 'backup', `Restauration Cloud "${target.title}"`, backupId);
  };

  const updateBoutiqueSettings = async (settings: Partial<Boutique>): Promise<void> => {
    if (!boutique) throw new Error('Boutique non sélectionnée.');
    await firebaseDb.updateBoutique(boutique.id, settings);
    createAuditLog('UPDATE', 'boutique', `Modification des paramètres de la boutique`, boutique.id);
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    await firebaseDb.deleteSession(sessionId);
  };

  const createCashier = async (payload: { first_name: string; last_name: string; email: string; password?: string }) => {
    if (!boutique) throw new Error('Boutique non sélectionnée');
    const now = new Date().toISOString();
    const cashierId = 'usr_csh_' + Math.random().toString(36).substring(2, 9);
    const newCashier: User = {
      id: cashierId,
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: 'cashier',
      boutique_id: boutique.id,
      is_active: true,
      created_at: now,
    };

    // Optimistic local state update
    setCashiers((prev) => [newCashier, ...prev.filter((c) => c.id !== cashierId)]);

    try {
      await firebaseDb.createCashier(newCashier);
    } catch (err) {
      console.warn('Firebase cashier storage note:', err);
    }

    try {
      await api.createCashier({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password || 'Cashier1234!',
      });
    } catch (apiErr) {
      console.warn('Server cashier sync notice:', apiErr);
    }

    createAuditLog('CREATE', 'user', `Création du caissier : ${newCashier.first_name} ${newCashier.last_name}`, newCashier.id);
  };

  const toggleCashierStatus = async (id: string, is_active: boolean) => {
    setCashiers((prev) => prev.map((c) => (c.id === id ? { ...c, is_active } : c)));
    try {
      await firebaseDb.updateCashier(id, { is_active });
    } catch (e) {
      console.warn('Firebase update cashier error:', e);
    }
    try {
      await api.toggleCashierStatus(id, is_active);
    } catch (e) {
      console.warn('Server toggle cashier status notice:', e);
    }
    createAuditLog('UPDATE', 'user', `Changement de statut caissier (actif: ${is_active})`, id);
  };

  const deleteCashier = async (id: string) => {
    const target = cashiers.find((c) => c.id === id);
    setCashiers((prev) => prev.filter((c) => c.id !== id));
    try {
      await firebaseDb.deleteCashier(id);
    } catch (e) {
      console.warn('Firebase delete cashier error:', e);
    }
    try {
      await api.deleteCashier(id);
    } catch (e) {
      console.warn('Server delete cashier notice:', e);
    }
    if (target) {
      createAuditLog('DELETE', 'user', `Suppression du caissier : ${target.first_name} ${target.last_name}`, id);
    }
  };

  // --- RÉINITIALISATION COMPLÈTE DE TOUTES LES DONNÉES MÉTIER ---
  const resetAllBusinessData = async (): Promise<void> => {
    if (!boutique) throw new Error('Aucune boutique active.');

    // 1. Suppression définitive dans Firebase Firestore de toutes les collections métier
    try {
      await firebaseDb.resetAllBusinessData(boutique.id);
    } catch (err) {
      console.warn('Erreur Firestore lors de la réinitialisation:', err);
    }

    // 2. Suppression côté serveur d'API si actif
    try {
      await api.resetBoutiqueBusinessData();
    } catch (err) {
      console.warn('Notice réinitialisation serveur API:', err);
    }

    // 3. Nettoyage complet du cache local et de la file d'attente hors-ligne
    offlineStorage.clearQueue();
    offlineStorage.clearBoutiqueData(boutique.id);
    try {
      localStorage.removeItem('boutiquepro_cart');
      localStorage.removeItem(`boutiquepro_cart_${boutique.id}`);
      localStorage.removeItem('boutiquepro_recent_product');
      localStorage.removeItem(`draft_sale_${boutique.id}`);
    } catch {}

    // 4. Remise à zéro réelle et immédiate de tous les états métier en mémoire
    setProducts([]);
    setSales([]);
    setClients([]);
    setRefunds([]);
    setMovements([]);
    setClosings([]);
    setSuppliers([]);
    setExpenses([]);
    setAuditLogs([]);
    try {
      window.dispatchEvent(new CustomEvent('boutiquepro_cart_clear'));
    } catch {}

    // 5. Journal d'audit pour consigner l'événement
    createAuditLog('DELETE', 'boutique', 'Réinitialisation complète de toutes les données métier (remise à zéro)');

    // 6. Recalcul immédiat des statistiques et compteurs (tous à 0)
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        clients,
        refunds,
        movements,
        closings,
        sessions,
        suppliers,
        expenses,
        auditLogs,
        stats,
        cashiers,
        createCashier,
        toggleCashierStatus,
        deleteCashier,
        realtimeStatus,
        isLoadingData,
        lastSyncTime,
        pendingSyncCount,
        pendingQueue,
        isSyncingQueue,
        activeTab,
        setActiveTab,
        isAppLocked,
        setIsAppLocked,
        lockPin,
        setLockPin,
        unlockWithPin,
        theme,
        toggleTheme,
        refreshData,
        syncNow,
        clearOfflineQueue,
        createSale,
        cancelSale,
        createProduct,
        updateProduct,
        deleteProduct,
        createClient,
        updateClient,
        deleteClient,
        sendClientReminder,
        createRefund,
        createWithdrawal,
        createInjection,
        createCashClosing,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        createSupplierPayment,
        createExpense,
        deleteExpense,
        createAuditLog,
        exportDataJson,
        importDataJson,
        saveCloudBackup,
        getCloudBackups,
        restoreCloudBackup,
        resetAllBusinessData,
        updateBoutiqueSettings,
        revokeSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

