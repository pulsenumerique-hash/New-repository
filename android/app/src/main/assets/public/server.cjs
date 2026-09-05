var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_vite = require("vite");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "boutique_db.json");
var DatabaseService = class {
  constructor() {
    this.saveTimeout = null;
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }
  ensureDataDir() {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
  loadDatabase() {
    if (import_fs.default.existsSync(DB_FILE)) {
      try {
        const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse database file, initializing default:", err);
      }
    }
    const defaultData = this.createInitialSeed();
    this.persistSync(defaultData);
    return defaultData;
  }
  createInitialSeed() {
    const salt = import_bcryptjs.default.genSaltSync(10);
    const demoPasswordHash = import_bcryptjs.default.hashSync("admin123", salt);
    const cashierPasswordHash = import_bcryptjs.default.hashSync("caisse123", salt);
    const boutiqueId = "btq_demo_001";
    const adminId = "usr_admin_001";
    const cashierId = "usr_cashier_001";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const initialBoutique = {
      id: boutiqueId,
      name: "Superette \xC9toile du Sahel",
      owner_id: adminId,
      initial_capital: 0,
      currency: "FCFA",
      created_at: now
    };
    const adminUser = {
      id: adminId,
      email: "admin@boutiquepro.com",
      first_name: "Amadou",
      last_name: "Diallo",
      role: "admin",
      boutique_id: boutiqueId,
      is_active: true,
      password_hash: demoPasswordHash,
      created_at: now,
      last_login: now
    };
    const cashierUser = {
      id: cashierId,
      email: "moussa@boutiquepro.com",
      first_name: "Moussa",
      last_name: "Kon\xE9",
      role: "cashier",
      boutique_id: boutiqueId,
      is_active: true,
      password_hash: cashierPasswordHash,
      created_at: now,
      last_login: now
    };
    const products = [
      {
        id: "prod_001",
        boutique_id: boutiqueId,
        name: "Bonbons Menthe Fra\xEEche",
        category: "Confiserie",
        package_type: "Paquet",
        package_purchase_price: 1e3,
        units_per_package: 20,
        unit_purchase_price: 50,
        // 1000 / 20 = 50 FCFA
        unit_sale_price: 75,
        // Marge = 25 FCFA / bonbon
        package_stock: 5,
        unit_stock: 100,
        // 5 * 20 = 100 bonbons
        min_alert_threshold: 20,
        barcode: "600123456789",
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_002",
        boutique_id: boutiqueId,
        name: "Riz Parfum\xE9 Jasmin 50kg",
        category: "C\xE9r\xE9ales & Riz",
        package_type: "Sac 50kg",
        package_purchase_price: 22e3,
        units_per_package: 50,
        // 50 kg au détail
        unit_purchase_price: 440,
        // 22000 / 50 = 440 FCFA / kg
        unit_sale_price: 600,
        // 600 FCFA / kg
        package_stock: 4,
        unit_stock: 200,
        // 200 kg
        min_alert_threshold: 25,
        barcode: "600987654321",
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_003",
        boutique_id: boutiqueId,
        name: "Huile V\xE9g\xE9tale Dinor 5L (bouteille 1L)",
        category: "Huiles & Condiments",
        package_type: "Carton 4 Bidons",
        package_purchase_price: 24e3,
        units_per_package: 4,
        unit_purchase_price: 6e3,
        unit_sale_price: 7200,
        package_stock: 3,
        unit_stock: 12,
        min_alert_threshold: 4,
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_004",
        boutique_id: boutiqueId,
        name: "Lait Concentr\xE9 Sucr\xE9 Bonnet Rouge",
        category: "Produits Laitiers",
        package_type: "Carton 48 Bo\xEEtes",
        package_purchase_price: 24e3,
        units_per_package: 48,
        unit_purchase_price: 500,
        unit_sale_price: 650,
        package_stock: 2,
        unit_stock: 96,
        min_alert_threshold: 15,
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_005",
        boutique_id: boutiqueId,
        name: "Spaghetti Maman 500g",
        category: "P\xE2tes Alimentaires",
        package_type: "Carton 20 sachets",
        package_purchase_price: 7e3,
        units_per_package: 20,
        unit_purchase_price: 350,
        unit_sale_price: 450,
        package_stock: 4,
        unit_stock: 80,
        min_alert_threshold: 10,
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_006",
        boutique_id: boutiqueId,
        name: "Sucre Blanc Saint Louis (Morceaux)",
        category: "\xC9picerie",
        package_type: "Carton 25 paquets 1kg",
        package_purchase_price: 18750,
        units_per_package: 25,
        unit_purchase_price: 750,
        unit_sale_price: 900,
        package_stock: 3,
        unit_stock: 75,
        min_alert_threshold: 10,
        created_at: now,
        updated_at: now
      },
      {
        id: "prod_007",
        boutique_id: boutiqueId,
        name: "Savon de Marseille BF",
        category: "Entretien & Hygi\xE8ne",
        package_type: "Carton 36 barres",
        package_purchase_price: 9e3,
        units_per_package: 36,
        unit_purchase_price: 250,
        unit_sale_price: 350,
        package_stock: 3,
        unit_stock: 108,
        min_alert_threshold: 12,
        created_at: now,
        updated_at: now
      }
    ];
    const clients = [
      {
        id: "cli_001",
        boutique_id: boutiqueId,
        name: "Mme Fatou Traor\xE9",
        phone: "+221 77 123 45 67",
        credit_balance: 14500,
        total_credit_purchased: 34500,
        total_repaid: 2e4,
        notes: "Voisine du quartier - paie \xE0 la fin du mois",
        created_at: now,
        updated_at: now
      },
      {
        id: "cli_002",
        boutique_id: boutiqueId,
        name: "Ousmane Ciss\xE9 (Atelier Menuiserie)",
        phone: "+221 70 987 65 43",
        credit_balance: 8250,
        total_credit_purchased: 18250,
        total_repaid: 1e4,
        notes: "Remboursement hebdomadaire chaque vendredi",
        created_at: now,
        updated_at: now
      },
      {
        id: "cli_003",
        boutique_id: boutiqueId,
        name: "Ibrahim Sangar\xE9",
        phone: "+221 76 555 12 34",
        credit_balance: 0,
        // Crédit soldé -> supprimable
        total_credit_purchased: 15e3,
        total_repaid: 15e3,
        notes: "Cr\xE9dit enti\xE8rement sold\xE9 hier",
        created_at: now,
        updated_at: now
      }
    ];
    const sales = [
      {
        id: "sale_001",
        boutique_id: boutiqueId,
        items: [
          {
            product_id: "prod_001",
            product_name: "Bonbons Menthe Fra\xEEche",
            quantity: 5,
            unit_price: 75,
            total_price: 375,
            unit_purchase_price: 50
          },
          {
            product_id: "prod_004",
            product_name: "Lait Concentr\xE9 Sucr\xE9 Bonnet Rouge",
            quantity: 2,
            unit_price: 650,
            total_price: 1300,
            unit_purchase_price: 500
          }
        ],
        total_amount: 1675,
        payment_type: "cash",
        cashier_id: cashierId,
        cashier_name: "Moussa Kon\xE9",
        status: "completed",
        date: now,
        created_at: now
      },
      {
        id: "sale_002",
        boutique_id: boutiqueId,
        items: [
          {
            product_id: "prod_002",
            product_name: "Riz Parfum\xE9 Jasmin 50kg",
            quantity: 10,
            // 10 kg
            unit_price: 600,
            total_price: 6e3,
            unit_purchase_price: 440
          }
        ],
        total_amount: 6e3,
        payment_type: "credit",
        client_id: "cli_001",
        client_name: "Mme Fatou Traor\xE9",
        cashier_id: cashierId,
        cashier_name: "Moussa Kon\xE9",
        status: "completed",
        date: now,
        created_at: now
      }
    ];
    const cash_movements = [];
    const audit_logs = [
      {
        id: "log_001",
        boutique_id: boutiqueId,
        user_id: adminId,
        user_name: "Amadou Diallo",
        action: "CREATE",
        entity_type: "product",
        entity_id: "prod_001",
        details: "Cr\xE9ation du produit Bonbons Menthe Fra\xEEche (1000 FCFA/paquet de 20 -> 75 FCFA/unit\xE9)",
        device_info: "PC Bureau (Chrome/Linux)",
        timestamp: now
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
      active_sessions: []
    };
  }
  save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.data);
    }, 100);
  }
  persistSync(data) {
    try {
      this.ensureDataDir();
      const tmpPath = `${DB_FILE}.tmp`;
      import_fs.default.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
      import_fs.default.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error("Error writing database to disk:", err);
    }
  }
  // --- BOUTIQUE ---
  getBoutique(id) {
    return this.data.boutiques.find((b) => b.id === id);
  }
  createBoutique(boutique) {
    this.data.boutiques.push(boutique);
    this.save();
    return boutique;
  }
  // --- USERS ---
  findUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  findUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  createUser(user) {
    this.data.users.push(user);
    this.save();
    const { password_hash, ...publicUser } = user;
    return publicUser;
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { password_hash, ...publicUser } = this.data.users[idx];
    return publicUser;
  }
  deleteUser(id) {
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.save();
    return this.data.users.length < prevLen;
  }
  getCashiers(boutiqueId) {
    return this.data.users.filter((u) => u.boutique_id === boutiqueId && u.role === "cashier").map(({ password_hash, ...user }) => user);
  }
  // --- PRODUCTS ---
  getProducts(boutiqueId) {
    return this.data.products.filter((p) => p.boutique_id === boutiqueId);
  }
  getProductById(id, boutiqueId) {
    return this.data.products.find((p) => p.id === id && p.boutique_id === boutiqueId);
  }
  createProduct(product) {
    this.data.products.push(product);
    this.save();
    return product;
  }
  updateProduct(id, boutiqueId, updates) {
    const idx = this.data.products.findIndex((p) => p.id === id && p.boutique_id === boutiqueId);
    if (idx === -1) return null;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.data.products[idx] = { ...this.data.products[idx], ...updates, updated_at: now };
    this.save();
    return this.data.products[idx];
  }
  deleteProduct(id, boutiqueId) {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => !(p.id === id && p.boutique_id === boutiqueId));
    this.save();
    return this.data.products.length < prevLen;
  }
  // --- SALES ---
  getSales(boutiqueId, limit = 100) {
    return this.data.sales.filter((s) => s.boutique_id === boutiqueId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  }
  createSale(sale) {
    this.data.sales.unshift(sale);
    for (const item of sale.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id && p.boutique_id === sale.boutique_id);
      if (prod) {
        prod.unit_stock = Math.max(0, prod.unit_stock - item.quantity);
        prod.package_stock = prod.units_per_package > 0 ? Math.floor(prod.unit_stock / prod.units_per_package) : 0;
        prod.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    if (sale.payment_type === "credit" && sale.client_id) {
      const client = this.data.clients.find((c) => c.id === sale.client_id && c.boutique_id === sale.boutique_id);
      if (client) {
        client.credit_balance += sale.total_amount;
        client.total_credit_purchased += sale.total_amount;
        client.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    this.save();
    return sale;
  }
  // --- CLIENTS ---
  getClients(boutiqueId) {
    return this.data.clients.filter((c) => c.boutique_id === boutiqueId);
  }
  getClientById(id, boutiqueId) {
    return this.data.clients.find((c) => c.id === id && c.boutique_id === boutiqueId);
  }
  createClient(client) {
    this.data.clients.push(client);
    this.save();
    return client;
  }
  updateClient(id, boutiqueId, updates) {
    const idx = this.data.clients.findIndex((c) => c.id === id && c.boutique_id === boutiqueId);
    if (idx === -1) return null;
    this.data.clients[idx] = { ...this.data.clients[idx], ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    this.save();
    return this.data.clients[idx];
  }
  deleteClient(id, boutiqueId) {
    const client = this.getClientById(id, boutiqueId);
    if (!client) {
      return { success: false, error: "Client introuvable." };
    }
    if (client.credit_balance > 0) {
      return {
        success: false,
        error: `Impossible de supprimer : le client a un cr\xE9dit en cours de ${client.credit_balance} FCFA. Il doit \xEAtre totalement rembours\xE9 d'abord.`
      };
    }
    this.data.clients = this.data.clients.filter((c) => !(c.id === id && c.boutique_id === boutiqueId));
    this.save();
    return { success: true };
  }
  // --- REFUNDS (Remboursements) ---
  getRefunds(boutiqueId) {
    return this.data.refunds.filter((r) => r.boutique_id === boutiqueId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createRefund(refund) {
    this.data.refunds.unshift(refund);
    const client = this.getClientById(refund.client_id, refund.boutique_id);
    if (client) {
      client.credit_balance = Math.max(0, client.credit_balance - refund.amount);
      client.total_repaid += refund.amount;
      client.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.save();
    return refund;
  }
  // --- CASH MOVEMENTS (Retraits & Injections) ---
  getCashMovements(boutiqueId) {
    return this.data.cash_movements.filter((m) => m.boutique_id === boutiqueId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createCashMovement(movement) {
    this.data.cash_movements.unshift(movement);
    this.save();
    return movement;
  }
  // --- CASH CLOSINGS (Clôtures de caisse) ---
  getCashClosings(boutiqueId) {
    return this.data.cash_closings.filter((c) => c.boutique_id === boutiqueId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  createCashClosing(closing) {
    this.data.cash_closings.unshift(closing);
    this.save();
    return closing;
  }
  // --- AUDIT LOGS ---
  addAuditLog(log) {
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
  }
  getAuditLogs(boutiqueId, limit = 100) {
    return this.data.audit_logs.filter((l) => l.boutique_id === boutiqueId).slice(0, limit);
  }
  // --- SESSIONS ---
  createSession(session) {
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.id !== session.id);
    this.data.active_sessions.unshift(session);
    this.save();
  }
  getActiveSessions(boutiqueId) {
    return this.data.active_sessions.filter((s) => s.boutique_id === boutiqueId);
  }
  removeSession(sessionId) {
    const prev = this.data.active_sessions.length;
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.id !== sessionId);
    this.save();
    return this.data.active_sessions.length < prev;
  }
  removeAllUserSessions(userId) {
    this.data.active_sessions = this.data.active_sessions.filter((s) => s.user_id !== userId);
    this.save();
  }
  // --- DASHBOARD STATS COMPUTATION ---
  getDashboardStats(boutiqueId) {
    const boutique = this.getBoutique(boutiqueId);
    const initialCapital = boutique?.initial_capital || 0;
    const products = this.getProducts(boutiqueId);
    const sales = this.data.sales.filter((s) => s.boutique_id === boutiqueId);
    const clients = this.data.clients.filter((c) => c.boutique_id === boutiqueId);
    const refunds = this.data.refunds.filter((r) => r.boutique_id === boutiqueId);
    const movements = this.data.cash_movements.filter((m) => m.boutique_id === boutiqueId);
    const now = /* @__PURE__ */ new Date();
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
      if (sTime >= startOfToday) {
        ventes_jour += s.total_amount;
      }
      if (sTime >= startOfWeek) {
        ventes_semaine += s.total_amount;
      }
      if (sTime >= startOfMonth) {
        ventes_mois += s.total_amount;
      }
      if (s.payment_type === "cash") {
        totalCashSales += s.total_amount;
      }
    }
    const totalRefundsCash = refunds.reduce((acc, r) => acc + r.amount, 0);
    const totalInjections = movements.filter((m) => m.type === "injection").reduce((acc, m) => acc + m.amount, 0);
    const totalWithdrawals = movements.filter((m) => m.type === "withdrawal").reduce((acc, m) => acc + m.amount, 0);
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
    const total_credits_en_cours = clients.reduce((acc, c) => acc + c.credit_balance, 0);
    const nb_clients_debiteurs = clients.filter((c) => c.credit_balance > 0).length;
    const completedSales = sales.filter((s) => s.status !== "cancelled");
    const ventes_cash_total = completedSales.filter((s) => s.payment_type === "cash").reduce((acc, s) => acc + s.total_amount, 0);
    const ventes_mobile_money_total = completedSales.filter((s) => s.payment_type === "mobile_money").reduce((acc, s) => acc + s.total_amount, 0);
    const ventes_credit_total = completedSales.filter((s) => s.payment_type === "credit").reduce((acc, s) => acc + s.total_amount, 0);
    let benefice_brut_estime = 0;
    for (const s of completedSales) {
      for (const item of s.items) {
        benefice_brut_estime += (item.unit_price - (item.unit_purchase_price || 0)) * item.quantity;
      }
    }
    const solde_caisse = initialCapital + totalInjections + totalCashSales + totalRefundsCash - totalWithdrawals;
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
      nb_credits_en_retard: 0,
      total_dettes_fournisseurs: 0,
      total_depenses_mois: 0,
      benefice_brut_estime,
      benefice_net_reel: benefice_brut_estime,
      nb_produits: products.length,
      nb_produits_alerte,
      nb_produits_perimes: 0,
      nb_produits_bientot_perimes: 0,
      retraits_total: totalWithdrawals,
      injections_total: totalInjections
    };
  }
  // --- DELTA SYNC ---
  getDelta(boutiqueId, sinceTimestamp) {
    const since = sinceTimestamp ? new Date(sinceTimestamp).getTime() : 0;
    return {
      products: this.getProducts(boutiqueId).filter((p) => new Date(p.updated_at).getTime() > since),
      sales: this.getSales(boutiqueId, 50).filter((s) => new Date(s.created_at).getTime() > since),
      clients: this.getClients(boutiqueId).filter((c) => new Date(c.updated_at).getTime() > since),
      refunds: this.getRefunds(boutiqueId).filter((r) => new Date(r.created_at).getTime() > since),
      cash_movements: this.getCashMovements(boutiqueId).filter((m) => new Date(m.created_at).getTime() > since),
      cash_closings: this.getCashClosings(boutiqueId).filter((c) => new Date(c.created_at).getTime() > since),
      stats: this.getDashboardStats(boutiqueId),
      server_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};
var db = new DatabaseService();

// server/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "boutiquepro_jwt_secret_dev_2026_super_secure";
function generateToken(user, sessionId) {
  return import_jsonwebtoken.default.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      boutique_id: user.boutique_id,
      session_id: sessionId
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
function verifyToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non authentifi\xE9. Token manquant." });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Session expir\xE9e ou token invalide. Veuillez vous reconnecter." });
  }
  let user = db.findUserById(decoded.id);
  if (!user && decoded.email) {
    user = db.findUserByEmail(decoded.email);
  }
  if (!user && decoded.id && decoded.email) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.createUser({
      id: decoded.id,
      email: decoded.email,
      first_name: "Utilisateur",
      last_name: decoded.role === "admin" ? "Admin" : "Caissier",
      role: decoded.role || "admin",
      boutique_id: decoded.boutique_id || "btq_default",
      is_active: true,
      password_hash: "",
      created_at: now,
      last_login: now
    });
    user = db.findUserById(decoded.id);
  }
  if (!user || !user.is_active) {
    return res.status(401).json({ error: "Compte utilisateur d\xE9sactiv\xE9 ou inexistant." });
  }
  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  req.session_id = decoded.session_id;
  req.token = token;
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 exclusivement \xE0 l\u2019Administrateur de la boutique." });
  }
  next();
}
function extractDeviceInfo(req) {
  const ua = req.headers["user-agent"] || "";
  let deviceType = "desktop";
  let deviceName = "Ordinateur";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = "tablet";
    deviceName = "Tablette";
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = "mobile";
    deviceName = /android/i.test(ua) ? "T\xE9l\xE9phone Android" : /iphone/i.test(ua) ? "iPhone" : "Smartphone";
  } else {
    if (/macintosh|mac os x/i.test(ua)) deviceName = "Mac (Desktop)";
    else if (/windows/i.test(ua)) deviceName = "PC Windows";
    else if (/linux/i.test(ua)) deviceName = "PC Linux";
  }
  let browser = "Navigateur";
  if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";
  return { deviceName, deviceType, browser };
}

// server/realtime.ts
var import_ws = require("ws");
var RealtimeHub = class {
  constructor() {
    this.wss = null;
    this.clients = /* @__PURE__ */ new Set();
    this.pingInterval = null;
  }
  init(server2) {
    this.wss = new import_ws.WebSocketServer({ noServer: true });
    server2.on("upgrade", (req, socket, head) => {
      try {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        if (url.pathname === "/api/ws") {
          this.wss.handleUpgrade(req, socket, head, (ws) => {
            this.wss.emit("connection", ws, req);
          });
        }
      } catch (err) {
        console.error("RealtimeHub upgrade routing error:", err);
      }
    });
    this.wss.on("connection", (ws, req) => {
      let clientInfo = null;
      try {
        const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
        const token = url.searchParams.get("token");
        const deviceId = url.searchParams.get("deviceId") || "dev_" + Math.random().toString(36).substring(2, 8);
        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            clientInfo = {
              ws,
              userId: decoded.id,
              boutiqueId: decoded.boutique_id,
              role: decoded.role,
              sessionId: decoded.session_id,
              deviceId,
              isAlive: true
            };
            this.clients.add(clientInfo);
            this.send(ws, {
              type: "CONNECTED",
              payload: { message: "Connect\xE9 en temps r\xE9el", userId: decoded.id, boutiqueId: decoded.boutique_id }
            });
          }
        }
      } catch (err) {
        console.error("WS Connection error:", err);
      }
      ws.on("message", (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === "AUTH") {
            const token = parsed.token;
            const deviceId = parsed.deviceId || "dev_" + Math.random().toString(36).substring(2, 8);
            const decoded = verifyToken(token);
            if (decoded) {
              if (clientInfo) {
                this.clients.delete(clientInfo);
              }
              clientInfo = {
                ws,
                userId: decoded.id,
                boutiqueId: decoded.boutique_id,
                role: decoded.role,
                sessionId: decoded.session_id,
                deviceId,
                isAlive: true
              };
              this.clients.add(clientInfo);
              this.send(ws, {
                type: "AUTH_SUCCESS",
                payload: { userId: decoded.id, boutiqueId: decoded.boutique_id }
              });
            } else {
              this.send(ws, { type: "AUTH_FAILED", error: "Token invalide" });
            }
          } else if (parsed.type === "PONG") {
            if (clientInfo) clientInfo.isAlive = true;
          } else if (parsed.type === "PING") {
            this.send(ws, { type: "PONG" });
          }
        } catch {
        }
      });
      ws.on("pong", () => {
        if (clientInfo) clientInfo.isAlive = true;
      });
      ws.on("close", () => {
        if (clientInfo) {
          this.clients.delete(clientInfo);
        }
      });
      ws.on("error", () => {
        if (clientInfo) {
          this.clients.delete(clientInfo);
        }
      });
    });
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        try {
          client.ws.ping();
          this.send(client.ws, { type: "PING" });
        } catch {
          this.clients.delete(client);
        }
      });
    }, 25e3);
  }
  send(ws, data) {
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
  broadcastToBoutique(boutiqueId, event, excludeWs) {
    const message = JSON.stringify({
      type: "SYNC_EVENT",
      payload: event
    });
    let count = 0;
    this.clients.forEach((client) => {
      if (client.boutiqueId === boutiqueId && client.ws !== excludeWs && client.ws.readyState === import_ws.WebSocket.OPEN) {
        client.ws.send(message);
        count++;
      }
    });
    return count;
  }
  broadcastSessionRevocation(sessionId) {
    const message = JSON.stringify({
      type: "SESSION_REVOKED",
      payload: { sessionId }
    });
    this.clients.forEach((client) => {
      if (client.sessionId === sessionId && client.ws.readyState === import_ws.WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }
  getConnectedDevicesCount(boutiqueId) {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.boutiqueId === boutiqueId && client.ws.readyState === import_ws.WebSocket.OPEN) {
        count++;
      }
    });
    return count;
  }
};
var realtimeHub = new RealtimeHub();

