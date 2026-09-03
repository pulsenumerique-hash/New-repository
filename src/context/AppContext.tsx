import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Product,
  Sale,
  Client,
  Refund,
  CashMovement,
  CashClosing,
  DashboardStats,
  ActiveSession,
} from '../types';
import { firebaseDb } from '../services/firebaseDb';
import { offlineStorage } from '../services/offlineStorage';
import { useAuth } from './AuthContext';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  refunds: Refund[];
  movements: CashMovement[];
  closings: CashClosing[];
  sessions: ActiveSession[];
  stats: DashboardStats | null;
  realtimeStatus: 'connected' | 'reconnecting' | 'offline';
  isLoadingData: boolean;
  lastSyncTime: string | null;
  pendingSyncCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => Promise<void>;
  createSale: (payload: {
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
    payment_type: 'cash' | 'credit';
    client_id?: string | null;
    client_name?: string | null;
  }) => Promise<Sale>;
  createProduct: (payload: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, payload: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  createClient: (payload: { name: string; phone?: string; notes?: string }) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  createRefund: (payload: { client_id: string; amount: number; note?: string }) => Promise<Refund>;
  createWithdrawal: (payload: { amount: number; reason: string; author: string }) => Promise<CashMovement>;
  createInjection: (payload: { amount: number; reason: string; author: string }) => Promise<CashMovement>;
  createCashClosing: (payload: { counted_cash: number; notes?: string }) => Promise<CashClosing>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, boutique, role } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

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

  // Network connection monitor
  useEffect(() => {
    const handleOnline = () => setRealtimeStatus('connected');
    const handleOffline = () => setRealtimeStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute live dashboard stats whenever boutique or sub-collections change
  useEffect(() => {
    if (boutique) {
      const liveStats = firebaseDb.calculateDashboardStats(
        boutique,
        products,
        sales,
        clients,
        refunds,
        movements
      );
      setStats(liveStats);
      offlineStorage.setCache(`stats_${boutique.id}`, liveStats);
    }
  }, [boutique, products, sales, clients, refunds, movements]);

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
      return;
    }

    setIsLoadingData(true);

    // Initial check: if boutique is brand new with 0 items, seed default store data
    if (user?.role === 'admin') {
      firebaseDb.seedInitialBoutiqueData(boutique.id, user.id, `${user.first_name} ${user.last_name}`).catch(() => {});
    }

    const unsubProducts = firebaseDb.subscribeProducts(boutique.id, (prods) => {
      setProducts(prods);
      offlineStorage.setCache(`products_${boutique.id}`, prods);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
      setIsLoadingData(false);
    });

    const unsubSales = firebaseDb.subscribeSales(boutique.id, (sList) => {
      setSales(sList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubClients = firebaseDb.subscribeClients(boutique.id, (cList) => {
      setClients(cList);
      offlineStorage.setCache(`clients_${boutique.id}`, cList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubRefunds = firebaseDb.subscribeRefunds(boutique.id, (rList) => {
      setRefunds(rList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubMovements = firebaseDb.subscribeCashMovements(boutique.id, (mList) => {
      setMovements(mList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubClosings = firebaseDb.subscribeCashClosings(boutique.id, (cList) => {
      setClosings(cList);
      setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    });

    const unsubSessions = firebaseDb.subscribeActiveSessions(boutique.id, (sList) => {
      setSessions(sList);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubClients();
      unsubRefunds();
      unsubMovements();
      unsubClosings();
      unsubSessions();
    };
  }, [isAuthenticated, boutique?.id, user?.id, user?.role, user?.first_name, user?.last_name]);

  const refreshData = useCallback(async () => {
    setLastSyncTime(new Date().toLocaleTimeString('fr-FR'));
    setPendingSyncCount(offlineStorage.getQueue().length);
  }, []);

  // --- ACTIONS ---

  const createSale = async (payload: {
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
    payment_type: 'cash' | 'credit';
    client_id?: string | null;
    client_name?: string | null;
  }): Promise<Sale> => {
    if (!boutique || !user) throw new Error('Utilisateur non connecté.');

    let finalClientId = payload.client_id || null;
    let finalClientName = payload.client_name || null;

    if (payload.payment_type === 'credit') {
      if (!finalClientName && !finalClientId) {
        throw new Error('Pour une vente à crédit, le nom du client est obligatoire.');
      }
      if (!finalClientId && finalClientName) {
        const match = clients.find((c) => c.name.toLowerCase() === finalClientName!.trim().toLowerCase());
        if (match) {
          finalClientId = match.id;
          finalClientName = match.name;
        } else {
          const newClient: Client = {
            id: 'cli_' + Math.random().toString(36).substring(2, 9),
            boutique_id: boutique.id,
            name: finalClientName.trim(),
            credit_balance: 0,
            total_credit_purchased: 0,
            total_repaid: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await firebaseDb.saveClient(newClient);
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
    const sale: Sale = {
      id: 'sale_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutique.id,
      items: processedItems,
      total_amount: totalAmount,
      payment_type: payload.payment_type,
      client_id: finalClientId,
      client_name: finalClientName,
      cashier_id: user.id,
      cashier_name: `${user.first_name} ${user.last_name}`,
      date: now,
      created_at: now,
    };

    try {
      await firebaseDb.saveSale(sale, products, clients);
    } catch (err) {
      if (!navigator.onLine) {
        offlineStorage.enqueue({ type: 'CREATE_SALE', payload });
        setPendingSyncCount(offlineStorage.getQueue().length);
      }
      throw err;
    }

    return sale;
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
      barcode: payload.barcode ? String(payload.barcode).trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    await firebaseDb.saveProduct(product);
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
      barcode: payload.barcode !== undefined ? String(payload.barcode) : existing.barcode,
    };

    await firebaseDb.updateProduct(id, updates);
    return { ...existing, ...updates, updated_at: new Date().toISOString() };
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await firebaseDb.deleteProduct(id);
  };

  const createClient = async (payload: { name: string; phone?: string; notes?: string }): Promise<Client> => {
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
      created_at: now,
      updated_at: now,
    };
    await firebaseDb.saveClient(client);
    return client;
  };

  const deleteClient = async (id: string): Promise<void> => {
    const client = clients.find((c) => c.id === id);
    if (!client) throw new Error('Client introuvable.');
    if (client.credit_balance > 0) {
      throw new Error(`Impossible de supprimer : le client a une dette en cours de ${client.credit_balance} FCFA.`);
    }
    await firebaseDb.deleteClient(id);
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

    await firebaseDb.saveRefund(refund, client);
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

    await firebaseDb.saveCashMovement(movement);
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

    await firebaseDb.saveCashMovement(movement);
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

    await firebaseDb.saveCashClosing(closing);
    return closing;
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    await firebaseDb.deleteSession(sessionId);
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
        stats,
        realtimeStatus,
        isLoadingData,
        lastSyncTime,
        pendingSyncCount,
        activeTab,
        setActiveTab,
        refreshData,
        createSale,
        createProduct,
        updateProduct,
        deleteProduct,
        createClient,
        deleteClient,
        createRefund,
        createWithdrawal,
        createInjection,
        createCashClosing,
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
