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
  Supplier,
  SupplierPayment,
  Expense,
  AuditLog,
  User,
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

  subscribeSuppliers(boutiqueId: string, onUpdate: (suppliers: Supplier[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'suppliers'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Supplier[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Supplier);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Suppliers onSnapshot error:', err)
    );
  },

  subscribeExpenses(boutiqueId: string, onUpdate: (expenses: Expense[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'expenses'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Expense);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Expenses onSnapshot error:', err)
    );
  },

  subscribeAuditLogs(boutiqueId: string, onUpdate: (logs: AuditLog[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'audit_logs'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AuditLog);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Audit logs onSnapshot error:', err)
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

  // 8. Suppliers (Fournisseurs)
  async saveSupplier(supplier: Supplier): Promise<void> {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    await updateDoc(doc(db, 'suppliers', id), {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async deleteSupplier(id: string): Promise<void> {
    await deleteDoc(doc(db, 'suppliers', id));
  },

  async saveSupplierPayment(payment: SupplierPayment, supplier?: Supplier): Promise<void> {
    await setDoc(doc(db, 'supplier_payments', payment.id), payment);
    if (supplier) {
      const newDebt = Math.max(0, supplier.debt_balance - payment.amount);
      const newPaid = supplier.total_paid + payment.amount;
      await updateDoc(doc(db, 'suppliers', supplier.id), {
        debt_balance: newDebt,
        total_paid: newPaid,
        updated_at: new Date().toISOString(),
      }).catch((e) => console.warn('Could not update supplier balance:', e));
    }
  },

  // 9. Expenses (Charges d'exploitation)
  async saveExpense(expense: Expense): Promise<void> {
    await setDoc(doc(db, 'expenses', expense.id), expense);
  },

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, 'expenses', id));
  },

  // 10. Audit Logs (Journal d'activité)
  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.warn('Could not save audit log to firestore:', e);
    }
  },

  // 11. Sale Cancellation & Product Returns (Remise en stock + Ajustement Dette / Caisse)
  async cancelSale(
    sale: Sale,
    reason: string,
    cancelledByName: string,
    products: Product[],
    clients: Client[]
  ): Promise<void> {
    const cancelledAt = new Date().toISOString();

    // 1. Update sale status in Firestore
    await updateDoc(doc(db, 'sales', sale.id), {
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: cancelledAt,
      cancelled_by_name: cancelledByName,
    });

    // 2. Return items to stock
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        const restoredUnitStock = prod.unit_stock + item.quantity;
        const restoredPkgStock = prod.units_per_package > 0 ? Math.floor(restoredUnitStock / prod.units_per_package) : 0;
        await updateDoc(doc(db, 'products', prod.id), {
          unit_stock: restoredUnitStock,
          package_stock: restoredPkgStock,
          updated_at: cancelledAt,
        }).catch((e) => console.warn('Could not restock product on cancellation:', e));
      }
    }

    // 3. Deduct client credit debt if it was a credit sale
    if (sale.payment_type === 'credit' && sale.client_id) {
      const client = clients.find((c) => c.id === sale.client_id);
      if (client) {
        const newBalance = Math.max(0, client.credit_balance - sale.total_amount);
        const newTotalPurchased = Math.max(0, client.total_credit_purchased - sale.total_amount);
        await updateDoc(doc(db, 'clients', client.id), {
          credit_balance: newBalance,
          total_credit_purchased: newTotalPurchased,
          updated_at: cancelledAt,
        }).catch((e) => console.warn('Could not revert client debt on sale cancellation:', e));
      }
    }
  },

  // 12. Cloud Backups
  async saveCloudBackup(
    boutiqueId: string,
    backupData: Record<string, unknown>,
    authorName: string,
    itemCount: number
  ): Promise<string> {
    const backupId = 'bck_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const docData = {
      id: backupId,
      boutique_id: boutiqueId,
      title: `Sauvegarde Cloud du ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      item_count: itemCount,
      data_json: JSON.stringify(backupData),
      created_by: authorName,
      created_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'backups', backupId), docData);
    return backupId;
  },

  async getCloudBackups(boutiqueId: string): Promise<Array<{
    id: string;
    title: string;
    item_count: number;
    created_by: string;
    created_at: string;
    data_json: string;
  }>> {
    try {
      const q = query(
        collection(db, 'backups'),
        where('boutique_id', '==', boutiqueId)
      );
      const snap = await getDocs(q);
      const list: Array<{
        id: string;
        title: string;
        item_count: number;
        created_by: string;
        created_at: string;
        data_json: string;
      }> = [];
      snap.forEach((d) => list.push(d.data() as {
        id: string;
        title: string;
        item_count: number;
        created_by: string;
        created_at: string;
        data_json: string;
      }));
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return list;
    } catch {
      return [];
    }
  },

  // 13. Compute Local Dashboard Stats from live synchronized data
  calculateDashboardStats(
    boutique: Boutique,
    products: Product[],
    sales: Sale[],
    clients: Client[],
    refunds: Refund[],
    movements: CashMovement[],
    suppliers: Supplier[] = [],
    expenses: Expense[] = []
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
    let ventes_cash_total = 0;
    let ventes_mobile_money_total = 0;
    let ventes_credit_total = 0;
    let benefice_brut_estime = 0;

    for (const s of sales) {
      if (s.status === 'cancelled') continue; // Don't count cancelled sales
      const sTime = new Date(s.created_at).getTime();
      if (sTime >= startOfToday) ventes_jour += s.total_amount;
      if (sTime >= startOfWeek) ventes_semaine += s.total_amount;
      if (sTime >= startOfMonth) ventes_mois += s.total_amount;

      if (s.payment_type === 'cash') {
        ventes_cash_total += s.total_amount;
      } else if (s.payment_type === 'mobile_money') {
        ventes_mobile_money_total += s.total_amount;
      } else if (s.payment_type === 'credit') {
        ventes_credit_total += s.total_amount;
      }

      // Compute estimated gross profit on sale items
      if (s.items && Array.isArray(s.items)) {
        for (const it of s.items) {
          const cost = it.unit_purchase_price || 0;
          const margin = (it.unit_price - cost) * it.quantity;
          benefice_brut_estime += margin;
        }
      }
    }

    const totalRefundsCash = refunds.reduce((acc, r) => acc + r.amount, 0);
    const totalInjections = movements.filter((m) => m.type === 'injection').reduce((acc, m) => acc + m.amount, 0);
    const totalWithdrawals = movements.filter((m) => m.type === 'withdrawal').reduce((acc, m) => acc + m.amount, 0);

    // Compute expenses
    let total_depenses_mois = 0;
    let totalExpensesCash = 0;
    for (const exp of expenses) {
      const expTime = new Date(exp.created_at).getTime();
      if (expTime >= startOfMonth) {
        total_depenses_mois += exp.amount;
      }
      if (exp.payment_method === 'cash') {
        totalExpensesCash += exp.amount;
      }
    }

    let valeur_stock_achat = 0;
    let valeur_stock_vente = 0;
    let nb_produits_alerte = 0;
    let nb_produits_perimes = 0;
    let nb_produits_bientot_perimes = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const p of products) {
      valeur_stock_achat += (p.unit_stock || 0) * (p.unit_purchase_price || 0);
      valeur_stock_vente += (p.unit_stock || 0) * (p.unit_sale_price || 0);

      // Low stock alert
      const threshold = p.min_alert_threshold ?? 10;
      if ((p.unit_stock || 0) <= threshold) {
        nb_produits_alerte++;
      }

      // Expiration check
      if (p.expiration_date) {
        if (p.expiration_date < todayStr) {
          nb_produits_perimes++;
        } else if (p.expiration_date <= sevenDaysLater) {
          nb_produits_bientot_perimes++;
        }
      }
    }

    const total_credits_en_cours = clients.reduce((acc, c) => acc + (c.credit_balance || 0), 0);
    const nb_clients_debiteurs = clients.filter((c) => (c.credit_balance || 0) > 0).length;

    // Overdue credits
    const nb_credits_en_retard = clients.filter((c) => {
      if ((c.credit_balance || 0) <= 0) return false;
      if (!c.due_date) return false;
      return c.due_date < todayStr;
    }).length;

    const total_dettes_fournisseurs = suppliers.reduce((acc, s) => acc + (s.debt_balance || 0), 0);

    const benefice_net_reel = benefice_brut_estime - total_depenses_mois;

    // Solde de caisse = Capital initial + Injections + Ventes espèces + Remboursements espèces reçus - Retraits - Dépenses espèces
    const solde_caisse =
      initialCapital + totalInjections + ventes_cash_total + totalRefundsCash - totalWithdrawals - totalExpensesCash;

    return {
      solde_caisse,
      ventes_jour,
      ventes_semaine,
      ventes_mois,
      ventes_cash_total,
      ventes_mobile_money_total,
      ventes_credit_total,
      valeur_stock_achat,
      valeur_stock_vente,
      total_credits_en_cours,
      nb_clients_debiteurs,
      nb_credits_en_retard,
      total_dettes_fournisseurs,
      total_depenses_mois,
      benefice_brut_estime,
      benefice_net_reel,
      nb_produits: products.length,
      nb_produits_alerte,
      nb_produits_perimes,
      nb_produits_bientot_perimes,
      retraits_total: totalWithdrawals,
      injections_total: totalInjections,
    };
  },

  // Seed sample products and clients: STRICTLY DISABLED to guarantee blank state on new accounts
  async seedInitialBoutiqueData(_boutiqueId: string, _adminId: string, _adminName: string): Promise<void> {
    return Promise.resolve();
  },

  async updateBoutique(boutiqueId: string, settings: Partial<Boutique>): Promise<void> {
    await updateDoc(doc(db, 'boutiques', boutiqueId), {
      ...settings,
      updated_at: new Date().toISOString(),
    });
  },

  // --- CASHIERS MANAGEMENT ---
  subscribeCashiers(boutiqueId: string, onUpdate: (cashiers: User[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'cashiers'),
      where('boutique_id', '==', boutiqueId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: User[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as User);
        });
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        onUpdate(list);
      },
      (err) => console.warn('Cashiers onSnapshot error:', err)
    );
  },

  async createCashier(cashier: User): Promise<void> {
    await setDoc(doc(db, 'cashiers', cashier.id), cashier);
  },

  async updateCashier(id: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'cashiers', id), updates);
  },

  async deleteCashier(id: string): Promise<void> {
    await deleteDoc(doc(db, 'cashiers', id));
  },
};
