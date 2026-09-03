import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Boutique,
  Product,
  Sale,
  Client,
  Refund,
  CashMovement,
  CashClosing,
  AuditLog,
  ActiveSession,
  DashboardStats,
} from '../src/types';

interface DatabaseSchema {
  boutiques: Boutique[];
  users: (User & { password_hash: string })[];
  products: Product[];
  sales: Sale[];
  clients: Client[];
  refunds: Refund[];
  cash_movements: CashMovement[];
  cash_closings: CashClosing[];
  audit_logs: AuditLog[];
  active_sessions: ActiveSession[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'boutique_db.json');

class DatabaseService {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, initializing default:', err);
      }
    }
    const defaultData = this.createInitialSeed();
    this.persistSync(defaultData);
    return defaultData;
  }

  private createInitialSeed(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('admin123', salt);
    const cashierPasswordHash = bcrypt.hashSync('caisse123', salt);

    const boutiqueId = 'btq_demo_001';
    const adminId = 'usr_admin_001';
    const cashierId = 'usr_cashier_001';
    const now = new Date().toISOString();

    const initialBoutique: Boutique = {
      id: boutiqueId,
      name: 'Superette Étoile du Sahel',
      owner_id: adminId,
      initial_capital: 250000, // 250 000 FCFA
      currency: 'FCFA',
      created_at: now,
    };

    const adminUser = {
      id: adminId,
      email: 'admin@boutiquepro.com',
      first_name: 'Amadou',
      last_name: 'Diallo',
      role: 'admin' as const,
      boutique_id: boutiqueId,
      is_active: true,
      password_hash: demoPasswordHash,
      created_at: now,
      last_login: now,
    };

    const cashierUser = {
      id: cashierId,
      email: 'moussa@boutiquepro.com',
      first_name: 'Moussa',
      last_name: 'Koné',
      role: 'cashier' as const,
      boutique_id: boutiqueId,
      is_active: true,
      password_hash: cashierPasswordHash,
      created_at: now,
      last_login: now,
    };

    const products: Product[] = [
      {
        id: 'prod_001',
        boutique_id: boutiqueId,
        name: 'Bonbons Menthe Fraîche',
        category: 'Confiserie',
        package_type: 'Paquet',
        package_purchase_price: 1000,
        units_per_package: 20,
        unit_purchase_price: 50, // 1000 / 20 = 50 FCFA
        unit_sale_price: 75, // Marge = 25 FCFA / bonbon
        package_stock: 5,
        unit_stock: 100, // 5 * 20 = 100 bonbons
        min_alert_threshold: 20,
        barcode: '600123456789',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_002',
        boutique_id: boutiqueId,
        name: 'Riz Parfumé Jasmin 50kg',
        category: 'Céréales & Riz',
        package_type: 'Sac 50kg',
        package_purchase_price: 22000,
        units_per_package: 50, // 50 kg au détail
        unit_purchase_price: 440, // 22000 / 50 = 440 FCFA / kg
        unit_sale_price: 600, // 600 FCFA / kg
        package_stock: 4,
        unit_stock: 200, // 200 kg
        min_alert_threshold: 25,
        barcode: '600987654321',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_003',
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
        id: 'prod_004',
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
        id: 'prod_005',
        boutique_id: boutiqueId,
        name: 'Spaghetti Maman 500g',
        category: 'Pâtes Alimentaires',
        package_type: 'Carton 20 sachets',
        package_purchase_price: 7000,
        units_per_package: 20,
        unit_purchase_price: 350,
        unit_sale_price: 450,
        package_stock: 4,
        unit_stock: 80,
        min_alert_threshold: 10,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_006',
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
      {
        id: 'prod_007',
        boutique_id: boutiqueId,
        name: 'Savon de Marseille BF',
        category: 'Entretien & Hygiène',
        package_type: 'Carton 36 barres',
        package_purchase_price: 9000,
        units_per_package: 36,
        unit_purchase_price: 250,
        unit_sale_price: 350,
        package_stock: 3,
        unit_stock: 108,
        min_alert_threshold: 12,
        created_at: now,
        updated_at: now,
      }
    ];

    const clients: Client[] = [
      {
        id: 'cli_001',
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
        id: 'cli_002',
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
      {
        id: 'cli_003',
        boutique_id: boutiqueId,
        name: 'Ibrahim Sangaré',
        phone: '+221 76 555 12 34',
        credit_balance: 0, // Crédit soldé -> supprimable
        total_credit_purchased: 15000,
        total_repaid: 15000,
        notes: 'Crédit entièrement soldé hier',
        created_at: now,
        updated_at: now,
      }
    ];

    const sales: Sale[] = [
      {
        id: 'sale_001',
        boutique_id: boutiqueId,
        items: [
          {
            product_id: 'prod_001',
            product_name: 'Bonbons Menthe Fraîche',
            quantity: 5,
            unit_price: 75,
            total_price: 375,
            unit_purchase_price: 50,
          },
          {
            product_id: 'prod_004',
            product_name: 'Lait Concentré Sucré Bonnet Rouge',
            quantity: 2,
            unit_price: 650,
            total_price: 1300,
            unit_purchase_price: 500,
          }
        ],
        total_amount: 1675,
        payment_type: 'cash',
        cashier_id: cashierId,
        cashier_name: 'Moussa Koné',
        date: now,
        created_at: now,
      },
      {
        id: 'sale_002',
        boutique_id: boutiqueId,
        items: [
          {
            product_id: 'prod_002',
            product_name: 'Riz Parfumé Jasmin 50kg',
            quantity: 10, // 10 kg
            unit_price: 600,
            total_price: 6000,
            unit_purchase_price: 440,
          }
        ],
        total_amount: 6000,
        payment_type: 'credit',
        client_id: 'cli_001',
        client_name: 'Mme Fatou Traoré',
        cashier_id: cashierId,
        cashier_name: 'Moussa Koné',
        date: now,
        created_at: now,
      }
    ];

    const cash_movements: CashMovement[] = [
      {
        id: 'mov_001',
        boutique_id: boutiqueId,
        type: 'injection',
        amount: 50000,
        reason: 'Renforcement fond de caisse pour début de semaine',
        author: 'Amadou Diallo (Gérant)',
        cashier_id: adminId,
        date: now,
        created_at: now,
      },
      {
        id: 'mov_002',
        boutique_id: boutiqueId,
        type: 'withdrawal',
        amount: 5000,
        reason: 'Paiement facture d’électricité de la boutique (Woyofal)',
        author: 'Amadou Diallo',
        cashier_id: adminId,
        date: now,
        created_at: now,
      }
    ];

    const audit_logs: AuditLog[] = [
      {
        id: 'log_001',
        boutique_id: boutiqueId,
        user_id: adminId,
        user_name: 'Amadou Diallo',
        action: 'CREATE',
        entity_type: 'product',
        entity_id: 'prod_001',
        details: 'Création du produit Bonbons Menthe Fraîche (1000 FCFA/paquet de 20 -> 75 FCFA/unité)',
        device_info: 'PC Bureau (Chrome/Linux)',
        timestamp: now,
      }
    ];

    return {
      boutiques: [initialBoutique],
      users: [adminUser, cashierUser],
      products,
      sales,
      clients,
      refunds: [],
      cash_movements,
      cash_closings: [],
      audit_logs,
      active_sessions: [],
    };
  }

  private save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.data);
    }, 100);
  }

  private persistSync(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const tmpPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  // --- BOUTIQUE ---
  getBoutique(id: string): Boutique | undefined {
    return this.data.boutiques.find((b) => b.id === id);
  }

  createBoutique(boutique: Boutique): Boutique {
    this.data.boutiques.push(boutique);
    this.save();
    return boutique;
  }

  // --- USERS ---
  findUserByEmail(email: string): (User & { password_hash: string }) | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): (User & { password_hash: string }) | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: User & { password_hash: string }): User {
    this.data.users.push(user);
    this.save();
    const { password_hash, ...publicUser } = user;
    return publicUser;
  }

  updateUser(id: string, updates: Partial<User & { password_hash?: string }>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { password_hash, ...publicUser } = this.data.users[idx];
    return publicUser;
  }

  deleteUser(id: string): boolean {
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.save();
    return this.data.users.length < prevLen;
  }

  getCashiers(boutiqueId: string): User[] {
    return this.data.users
      .filter((u) => u.boutique_id === boutiqueId && u.role === 'cashier')
      .map(({ password_hash, ...user }) => user);
  }

  // --- PRODUCTS ---
  getProducts(boutiqueId: string): Product[] {
    return this.data.products.filter((p) => p.boutique_id === boutiqueId);
  }

  getProductById(id: string, boutiqueId: string): Product | undefined {
    return this.data.products.find((p) => p.id === id && p.boutique_id === boutiqueId);
  }

  createProduct(product: Product): Product {
    this.data.products.push(product);
    this.save();
    return product;
  }

  updateProduct(id: string, boutiqueId: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id && p.boutique_id === boutiqueId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.products[idx] = { ...this.data.products[idx], ...updates, updated_at: now };
    this.save();
    return this.data.products[idx];
  }

  deleteProduct(id: string, boutiqueId: string): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => !(p.id === id && p.boutique_id === boutiqueId));
    this.save();
    return this.data.products.length < prevLen;
  }

  // --- SALES ---
  getSales(boutiqueId: string, limit = 100): Sale[] {
    return this.data.sales
      .filter((s) => s.boutique_id === boutiqueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  createSale(sale: Sale): Sale {
    // 1. Add sale
    this.data.sales.unshift(sale);

    // 2. Deduct product stocks
    for (const item of sale.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id && p.boutique_id === sale.boutique_id);
      if (prod) {
        prod.unit_stock = Math.max(0, prod.unit_stock - item.quantity);
        // recalculate full package stock
        prod.package_stock = prod.units_per_package > 0 ? Math.floor(prod.unit_stock / prod.units_per_package) : 0;
        prod.updated_at = new Date().toISOString();
      }
    }

    // 3. If credit sale, update client debt
    if (sale.payment_type === 'credit' && sale.client_id) {
      const client = this.data.clients.find((c) => c.id === sale.client_id && c.boutique_id === sale.boutique_id);
      if (client) {
        client.credit_balance += sale.total_amount;
        client.total_credit_purchased += sale.total_amount;
        client.updated_at = new Date().toISOString();
      }
    }

    this.save();
    return sale;
  }

  // --- CLIENTS ---
  getClients(boutiqueId: string): Client[] {
    return this.data.clients.filter((c) => c.boutique_id === boutiqueId);
  }

  getClientById(id: string, boutiqueId: string): Client | undefined {
    return this.data.clients.find((c) => c.id === id && c.boutique_id === boutiqueId);
  }

  createClient(client: Client): Client {
    this.data.clients.push(client);
    this.save();
    return client;
  }

  updateClient(id: string, boutiqueId: string, updates: Partial<Client>): Client | null {
    const idx = this.data.clients.findIndex((c) => c.id === id && c.boutique_id === boutiqueId);
    if (idx === -1) return null;
    this.data.clients[idx] = { ...this.data.clients[idx], ...updates, updated_at: new Date().toISOString() };
    this.save();
    return this.data.clients[idx];
  }

  deleteClient(id: string, boutiqueId: string): { success: boolean; error?: string } {
    const client = this.getClientById(id, boutiqueId);
    if (!client) {
      return { success: false, error: 'Client introuvable.' };
    }
    if (client.credit_balance > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : le client a un crédit en cours de ${client.credit_balance} FCFA. Il doit être totalement remboursé d'abord.`,
      };
    }
    this.data.clients = this.data.clients.filter((c) => !(c.id === id && c.boutique_id === boutiqueId));
    this.save();
    return { success: true };
  }

  // --- REFUNDS (Remboursements) ---
  getRefunds(boutiqueId: string): Refund[] {
    return this.data.refunds
      .filter((r) => r.boutique_id === boutiqueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createRefund(refund: Refund): Refund {
    this.data.refunds.unshift(refund);
    // reduce client debt
    const client = this.getClientById(refund.client_id, refund.boutique_id);
    if (client) {
      client.credit_balance = Math.max(0, client.credit_balance - refund.amount);
      client.total_repaid += refund.amount;
      client.updated_at = new Date().toISOString();
    }
    this.save();
    return refund;
  }

  // --- CASH MOVEMENTS (Retraits & Injections) ---
  getCashMovements(boutiqueId: string): CashMovement[] {
    return this.data.cash_movements
      .filter((m) => m.boutique_id === boutiqueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createCashMovement(movement: CashMovement): CashMovement {
    this.data.cash_movements.unshift(movement);
    this.save();
    return movement;
  }

  // --- CASH CLOSINGS (Clôtures de caisse) ---
  getCashClosings(boutiqueId: string): CashClosing[] {
    return this.data.cash_closings
      .filter((c) => c.boutique_id === boutiqueId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createCashClosing(closing: CashClosing): CashClosing {
    this.data.cash_closings.unshift(closing);
    this.save();
    return closing;
  }

  // --- AUDIT LOGS ---
  addAuditLog(log: AuditLog) {
    this.data.audit_logs.unshift(log);
    // Keep max 500 logs per instance
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
  }

  getAuditLogs(boutiqueId: string, limit = 100): AuditLog[] {
    return this.data.audit_logs
      .filter((l) => l.boutique_id === boutiqueId)
      .slice(0, limit);
  }

  // --- SESSIONS ---
  createSession(session: ActiveSession) {
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.id !== session.id);
    this.data.active_sessions.unshift(session);
    this.save();
  }

  getActiveSessions(boutiqueId: string): ActiveSession[] {
    return this.data.active_sessions.filter((s) => s.boutique_id === boutiqueId);
  }

  removeSession(sessionId: string): boolean {
    const prev = this.data.active_sessions.length;
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.id !== sessionId);
    this.save();
    return this.data.active_sessions.length < prev;
  }

  removeAllUserSessions(userId: string) {
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.user_id !== userId);
    this.save();
  }

  // --- DASHBOARD STATS COMPUTATION ---
  getDashboardStats(boutiqueId: string): DashboardStats {
    const boutique = this.getBoutique(boutiqueId);
    const initialCapital = boutique?.initial_capital || 0;

    const products = this.getProducts(boutiqueId);
    const sales = this.data.sales.filter((s) => s.boutique_id === boutiqueId);
    const clients = this.data.clients.filter((c) => c.boutique_id === boutiqueId);
    const refunds = this.data.refunds.filter((r) => r.boutique_id === boutiqueId);
    const movements = this.data.cash_movements.filter((m) => m.boutique_id === boutiqueId);

    // Filter by dates
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Start of current week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Monday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let ventes_jour = 0;
    let ventes_semaine = 0;
    let ventes_mois = 0;
    let totalCashSales = 0;

    for (const s of sales) {
      const sTime = new Date(s.created_at).getTime();
      if (sTime >= startOfToday) {
        ventes_jour += s.total_amount;
      }
      if (sTime >= startOfWeek) {
        ventes_semaine += s.total_amount;
      }
      if (sTime >= startOfMonth) {
        ventes_mois += s.total_amount;
      }
      if (s.payment_type === 'cash') {
        totalCashSales += s.total_amount;
      }
    }

    const totalRefundsCash = refunds.reduce((acc, r) => acc + r.amount, 0);
    const totalInjections = movements.filter((m) => m.type === 'injection').reduce((acc, m) => acc + m.amount, 0);
    const totalWithdrawals = movements.filter((m) => m.type === 'withdrawal').reduce((acc, m) => acc + m.amount, 0);

    // Stock value
    let valeur_stock_achat = 0;
    let valeur_stock_vente = 0;
    let nb_produits_alerte = 0;

    for (const p of products) {
      valeur_stock_achat += p.unit_stock * p.unit_purchase_price;
      valeur_stock_vente += p.unit_stock * p.unit_sale_price;
      if (p.min_alert_threshold && p.unit_stock <= p.min_alert_threshold) {
        nb_produits_alerte++;
      }
    }

    // Credits en cours
    const total_credits_en_cours = clients.reduce((acc, c) => acc + c.credit_balance, 0);
    const nb_clients_debiteurs = clients.filter((c) => c.credit_balance > 0).length;

    // Solde de caisse = Capital initial + Injections + Ventes Cash + Remboursements reçus - Retraits
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
  }

  // --- DELTA SYNC ---
  getDelta(boutiqueId: string, sinceTimestamp?: string) {
    const since = sinceTimestamp ? new Date(sinceTimestamp).getTime() : 0;
    return {
      products: this.getProducts(boutiqueId).filter((p) => new Date(p.updated_at).getTime() > since),
      sales: this.getSales(boutiqueId, 50).filter((s) => new Date(s.created_at).getTime() > since),
      clients: this.getClients(boutiqueId).filter((c) => new Date(c.updated_at).getTime() > since),
      refunds: this.getRefunds(boutiqueId).filter((r) => new Date(r.created_at).getTime() > since),
      cash_movements: this.getCashMovements(boutiqueId).filter((m) => new Date(m.created_at).getTime() > since),
      cash_closings: this.getCashClosings(boutiqueId).filter((c) => new Date(c.created_at).getTime() > since),
      stats: this.getDashboardStats(boutiqueId),
      server_timestamp: new Date().toISOString(),
    };
  }
}

export const db = new DatabaseService();
