import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  Sale,
  Client,
  Refund,
  CashMovement,
  CashClosing,
  ActiveSession,
  DashboardStats,
  Boutique,
} from '../types';

export const firebaseDb = {
  // --- REAL-TIME LISTENERS (Multi-Appareils) ---

  subscribeProducts(boutiqueId: string, onUpdate: (products: Product[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'products'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Product);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Products onSnapshot error:', err)
    );
  },

  subscribeSales(boutiqueId: string, onUpdate: (sales: Sale[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'sales'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Sale[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Sale);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Sales onSnapshot error:', err)
    );
  },

  subscribeClients(boutiqueId: string, onUpdate: (clients: Client[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'clients'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Client[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Client);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Clients onSnapshot error:', err)
    );
  },

  subscribeRefunds(boutiqueId: string, onUpdate: (refunds: Refund[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'refunds'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Refund[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Refund);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Refunds onSnapshot error:', err)
    );
  },

  subscribeCashMovements(boutiqueId: string, onUpdate: (movements: CashMovement[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'cash_movements'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CashMovement[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CashMovement);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Cash movements onSnapshot error:', err)
    );
  },

  subscribeCashClosings(boutiqueId: string, onUpdate: (closings: CashClosing[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'cash_closings'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CashClosing[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CashClosing);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Cash closings onSnapshot error:', err)
    );
  },

  subscribeActiveSessions(boutiqueId: string, onUpdate: (sessions: ActiveSession[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'active_sessions'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ActiveSession[] = [];
        const currentId = localStorage.getItem('boutiquepro_firebase_session_id');
        snapshot.forEach((doc) => {
          const s = doc.data() as ActiveSession;
          list.push({ ...s, is_current: s.id === currentId });
        });
        onUpdate(list);
      },
      (err) => console.warn('Active sessions onSnapshot error:', err)
    );
  },

  // --- CRUD OPERATIONS (FIRESTORE) ---

  // 1. Products
  async saveProduct(product: Product): Promise<void> {
    await setDoc(doc(db, 'products', product.id), product);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, 'products', id), {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  },

  // 2. Sales (With Stock Deduction and Client Debt updates in Firestore)
  async saveSale(sale: Sale, products: Product[], clients: Client[]): Promise<void> {
    // 1. Save sale
    await setDoc(doc(db, 'sales', sale.id), sale);

    // 2. Decrement product stock in Firestore
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        const newUnitStock = Math.max(0, prod.unit_stock - item.quantity);
        const newPkgStock = prod.units_per_package > 0 ? Math.floor(newUnitStock / prod.units_per_package) : 0;
        await updateDoc(doc(db, 'products', prod.id), {
          unit_stock: newUnitStock,
          package_stock: newPkgStock,
          updated_at: new Date().toISOString(),
        }).catch((e) => console.warn('Could not update product stock in firestore:', e));
      }
    }

    // 3. Update client debt if credit sale
    if (sale.payment_type === 'credit' && sale.client_id) {
      const client = clients.find((c) => c.id === sale.client_id);
      if (client) {
        await updateDoc(doc(db, 'clients', client.id), {
          credit_balance: client.credit_balance + sale.total_amount,
          total_credit_purchased: client.total_credit_purchased + sale.total_amount,
          updated_at: new Date().toISOString(),
        }).catch((e) => console.warn('Could not update client credit in firestore:', e));
      }
    }
  },

  // 3. Clients
  async saveClient(client: Client): Promise<void> {
    await setDoc(doc(db, 'clients', client.id), client);
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    await updateDoc(doc(db, 'clients', id), {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async deleteClient(id: string): Promise<void> {
    await deleteDoc(doc(db, 'clients', id));
  },

  // 4. Refunds (Remboursements)
  async saveRefund(refund: Refund, client?: Client): Promise<void> {
    await setDoc(doc(db, 'refunds', refund.id), refund);
    if (client) {
      const newDebt = Math.max(0, client.credit_balance - refund.amount);
      const newRepaid = client.total_repaid + refund.amount;
      await updateDoc(doc(db, 'clients', client.id), {
        credit_balance: newDebt,
        total_repaid: newRepaid,
        updated_at: new Date().toISOString(),
      }).catch((e) => console.warn('Could not update client balance on refund:', e));
    }
  },

  // 5. Cash Movements (Retraits / Injections)
  async saveCashMovement(movement: CashMovement): Promise<void> {
    await setDoc(doc(db, 'cash_movements', movement.id), movement);
  },

  // 6. Cash Closings (Clôtures journalières)
  async saveCashClosing(closing: CashClosing): Promise<void> {
    await setDoc(doc(db, 'cash_closings', closing.id), closing);
  },

  // 7. Revoke Session
  async deleteSession(sessionId: string): Promise<void> {
    await deleteDoc(doc(db, 'active_sessions', sessionId));
  },

  // 8. Compute Local Dashboard Stats from live synchronized data
  calculateDashboardStats(
    boutique: Boutique,
    products: Product[],
    sales: Sale[],
    clients: Client[],
    refunds: Refund[],
    movements: CashMovement[]
  ): DashboardStats {
    const initialCapital = boutique?.initial_capital || 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let ventes_jour = 0;
    let ventes_semaine = 0;
    let ventes_mois = 0;
    let totalCashSales = 0;

    for (const s of sales) {
      const sTime = new Date(s.created_at).getTime();
      if (sTime >= startOfToday) ventes_jour += s.total_amount;
      if (sTime >= startOfWeek) ventes_semaine += s.total_amount;
      if (sTime >= startOfMonth) ventes_mois += s.total_amount;
      if (s.payment_type === 'cash') totalCashSales += s.total_amount;
    }

    const totalRefundsCash = refunds.reduce((acc, r) => acc + r.amount, 0);
    const totalInjections = movements.filter((m) => m.type === 'injection').reduce((acc, m) => acc + m.amount, 0);
    const totalWithdrawals = movements.filter((m) => m.type === 'withdrawal').reduce((acc, m) => acc + m.amount, 0);

    let valeur_stock_achat = 0;
    let valeur_stock_vente = 0;
    let nb_produits_alerte = 0;

    for (const p of products) {
      valeur_stock_achat += (p.unit_stock || 0) * (p.unit_purchase_price || 0);
      valeur_stock_vente += (p.unit_stock || 0) * (p.unit_sale_price || 0);
      if (p.min_alert_threshold && (p.unit_stock || 0) <= p.min_alert_threshold) {
        nb_produits_alerte++;
      }
    }

    const total_credits_en_cours = clients.reduce((acc, c) => acc + (c.credit_balance || 0), 0);
    const nb_clients_debiteurs = clients.filter((c) => (c.credit_balance || 0) > 0).length;

    const solde_caisse = initialCapital + totalInjections + totalCashSales + totalRefundsCash - totalWithdrawals;

    return {
      solde_caisse,
      ventes_jour,
      ventes_semaine,
      ventes_mois,
      valeur_stock_achat,
      valeur_stock_vente,
      total_credits_en_cours,
      nb_clients_debiteurs,
      nb_produits: products.length,
      nb_produits_alerte,
      retraits_total: totalWithdrawals,
      injections_total: totalInjections,
    };
  },

  // Seed sample products and clients if new boutique is completely empty
  async seedInitialBoutiqueData(boutiqueId: string, adminId: string, adminName: string): Promise<void> {
    const productsSnap = await getDocs(
      query(collection(db, 'products'), where('boutique_id', '==', boutiqueId))
    );
    if (!productsSnap.empty) return;

    const now = new Date().toISOString();
    const defaultProducts: Product[] = [
      {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Bonbons Menthe Fraîche',
        category: 'Confiserie',
        package_type: 'Paquet',
        package_purchase_price: 1000,
        units_per_package: 20,
        unit_purchase_price: 50,
        unit_sale_price: 75,
        package_stock: 5,
        unit_stock: 100,
        min_alert_threshold: 20,
        barcode: '600123456789',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Riz Parfumé Jasmin 50kg',
        category: 'Céréales & Riz',
        package_type: 'Sac 50kg',
        package_purchase_price: 22000,
        units_per_package: 50,
        unit_purchase_price: 440,
        unit_sale_price: 600,
        package_stock: 4,
        unit_stock: 200,
        min_alert_threshold: 25,
        barcode: '600987654321',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Huile Végétale Dinor 5L (bouteille 1L)',
        category: 'Huiles & Condiments',
        package_type: 'Carton 4 Bidons',
        package_purchase_price: 24000,
        units_per_package: 4,
        unit_purchase_price: 6000,
        unit_sale_price: 7200,
        package_stock: 3,
        unit_stock: 12,
        min_alert_threshold: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Lait Concentré Sucré Bonnet Rouge',
        category: 'Produits Laitiers',
        package_type: 'Carton 48 Boîtes',
        package_purchase_price: 24000,
        units_per_package: 48,
        unit_purchase_price: 500,
        unit_sale_price: 650,
        package_stock: 2,
        unit_stock: 96,
        min_alert_threshold: 15,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Sucre Blanc Saint Louis (Morceaux)',
        category: 'Épicerie',
        package_type: 'Carton 25 paquets 1kg',
        package_purchase_price: 18750,
        units_per_package: 25,
        unit_purchase_price: 750,
        unit_sale_price: 900,
        package_stock: 3,
        unit_stock: 75,
        min_alert_threshold: 10,
        created_at: now,
        updated_at: now,
      },
    ];

    for (const p of defaultProducts) {
      await setDoc(doc(db, 'products', p.id), p);
    }

    const defaultClients: Client[] = [
      {
        id: 'cli_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Mme Fatou Traoré',
        phone: '+221 77 123 45 67',
        credit_balance: 14500,
        total_credit_purchased: 34500,
        total_repaid: 20000,
        notes: 'Voisine du quartier - paie à la fin du mois',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cli_' + Math.random().toString(36).substring(2, 9),
        boutique_id: boutiqueId,
        name: 'Ousmane Cissé (Atelier Menuiserie)',
        phone: '+221 70 987 65 43',
        credit_balance: 8250,
        total_credit_purchased: 18250,
        total_repaid: 10000,
        notes: 'Remboursement hebdomadaire chaque vendredi',
        created_at: now,
        updated_at: now,
      },
    ];

    for (const c of defaultClients) {
      await setDoc(doc(db, 'clients', c.id), c);
    }
  },
};