// server.ts
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var PORT = 3e3;
app.use(import_express.default.json());
realtimeHub.init(server);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "BoutiquePro Server"
  });
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { first_name, last_name, boutique_name, email, password, password_confirm } = req.body;
    if (!first_name || !last_name || !boutique_name || !email || !password) {
      return res.status(400).json({ error: "Tous les champs marqu\xE9s sont obligatoires." });
    }
    if (password !== password_confirm) {
      return res.status(400).json({ error: "Les deux mots de passe ne correspondent pas." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res." });
    }
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Un compte avec cette adresse e-mail existe d\xE9j\xE0." });
    }
    const boutiqueId = "btq_" + Math.random().toString(36).substring(2, 9);
    const userId = "usr_" + Math.random().toString(36).substring(2, 9);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const boutique = {
      id: boutiqueId,
      name: boutique_name.trim(),
      owner_id: userId,
      initial_capital: 0,
      currency: "FCFA",
      created_at: now
    };
    db.createBoutique(boutique);
    const salt = import_bcryptjs2.default.genSaltSync(10);
    const password_hash = import_bcryptjs2.default.hashSync(password, salt);
    const user = db.createUser({
      id: userId,
      email: email.trim().toLowerCase(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: "admin",
      // Auto-promoted to Admin
      boutique_id: boutiqueId,
      is_active: true,
      password_hash,
      created_at: now,
      last_login: now
    });
    const sessionId = "ses_" + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);
    const session = {
      id: sessionId,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      boutique_id: boutiqueId,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || "127.0.0.1",
      last_active: now,
      is_current: true
    };
    db.createSession(session);
    const token = generateToken(user, sessionId);
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: boutiqueId,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      action: "LOGIN",
      entity_type: "auth",
      details: `Cr\xE9ation du compte Administrateur pour la boutique ${boutique.name}`,
      device_info: `${deviceInfo.deviceName} (${deviceInfo.browser})`,
      timestamp: now
    });
    res.status(201).json({
      message: "Compte Administrateur et boutique cr\xE9\xE9s avec succ\xE8s.",
      token,
      user,
      boutique,
      session_id: sessionId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Registration error:", err);
    res.status(500).json({ error: "Erreur lors de l\u2019inscription : " + message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Veuillez saisir votre adresse e-mail et mot de passe." });
    }
    const userWithHash = db.findUserByEmail(email.trim());
    if (!userWithHash) {
      return res.status(401).json({ error: "Identifiants incorrects (e-mail ou mot de passe invalide)." });
    }
    if (!userWithHash.is_active) {
      return res.status(403).json({ error: "Ce compte a \xE9t\xE9 d\xE9sactiv\xE9 par l\u2019Administrateur." });
    }
    const isValidPassword = import_bcryptjs2.default.compareSync(password, userWithHash.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Identifiants incorrects (e-mail ou mot de passe invalide)." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.updateUser(userWithHash.id, { last_login: now });
    const boutique = db.getBoutique(userWithHash.boutique_id);
    const { password_hash, ...safeUser } = userWithHash;
    const sessionId = "ses_" + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);
    const session = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || "127.0.0.1",
      last_active: now,
      is_current: true
    };
    db.createSession(session);
    const token = generateToken(safeUser, sessionId);
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: safeUser.boutique_id,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      action: "LOGIN",
      entity_type: "auth",
      details: `Connexion r\xE9ussie (${safeUser.role.toUpperCase()})`,
      device_info: `${deviceInfo.deviceName} (${deviceInfo.browser})`,
      timestamp: now
    });
    res.json({
      message: "Connexion r\xE9ussie",
      token,
      user: safeUser,
      boutique,
      session_id: sessionId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur de connexion : " + message });
  }
});
app.post("/api/auth/google", async (req, res) => {
  try {
    const { email, name, picture, google_id } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Adresse e-mail Google requise." });
    }
    let userWithHash = db.findUserByEmail(email.trim());
    let boutique;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!userWithHash) {
      const boutiqueId = "btq_" + Math.random().toString(36).substring(2, 9);
      const userId = "usr_" + Math.random().toString(36).substring(2, 9);
      const nameParts = (name || "Commer\xE7ant Google").split(" ");
      const firstName = nameParts[0] || "G\xE9rant";
      const lastName = nameParts.slice(1).join(" ") || "Boutique";
      boutique = {
        id: boutiqueId,
        name: `Boutique de ${firstName}`,
        owner_id: userId,
        initial_capital: 0,
        currency: "FCFA",
        created_at: now
      };
      db.createBoutique(boutique);
      const salt = import_bcryptjs2.default.genSaltSync(10);
      const autoPassword = import_bcryptjs2.default.hashSync("GoogleAuth_" + Math.random().toString(36), salt);
      const createdUser = db.createUser({
        id: userId,
        email: email.trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role: "admin",
        boutique_id: boutiqueId,
        is_active: true,
        avatar: picture,
        password_hash: autoPassword,
        created_at: now,
        last_login: now
      });
      userWithHash = db.findUserById(createdUser.id);
    } else {
      boutique = db.getBoutique(userWithHash.boutique_id);
      db.updateUser(userWithHash.id, { last_login: now, avatar: picture || userWithHash.avatar });
    }
    if (!userWithHash || !userWithHash.is_active) {
      return res.status(403).json({ error: "Compte d\xE9sactiv\xE9." });
    }
    const { password_hash, ...safeUser } = userWithHash;
    const sessionId = "ses_" + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);
    const session = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || "127.0.0.1",
      last_active: now,
      is_current: true
    };
    db.createSession(session);
    const token = generateToken(safeUser, sessionId);
    res.json({
      message: "Connexion Google r\xE9ussie",
      token,
      user: safeUser,
      boutique,
      session_id: sessionId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur authentification Google : " + message });
  }
});
app.post("/api/auth/sync-session", async (req, res) => {
  try {
    const { id, email, first_name, last_name, role, boutique_id } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: "Identifiant et e-mail requis pour synchroniser la session." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let userWithHash = db.findUserById(id) || db.findUserByEmail(email);
    if (!userWithHash) {
      const btqId = boutique_id || "btq_" + Math.random().toString(36).substring(2, 9);
      let btq = db.getBoutique(btqId);
      if (!btq) {
        btq = {
          id: btqId,
          name: `Boutique de ${first_name || "Commer\xE7ant"}`,
          owner_id: id,
          initial_capital: 0,
          currency: "FCFA",
          created_at: now
        };
        db.createBoutique(btq);
      }
      const salt = import_bcryptjs2.default.genSaltSync(10);
      const autoPassword = import_bcryptjs2.default.hashSync("Sync_" + Math.random().toString(36), salt);
      const createdUser = db.createUser({
        id,
        email: email.trim().toLowerCase(),
        first_name: first_name || "Utilisateur",
        last_name: last_name || "",
        role: role || "admin",
        boutique_id: btqId,
        is_active: true,
        password_hash: autoPassword,
        created_at: now,
        last_login: now
      });
      userWithHash = db.findUserById(createdUser.id);
    } else {
      db.updateUser(userWithHash.id, {
        last_login: now,
        is_active: true,
        ...first_name ? { first_name } : {},
        ...last_name ? { last_name } : {},
        ...boutique_id ? { boutique_id } : {}
      });
      userWithHash = db.findUserById(userWithHash.id);
    }
    const { password_hash, ...safeUser } = userWithHash;
    const sessionId = "ses_" + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);
    const session = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`.trim(),
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || "127.0.0.1",
      last_active: now,
      is_current: true
    };
    db.createSession(session);
    const token = generateToken(safeUser, sessionId);
    const boutique = db.getBoutique(safeUser.boutique_id);
    res.json({
      message: "Session synchronis\xE9e avec succ\xE8s.",
      token,
      user: safeUser,
      boutique,
      session_id: sessionId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur synchronisation session : " + message });
  }
});
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const boutique = db.getBoutique(req.user.boutique_id);
  const stats = req.user.role === "admin" ? db.getDashboardStats(req.user.boutique_id) : null;
  res.json({
    user: req.user,
    boutique,
    stats,
    session_id: req.session_id
  });
});
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Adresse e-mail requise." });
  }
  const user = db.findUserByEmail(email.trim());
  if (!user) {
    return res.json({
      message: "Si cette adresse existe, un lien temporaire de r\xE9initialisation lui a \xE9t\xE9 envoy\xE9."
    });
  }
  const resetToken = "rst_" + Math.random().toString(36).substring(2, 10);
  res.json({
    message: "Un e-mail de r\xE9initialisation s\xE9curis\xE9 a \xE9t\xE9 g\xE9n\xE9r\xE9 avec succ\xE8s.",
    simulation_link: `/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
  });
});
app.get("/api/auth/sessions", authMiddleware, (req, res) => {
  const sessions = db.getActiveSessions(req.user.boutique_id).map((s) => ({
    ...s,
    is_current: s.id === req.session_id
  }));
  res.json({ sessions });
});
app.delete("/api/auth/sessions/:id", authMiddleware, (req, res) => {
  const sessionId = req.params.id;
  db.removeSession(sessionId);
  realtimeHub.broadcastSessionRevocation(sessionId);
  res.json({ message: "Session r\xE9voqu\xE9e avec succ\xE8s." });
});
app.post("/api/auth/sessions/revoke-all", authMiddleware, (req, res) => {
  const currentSessionId = req.session_id;
  const sessions = db.getActiveSessions(req.user.boutique_id);
  for (const s of sessions) {
    if (s.id !== currentSessionId) {
      db.removeSession(s.id);
      realtimeHub.broadcastSessionRevocation(s.id);
    }
  }
  res.json({ message: "Tous les autres appareils ont \xE9t\xE9 d\xE9connect\xE9s." });
});
app.get("/api/cashiers", authMiddleware, requireAdmin, (req, res) => {
  const cashiers = db.getCashiers(req.user.boutique_id);
  res.json({ cashiers });
});
app.post("/api/cashiers", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Tous les champs du caissier sont obligatoires." });
    }
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Cet identifiant / e-mail est d\xE9j\xE0 utilis\xE9." });
    }
    const salt = import_bcryptjs2.default.genSaltSync(10);
    const password_hash = import_bcryptjs2.default.hashSync(password, salt);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const cashier = db.createUser({
      id: "usr_csh_" + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: "cashier",
      boutique_id: req.user.boutique_id,
      is_active: true,
      password_hash,
      created_at: now
    });
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "user",
      id: cashier.id,
      data: cashier,
      timestamp: now,
      user_id: req.user.id
    });
    res.status(201).json({ message: "Compte Caissier cr\xE9\xE9 avec succ\xE8s.", cashier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur cr\xE9ation caissier : " + message });
  }
});
app.patch("/api/cashiers/:id/status", authMiddleware, requireAdmin, (req, res) => {
  const { is_active } = req.body;
  const updated = db.updateUser(req.params.id, { is_active: Boolean(is_active) });
  if (!updated) {
    return res.status(404).json({ error: "Caissier introuvable." });
  }
  if (!is_active) {
    db.removeAllUserSessions(req.params.id);
  }
  res.json({ message: `Compte caissier ${is_active ? "activ\xE9" : "d\xE9sactiv\xE9"}`, cashier: updated });
});
app.delete("/api/cashiers/:id", authMiddleware, requireAdmin, (req, res) => {
  const deleted = db.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Caissier introuvable." });
  }
  db.removeAllUserSessions(req.params.id);
  res.json({ message: "Compte caissier supprim\xE9 d\xE9finitivement." });
});
app.get("/api/products", authMiddleware, (req, res) => {
  const products = db.getProducts(req.user.boutique_id);
  res.json({ products });
});
app.post("/api/products", authMiddleware, (req, res) => {
  try {
    const {
      name,
      category,
      package_type,
      package_purchase_price,
      units_per_package,
      unit_sale_price,
      package_stock,
      unit_stock,
      min_alert_threshold,
      barcode
    } = req.body;
    if (!name || !package_type) {
      return res.status(400).json({ error: "Nom du produit et type de conditionnement requis." });
    }
    const pkgPrice = Number(package_purchase_price) || 0;
    const unitsPerPkg = Math.max(1, Number(units_per_package) || 1);
    const calculatedUnitPurchasePrice = Math.round(pkgPrice / unitsPerPkg * 100) / 100;
    const salePrice = Number(unit_sale_price) || 0;
    const pkgStock = Number(package_stock) || 0;
    const totalUnitStock = Number(unit_stock) !== void 0 && Number(unit_stock) > 0 ? Number(unit_stock) : pkgStock * unitsPerPkg;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const product = {
      id: "prod_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      name: name.trim(),
      category: category ? category.trim() : "\xC9picerie",
      package_type: package_type.trim(),
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: salePrice,
      package_stock: pkgStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: Number(min_alert_threshold) || 10,
      barcode: barcode ? String(barcode).trim() : void 0,
      created_at: now,
      updated_at: now
    };
    db.createProduct(product);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "product",
      id: product.id,
      data: product,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "CREATE",
      entity_type: "product",
      entity_id: product.id,
      details: `Ajout produit : ${product.name} (${product.package_type} \xE0 ${product.package_purchase_price} FCFA -> ${product.unit_sale_price} FCFA/unit\xE9)`,
      timestamp: now
    });
    res.status(201).json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur cr\xE9ation produit : " + message });
  }
});
app.put("/api/products/:id", authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const existing = db.getProductById(id, req.user.boutique_id);
    if (!existing) {
      return res.status(404).json({ error: "Produit introuvable." });
    }
    const pkgPrice = body.package_purchase_price !== void 0 ? Number(body.package_purchase_price) : existing.package_purchase_price;
    const unitsPerPkg = body.units_per_package !== void 0 ? Math.max(1, Number(body.units_per_package)) : existing.units_per_package;
    const calculatedUnitPurchasePrice = Math.round(pkgPrice / unitsPerPkg * 100) / 100;
    let totalUnitStock = existing.unit_stock;
    if (body.unit_stock !== void 0) {
      totalUnitStock = Number(body.unit_stock);
    } else if (body.package_stock !== void 0) {
      totalUnitStock = Number(body.package_stock) * unitsPerPkg;
    }
    const packageStock = body.package_stock !== void 0 ? Number(body.package_stock) : Math.floor(totalUnitStock / unitsPerPkg);
    const updates = {
      name: body.name ? body.name.trim() : existing.name,
      category: body.category ? body.category.trim() : existing.category,
      package_type: body.package_type ? body.package_type.trim() : existing.package_type,
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: body.unit_sale_price !== void 0 ? Number(body.unit_sale_price) : existing.unit_sale_price,
      package_stock: packageStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: body.min_alert_threshold !== void 0 ? Number(body.min_alert_threshold) : existing.min_alert_threshold,
      barcode: body.barcode !== void 0 ? String(body.barcode) : existing.barcode
    };
    const updated = db.updateProduct(id, req.user.boutique_id, updates);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_UPDATED",
      entity: "product",
      id,
      data: updated,
      timestamp: now,
      user_id: req.user.id
    });
    res.json({ product: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur modification produit : " + message });
  }
});
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const deleted = db.deleteProduct(id, req.user.boutique_id);
  if (!deleted) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  realtimeHub.broadcastToBoutique(req.user.boutique_id, {
    action: "DATA_DELETED",
    entity: "product",
    id,
    timestamp: now,
    user_id: req.user.id
  });
  res.json({ message: "Produit supprim\xE9." });
});
app.get("/api/sales", authMiddleware, (req, res) => {
  const sales = db.getSales(req.user.boutique_id, 100);
  res.json({ sales });
});
app.post("/api/sales", authMiddleware, (req, res) => {
  try {
    const { items, payment_type, client_id, client_name } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide. Veuillez ajouter au moins un produit." });
    }
    if (payment_type !== "cash" && payment_type !== "credit") {
      return res.status(400).json({ error: "Mode de paiement obligatoire : Cash ou Cr\xE9dit." });
    }
    let finalClientId = client_id;
    let finalClientName = client_name;
    if (payment_type === "credit") {
      if (!finalClientName && !finalClientId) {
        return res.status(400).json({ error: "Pour une vente \xE0 cr\xE9dit, le nom du client est obligatoire." });
      }
      if (!finalClientId && finalClientName) {
        const existingClients = db.getClients(req.user.boutique_id);
        const match = existingClients.find((c) => c.name.toLowerCase() === finalClientName.trim().toLowerCase());
        if (match) {
          finalClientId = match.id;
          finalClientName = match.name;
        } else {
          const newClient = db.createClient({
            id: "cli_" + Math.random().toString(36).substring(2, 9),
            boutique_id: req.user.boutique_id,
            name: finalClientName.trim(),
            credit_balance: 0,
            total_credit_purchased: 0,
            total_repaid: 0,
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
          finalClientId = newClient.id;
          finalClientName = newClient.name;
          realtimeHub.broadcastToBoutique(req.user.boutique_id, {
            action: "DATA_CREATED",
            entity: "client",
            id: newClient.id,
            data: newClient,
            timestamp: newClient.created_at,
            user_id: req.user.id
          });
        }
      }
    }
    let totalAmount = 0;
    const processedItems = [];
    for (const item of items) {
      const product = db.getProductById(item.product_id, req.user.boutique_id);
      if (!product) {
        return res.status(400).json({ error: `Produit "${item.product_name || item.product_id}" introuvable.` });
      }
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || product.unit_sale_price;
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: lineTotal,
        unit_purchase_price: product.unit_purchase_price
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const sale = {
      id: "sale_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      items: processedItems,
      total_amount: totalAmount,
      payment_type,
      client_id: payment_type === "credit" ? finalClientId : null,
      client_name: payment_type === "credit" ? finalClientName : null,
      cashier_id: req.user.id,
      cashier_name: `${req.user.first_name} ${req.user.last_name}`,
      status: "completed",
      date: now,
      created_at: now
    };
    db.createSale(sale);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "sale",
      id: sale.id,
      data: sale,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "CREATE",
      entity_type: "sale",
      entity_id: sale.id,
      details: `Vente ${payment_type.toUpperCase()} de ${totalAmount} FCFA (${processedItems.length} articles) ${payment_type === "credit" ? `au client ${finalClientName}` : ""}`,
      timestamp: now
    });
    res.status(201).json({
      message: "Vente enregistr\xE9e avec succ\xE8s.",
      sale,
      stats: db.getDashboardStats(req.user.boutique_id)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur enregistrement vente : " + message });
  }
});
app.get("/api/clients", authMiddleware, (req, res) => {
  const clients = db.getClients(req.user.boutique_id);
  res.json({ clients });
});
app.post("/api/clients", authMiddleware, (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Le nom du client est obligatoire." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const client = {
      id: "cli_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      name: name.trim(),
      phone: phone ? phone.trim() : void 0,
      credit_balance: 0,
      total_credit_purchased: 0,
      total_repaid: 0,
      notes: notes ? notes.trim() : void 0,
      created_at: now,
      updated_at: now
    };
    db.createClient(client);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "client",
      id: client.id,
      data: client,
      timestamp: now,
      user_id: req.user.id
    });
    res.status(201).json({ client });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur cr\xE9ation client : " + message });
  }
});
app.delete("/api/clients/:id", authMiddleware, (req, res) => {
  const result = db.deleteClient(req.params.id, req.user.boutique_id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  realtimeHub.broadcastToBoutique(req.user.boutique_id, {
    action: "DATA_DELETED",
    entity: "client",
    id: req.params.id,
    timestamp: now,
    user_id: req.user.id
  });
  res.json({ message: "Fiche client supprim\xE9e avec succ\xE8s." });
});
app.get("/api/refunds", authMiddleware, (req, res) => {
  const refunds = db.getRefunds(req.user.boutique_id);
  res.json({ refunds });
});
app.post("/api/refunds", authMiddleware, (req, res) => {
  try {
    const { client_id, amount, note } = req.body;
    const refundAmount = Number(amount);
    if (!client_id || !refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: "Client et montant de remboursement valide (> 0) obligatoires." });
    }
    const client = db.getClientById(client_id, req.user.boutique_id);
    if (!client) {
      return res.status(404).json({ error: "Client introuvable." });
    }
    if (client.credit_balance <= 0) {
      return res.status(400).json({ error: "Ce client n\u2019a aucune cr\xE9ance impay\xE9e." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const refund = {
      id: "ref_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      client_id: client.id,
      client_name: client.name,
      amount: refundAmount,
      note: note ? note.trim() : void 0,
      cashier_id: req.user.id,
      cashier_name: `${req.user.first_name} ${req.user.last_name}`,
      date: now,
      created_at: now
    };
    db.createRefund(refund);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "refund",
      id: refund.id,
      data: refund,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "REFUND",
      entity_type: "refund",
      entity_id: refund.id,
      details: `Remboursement de ${refundAmount} FCFA par ${client.name} (Reste d\xFB : ${client.credit_balance} FCFA)`,
      timestamp: now
    });
    res.status(201).json({
      message: "Remboursement enregistr\xE9 avec succ\xE8s.",
      refund,
      client: db.getClientById(client_id, req.user.boutique_id),
      stats: db.getDashboardStats(req.user.boutique_id)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur remboursement : " + message });
  }
});
app.get("/api/cash/movements", authMiddleware, (req, res) => {
  const movements = db.getCashMovements(req.user.boutique_id);
  res.json({ movements });
});
app.post("/api/cash/withdrawals", authMiddleware, (req, res) => {
  try {
    const { amount, reason, author } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: "Le montant du retrait doit \xEAtre sup\xE9rieur \xE0 0." });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Le motif du retrait est obligatoire." });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: "Le nom de la personne ayant effectu\xE9 le retrait est obligatoire." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const movement = {
      id: "mov_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      type: "withdrawal",
      amount: numAmount,
      reason: reason.trim(),
      author: author.trim(),
      cashier_id: req.user.id,
      date: now,
      created_at: now
    };
    db.createCashMovement(movement);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "cash_movement",
      id: movement.id,
      data: movement,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "CREATE",
      entity_type: "cash_movement",
      entity_id: movement.id,
      details: `Retrait de caisse de ${numAmount} FCFA par ${author.trim()} (Motif : ${reason.trim()})`,
      timestamp: now
    });
    res.status(201).json({
      message: "Retrait de caisse enregistr\xE9.",
      movement,
      stats: db.getDashboardStats(req.user.boutique_id)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur retrait : " + message });
  }
});
app.post("/api/cash/injections", authMiddleware, (req, res) => {
  try {
    const { amount, reason, author } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: "Le montant de l\u2019injection doit \xEAtre sup\xE9rieur \xE0 0." });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Le motif de l\u2019injection de capital est obligatoire." });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: "Le nom de la personne ayant inject\xE9 les fonds est obligatoire." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const movement = {
      id: "mov_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      type: "injection",
      amount: numAmount,
      reason: reason.trim(),
      author: author.trim(),
      cashier_id: req.user.id,
      date: now,
      created_at: now
    };
    db.createCashMovement(movement);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "DATA_CREATED",
      entity: "cash_movement",
      id: movement.id,
      data: movement,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "CREATE",
      entity_type: "cash_movement",
      entity_id: movement.id,
      details: `Injection de capital de ${numAmount} FCFA par ${author.trim()} (Motif : ${reason.trim()})`,
      timestamp: now
    });
    res.status(201).json({
      message: "Injection de capital enregistr\xE9e.",
      movement,
      stats: db.getDashboardStats(req.user.boutique_id)
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur injection : " + message });
  }
});
app.get("/api/cash/closings", authMiddleware, requireAdmin, (req, res) => {
  const closings = db.getCashClosings(req.user.boutique_id);
  res.json({ closings });
});
app.post("/api/cash/closings", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { counted_cash, notes } = req.body;
    const numCounted = Number(counted_cash);
    if (isNaN(numCounted) || numCounted < 0) {
      return res.status(400).json({ error: "Le montant physique compt\xE9 en caisse est obligatoire." });
    }
    const stats = db.getDashboardStats(req.user.boutique_id);
    const theoreticalCash = stats.solde_caisse;
    const discrepancy = numCounted - theoreticalCash;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const sales = db.getSales(req.user.boutique_id);
    const cashSales = sales.filter((s) => s.payment_type === "cash").reduce((acc, s) => acc + s.total_amount, 0);
    const creditSales = sales.filter((s) => s.payment_type === "credit").reduce((acc, s) => acc + s.total_amount, 0);
    const refunds = db.getRefunds(req.user.boutique_id).reduce((acc, r) => acc + r.amount, 0);
    const closing = {
      id: "cls_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      date: now,
      theoretical_cash: theoreticalCash,
      counted_cash: numCounted,
      discrepancy,
      total_cash_sales: cashSales,
      total_credit_sales: creditSales,
      total_refunds: refunds,
      total_withdrawals: stats.retraits_total,
      total_injections: stats.injections_total,
      notes: notes ? notes.trim() : void 0,
      closed_by_id: req.user.id,
      closed_by_name: `${req.user.first_name} ${req.user.last_name}`,
      created_at: now
    };
    db.createCashClosing(closing);
    realtimeHub.broadcastToBoutique(req.user.boutique_id, {
      action: "CASH_CLOSED",
      entity: "cash_closing",
      id: closing.id,
      data: closing,
      timestamp: now,
      user_id: req.user.id
    });
    db.addAuditLog({
      id: "log_" + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user.boutique_id,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`,
      action: "CLOSE_CASH",
      entity_type: "cash_closing",
      entity_id: closing.id,
      details: `Cl\xF4ture de caisse journali\xE8re : Compt\xE9 ${numCounted} FCFA vs Th\xE9orique ${theoreticalCash} FCFA (\xC9cart : ${discrepancy >= 0 ? "+" : ""}${discrepancy} FCFA)`,
      timestamp: now
    });
    res.status(201).json({
      message: "Cl\xF4ture de caisse effectu\xE9e et archiv\xE9e.",
      closing
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({ error: "Erreur cl\xF4ture caisse : " + message });
  }
});
app.get("/api/dashboard/stats", authMiddleware, requireAdmin, (req, res) => {
  const stats = db.getDashboardStats(req.user.boutique_id);
  res.json({ stats });
});
app.get("/api/audit-logs", authMiddleware, requireAdmin, (req, res) => {
  const logs = db.getAuditLogs(req.user.boutique_id, 100);
  res.json({ logs });
});
app.get("/api/sync/delta", authMiddleware, (req, res) => {
  const since = req.query.since;
  const delta = db.getDelta(req.user.boutique_id, since);
  res.json(delta);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server, overlay: false }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`BoutiquePro Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
