import express from 'express';
import http from 'http';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import {
  authMiddleware,
  requireAdmin,
  generateToken,
  extractDeviceInfo,
  AuthRequest,
} from './server/auth';
import { realtimeHub } from './server/realtime';
import {
  User,
  Boutique,
  Product,
  Sale,
  Client,
  Refund,
  CashMovement,
  CashClosing,
  ActiveSession,
} from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Initialize WebSocket Hub
realtimeHub.init(server);

// --- HEALTH & STATUS ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BoutiquePro Server',
  });
});

// --- AUTHENTICATION ROUTES ---

// 1. Inscription manuelle (Créateur devient Administrateur de la boutique)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { first_name, last_name, boutique_name, email, password, password_confirm } = req.body;

    if (!first_name || !last_name || !boutique_name || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs marqués sont obligatoires.' });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ error: 'Les deux mots de passe ne correspondent pas.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Un compte avec cette adresse e-mail existe déjà.' });
    }

    const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const boutique: Boutique = {
      id: boutiqueId,
      name: boutique_name.trim(),
      owner_id: userId,
      initial_capital: 0,
      currency: 'FCFA',
      created_at: now,
    };
    db.createBoutique(boutique);

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const user = db.createUser({
      id: userId,
      email: email.trim().toLowerCase(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: 'admin', // Auto-promoted to Admin
      boutique_id: boutiqueId,
      is_active: true,
      password_hash,
      created_at: now,
      last_login: now,
    });

    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);

    const session: ActiveSession = {
      id: sessionId,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      boutique_id: boutiqueId,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || '127.0.0.1',
      last_active: now,
      is_current: true,
    };
    db.createSession(session);

    const token = generateToken(user, sessionId);

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: boutiqueId,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      action: 'LOGIN',
      entity_type: 'auth',
      details: `Création du compte Administrateur pour la boutique ${boutique.name}`,
      device_info: `${deviceInfo.deviceName} (${deviceInfo.browser})`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Compte Administrateur et boutique créés avec succès.',
      token,
      user,
      boutique,
      session_id: sessionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Erreur lors de l’inscription : ' + message });
  }
});

// 2. Connexion Email / Mot de passe
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Veuillez saisir votre adresse e-mail et mot de passe.' });
    }

    const userWithHash = db.findUserByEmail(email.trim());
    if (!userWithHash) {
      return res.status(401).json({ error: 'Identifiants incorrects (e-mail ou mot de passe invalide).' });
    }

    if (!userWithHash.is_active) {
      return res.status(403).json({ error: 'Ce compte a été désactivé par l’Administrateur.' });
    }

    const isValidPassword = bcrypt.compareSync(password, userWithHash.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects (e-mail ou mot de passe invalide).' });
    }

    const now = new Date().toISOString();
    db.updateUser(userWithHash.id, { last_login: now });

    const boutique = db.getBoutique(userWithHash.boutique_id);
    const { password_hash, ...safeUser } = userWithHash;

    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);

    const session: ActiveSession = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || '127.0.0.1',
      last_active: now,
      is_current: true,
    };
    db.createSession(session);

    const token = generateToken(safeUser, sessionId);

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: safeUser.boutique_id,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      action: 'LOGIN',
      entity_type: 'auth',
      details: `Connexion réussie (${safeUser.role.toUpperCase()})`,
      device_info: `${deviceInfo.deviceName} (${deviceInfo.browser})`,
      timestamp: now,
    });

    res.json({
      message: 'Connexion réussie',
      token,
      user: safeUser,
      boutique,
      session_id: sessionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur de connexion : ' + message });
  }
});

// 3. Connexion / Inscription via Google OAuth
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, name, picture, google_id } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Adresse e-mail Google requise.' });
    }

    let userWithHash = db.findUserByEmail(email.trim());
    let boutique: Boutique | undefined;
    const now = new Date().toISOString();

    if (!userWithHash) {
      // Auto-register new Google user with their own boutique as Admin
      const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);
      const userId = 'usr_' + Math.random().toString(36).substring(2, 9);

      const nameParts = (name || 'Commerçant Google').split(' ');
      const firstName = nameParts[0] || 'Gérant';
      const lastName = nameParts.slice(1).join(' ') || 'Boutique';

      boutique = {
        id: boutiqueId,
        name: `Boutique de ${firstName}`,
        owner_id: userId,
        initial_capital: 0,
        currency: 'FCFA',
        created_at: now,
      };
      db.createBoutique(boutique);

      const salt = bcrypt.genSaltSync(10);
      const autoPassword = bcrypt.hashSync('GoogleAuth_' + Math.random().toString(36), salt);

      const createdUser = db.createUser({
        id: userId,
        email: email.trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        boutique_id: boutiqueId,
        is_active: true,
        avatar: picture,
        password_hash: autoPassword,
        created_at: now,
        last_login: now,
      });

      userWithHash = db.findUserById(createdUser.id);
    } else {
      boutique = db.getBoutique(userWithHash.boutique_id);
      db.updateUser(userWithHash.id, { last_login: now, avatar: picture || userWithHash.avatar });
    }

    if (!userWithHash || !userWithHash.is_active) {
      return res.status(403).json({ error: 'Compte désactivé.' });
    }

    const { password_hash, ...safeUser } = userWithHash;
    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);

    const session: ActiveSession = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`,
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || '127.0.0.1',
      last_active: now,
      is_current: true,
    };
    db.createSession(session);

    const token = generateToken(safeUser, sessionId);

    res.json({
      message: 'Connexion Google réussie',
      token,
      user: safeUser,
      boutique,
      session_id: sessionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur authentification Google : ' + message });
  }
});

// 3b. Synchronisation de session utilisateur (Firebase / multi-connexion)
app.post('/api/auth/sync-session', async (req, res) => {
  try {
    const { id, email, first_name, last_name, role, boutique_id } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'Identifiant et e-mail requis pour synchroniser la session.' });
    }

    const now = new Date().toISOString();
    let userWithHash = db.findUserById(id) || db.findUserByEmail(email);

    if (!userWithHash) {
      const btqId = boutique_id || 'btq_' + Math.random().toString(36).substring(2, 9);
      let btq = db.getBoutique(btqId);
      if (!btq) {
        btq = {
          id: btqId,
          name: `Boutique de ${first_name || 'Commerçant'}`,
          owner_id: id,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };
        db.createBoutique(btq);
      }

      const salt = bcrypt.genSaltSync(10);
      const autoPassword = bcrypt.hashSync('Sync_' + Math.random().toString(36), salt);
      const createdUser = db.createUser({
        id,
        email: email.trim().toLowerCase(),
        first_name: first_name || 'Utilisateur',
        last_name: last_name || '',
        role: role || 'admin',
        boutique_id: btqId,
        is_active: true,
        password_hash: autoPassword,
        created_at: now,
        last_login: now,
      });
      userWithHash = db.findUserById(createdUser.id);
    } else {
      db.updateUser(userWithHash.id, {
        last_login: now,
        is_active: true,
        ...(first_name ? { first_name } : {}),
        ...(last_name ? { last_name } : {}),
        ...(boutique_id ? { boutique_id } : {}),
      });
      userWithHash = db.findUserById(userWithHash.id);
    }

    const { password_hash, ...safeUser } = userWithHash!;
    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    const deviceInfo = extractDeviceInfo(req);

    const session: ActiveSession = {
      id: sessionId,
      user_id: safeUser.id,
      user_name: `${safeUser.first_name} ${safeUser.last_name}`.trim(),
      boutique_id: safeUser.boutique_id,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: req.ip || '127.0.0.1',
      last_active: now,
      is_current: true,
    };
    db.createSession(session);

    const token = generateToken(safeUser, sessionId);
    const boutique = db.getBoutique(safeUser.boutique_id);

    res.json({
      message: 'Session synchronisée avec succès.',
      token,
      user: safeUser,
      boutique,
      session_id: sessionId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur synchronisation session : ' + message });
  }
});

// 4. Session en cours (Me)
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const boutique = db.getBoutique(req.user!.boutique_id);
  const stats = req.user!.role === 'admin' ? db.getDashboardStats(req.user!.boutique_id) : null;
  res.json({
    user: req.user,
    boutique,
    stats,
    session_id: req.session_id,
  });
});

// 5. Mot de passe oublié (Lien de réinitialisation sécurisé)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Adresse e-mail requise.' });
  }
  const user = db.findUserByEmail(email.trim());
  if (!user) {
    // Return friendly generic response for security
    return res.json({
      message: 'Si cette adresse existe, un lien temporaire de réinitialisation lui a été envoyé.',
    });
  }
  // In development, return simulated reset token
  const resetToken = 'rst_' + Math.random().toString(36).substring(2, 10);
  res.json({
    message: 'Un e-mail de réinitialisation sécurisé a été généré avec succès.',
    simulation_link: `/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
  });
});

// 6. Gestion des sessions actives
app.get('/api/auth/sessions', authMiddleware, (req: AuthRequest, res) => {
  const sessions = db.getActiveSessions(req.user!.boutique_id).map((s) => ({
    ...s,
    is_current: s.id === req.session_id,
  }));
  res.json({ sessions });
});

app.delete('/api/auth/sessions/:id', authMiddleware, (req: AuthRequest, res) => {
  const sessionId = req.params.id;
  db.removeSession(sessionId);
  realtimeHub.broadcastSessionRevocation(sessionId);
  res.json({ message: 'Session révoquée avec succès.' });
});

app.post('/api/auth/sessions/revoke-all', authMiddleware, (req: AuthRequest, res) => {
  const currentSessionId = req.session_id;
  const sessions = db.getActiveSessions(req.user!.boutique_id);
  for (const s of sessions) {
    if (s.id !== currentSessionId) {
      db.removeSession(s.id);
      realtimeHub.broadcastSessionRevocation(s.id);
    }
  }
  res.json({ message: 'Tous les autres appareils ont été déconnectés.' });
});

// --- GESTION DES CAISSIERS (ADMIN UNIQUEMENT) ---
app.get('/api/cashiers', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const cashiers = db.getCashiers(req.user!.boutique_id);
  res.json({ cashiers });
});

app.post('/api/cashiers', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs du caissier sont obligatoires.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Cet identifiant / e-mail est déjà utilisé.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const cashier = db.createUser({
      id: 'usr_csh_' + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: 'cashier',
      boutique_id: req.user!.boutique_id,
      is_active: true,
      password_hash,
      created_at: now,
    });

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'user',
      id: cashier.id,
      data: cashier,
      timestamp: now,
      user_id: req.user!.id,
    });

    res.status(201).json({ message: 'Compte Caissier créé avec succès.', cashier });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur création caissier : ' + message });
  }
});

app.patch('/api/cashiers/:id/status', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const { is_active } = req.body;
  const updated = db.updateUser(req.params.id, { is_active: Boolean(is_active) });
  if (!updated) {
    return res.status(404).json({ error: 'Caissier introuvable.' });
  }
  if (!is_active) {
    db.removeAllUserSessions(req.params.id);
  }
  res.json({ message: `Compte caissier ${is_active ? 'activé' : 'désactivé'}`, cashier: updated });
});

app.delete('/api/cashiers/:id', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const deleted = db.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Caissier introuvable.' });
  }
  db.removeAllUserSessions(req.params.id);
  res.json({ message: 'Compte caissier supprimé définitivement.' });
});

// --- GESTION DES PRODUITS (GROS / DÉTAIL) ---
app.get('/api/products', authMiddleware, (req: AuthRequest, res) => {
  const products = db.getProducts(req.user!.boutique_id);
  res.json({ products });
});

app.post('/api/products', authMiddleware, (req: AuthRequest, res) => {
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
      barcode,
    } = req.body;

    if (!name || !package_type) {
      return res.status(400).json({ error: 'Nom du produit et type de conditionnement requis.' });
    }

    const pkgPrice = Number(package_purchase_price) || 0;
    const unitsPerPkg = Math.max(1, Number(units_per_package) || 1);
    // Calcul automatique obligatoire : Prix d'achat du conditionnement ÷ Nombre d'unités
    const calculatedUnitPurchasePrice = Math.round((pkgPrice / unitsPerPkg) * 100) / 100;
    const salePrice = Number(unit_sale_price) || 0;

    const pkgStock = Number(package_stock) || 0;
    // Stock en unités disponibles à la vente = stock en paquets * unités par paquet (ou saisie manuelle d'unités additionnelles)
    const totalUnitStock = Number(unit_stock) !== undefined && Number(unit_stock) > 0 ? Number(unit_stock) : pkgStock * unitsPerPkg;

    const now = new Date().toISOString();
    const product: Product = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      name: name.trim(),
      category: category ? category.trim() : 'Épicerie',
      package_type: package_type.trim(),
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: salePrice,
      package_stock: pkgStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: Number(min_alert_threshold) || 10,
      barcode: barcode ? String(barcode).trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    db.createProduct(product);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'product',
      id: product.id,
      data: product,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'CREATE',
      entity_type: 'product',
      entity_id: product.id,
      details: `Ajout produit : ${product.name} (${product.package_type} à ${product.package_purchase_price} FCFA -> ${product.unit_sale_price} FCFA/unité)`,
      timestamp: now,
    });

    res.status(201).json({ product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur création produit : ' + message });
  }
});

app.put('/api/products/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    const existing = db.getProductById(id, req.user!.boutique_id);
    if (!existing) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const pkgPrice = body.package_purchase_price !== undefined ? Number(body.package_purchase_price) : existing.package_purchase_price;
    const unitsPerPkg = body.units_per_package !== undefined ? Math.max(1, Number(body.units_per_package)) : existing.units_per_package;
    const calculatedUnitPurchasePrice = Math.round((pkgPrice / unitsPerPkg) * 100) / 100;

    let totalUnitStock = existing.unit_stock;
    if (body.unit_stock !== undefined) {
      totalUnitStock = Number(body.unit_stock);
    } else if (body.package_stock !== undefined) {
      totalUnitStock = Number(body.package_stock) * unitsPerPkg;
    }

    const packageStock = body.package_stock !== undefined ? Number(body.package_stock) : Math.floor(totalUnitStock / unitsPerPkg);

    const updates: Partial<Product> = {
      name: body.name ? body.name.trim() : existing.name,
      category: body.category ? body.category.trim() : existing.category,
      package_type: body.package_type ? body.package_type.trim() : existing.package_type,
      package_purchase_price: pkgPrice,
      units_per_package: unitsPerPkg,
      unit_purchase_price: calculatedUnitPurchasePrice,
      unit_sale_price: body.unit_sale_price !== undefined ? Number(body.unit_sale_price) : existing.unit_sale_price,
      package_stock: packageStock,
      unit_stock: totalUnitStock,
      min_alert_threshold: body.min_alert_threshold !== undefined ? Number(body.min_alert_threshold) : existing.min_alert_threshold,
      barcode: body.barcode !== undefined ? String(body.barcode) : existing.barcode,
    };

    const updated = db.updateProduct(id, req.user!.boutique_id, updates);
    const now = new Date().toISOString();

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_UPDATED',
      entity: 'product',
      id,
      data: updated,
      timestamp: now,
      user_id: req.user!.id,
    });

    res.json({ product: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur modification produit : ' + message });
  }
});

app.delete('/api/products/:id', authMiddleware, (req: AuthRequest, res) => {
  const id = req.params.id;
  const deleted = db.deleteProduct(id, req.user!.boutique_id);
  if (!deleted) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }
  const now = new Date().toISOString();
  realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
    action: 'DATA_DELETED',
    entity: 'product',
    id,
    timestamp: now,
    user_id: req.user!.id,
  });
  res.json({ message: 'Produit supprimé.' });
});

// --- GESTION DES VENTES (CASH & CRÉDIT) ---
app.get('/api/sales', authMiddleware, (req: AuthRequest, res) => {
  const sales = db.getSales(req.user!.boutique_id, 100);
  res.json({ sales });
});

app.post('/api/sales', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { items, payment_type, client_id, client_name } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier est vide. Veuillez ajouter au moins un produit.' });
    }

    if (payment_type !== 'cash' && payment_type !== 'credit') {
      return res.status(400).json({ error: 'Mode de paiement obligatoire : Cash ou Crédit.' });
    }

    let finalClientId = client_id;
    let finalClientName = client_name;

    if (payment_type === 'credit') {
      if (!finalClientName && !finalClientId) {
        return res.status(400).json({ error: 'Pour une vente à crédit, le nom du client est obligatoire.' });
      }

      // If client name provided but no id, find or create client profile
      if (!finalClientId && finalClientName) {
        const existingClients = db.getClients(req.user!.boutique_id);
        const match = existingClients.find((c) => c.name.toLowerCase() === finalClientName.trim().toLowerCase());
        if (match) {
          finalClientId = match.id;
          finalClientName = match.name;
        } else {
          const newClient = db.createClient({
            id: 'cli_' + Math.random().toString(36).substring(2, 9),
            boutique_id: req.user!.boutique_id,
            name: finalClientName.trim(),
            credit_balance: 0,
            total_credit_purchased: 0,
            total_repaid: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          finalClientId = newClient.id;
          finalClientName = newClient.name;

          realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
            action: 'DATA_CREATED',
            entity: 'client',
            id: newClient.id,
            data: newClient,
            timestamp: newClient.created_at,
            user_id: req.user!.id,
          });
        }
      }
    }

    // Verify stock availability and compute totals
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = db.getProductById(item.product_id, req.user!.boutique_id);
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
        unit_purchase_price: product.unit_purchase_price,
      });
    }

    const now = new Date().toISOString();
    const sale: Sale = {
      id: 'sale_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      items: processedItems,
      total_amount: totalAmount,
      payment_type,
      client_id: payment_type === 'credit' ? finalClientId : null,
      client_name: payment_type === 'credit' ? finalClientName : null,
      cashier_id: req.user!.id,
      cashier_name: `${req.user!.first_name} ${req.user!.last_name}`,
      status: 'completed',
      date: now,
      created_at: now,
    };

    db.createSale(sale);

    // Broadcast Sale Created & Updated Products/Clients/Stats
    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'sale',
      id: sale.id,
      data: sale,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'CREATE',
      entity_type: 'sale',
      entity_id: sale.id,
      details: `Vente ${payment_type.toUpperCase()} de ${totalAmount} FCFA (${processedItems.length} articles) ${payment_type === 'credit' ? `au client ${finalClientName}` : ''}`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Vente enregistrée avec succès.',
      sale,
      stats: db.getDashboardStats(req.user!.boutique_id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur enregistrement vente : ' + message });
  }
});

// --- GESTION DES CLIENTS & CRÉDITS ---
app.get('/api/clients', authMiddleware, (req: AuthRequest, res) => {
  const clients = db.getClients(req.user!.boutique_id);
  res.json({ clients });
});

app.post('/api/clients', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom du client est obligatoire.' });
    }

    const now = new Date().toISOString();
    const client: Client = {
      id: 'cli_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      credit_balance: 0,
      total_credit_purchased: 0,
      total_repaid: 0,
      notes: notes ? notes.trim() : undefined,
      created_at: now,
      updated_at: now,
    };

    db.createClient(client);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'client',
      id: client.id,
      data: client,
      timestamp: now,
      user_id: req.user!.id,
    });

    res.status(201).json({ client });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur création client : ' + message });
  }
});

app.delete('/api/clients/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.deleteClient(req.params.id, req.user!.boutique_id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  const now = new Date().toISOString();
  realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
    action: 'DATA_DELETED',
    entity: 'client',
    id: req.params.id,
    timestamp: now,
    user_id: req.user!.id,
  });
  res.json({ message: 'Fiche client supprimée avec succès.' });
});

// --- REMBOURSEMENTS DE CRÉDIT ---
app.get('/api/refunds', authMiddleware, (req: AuthRequest, res) => {
  const refunds = db.getRefunds(req.user!.boutique_id);
  res.json({ refunds });
});

app.post('/api/refunds', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { client_id, amount, note } = req.body;
    const refundAmount = Number(amount);

    if (!client_id || !refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: 'Client et montant de remboursement valide (> 0) obligatoires.' });
    }

    const client = db.getClientById(client_id, req.user!.boutique_id);
    if (!client) {
      return res.status(404).json({ error: 'Client introuvable.' });
    }

    if (client.credit_balance <= 0) {
      return res.status(400).json({ error: 'Ce client n’a aucune créance impayée.' });
    }

    const now = new Date().toISOString();
    const refund: Refund = {
      id: 'ref_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      client_id: client.id,
      client_name: client.name,
      amount: refundAmount,
      note: note ? note.trim() : undefined,
      cashier_id: req.user!.id,
      cashier_name: `${req.user!.first_name} ${req.user!.last_name}`,
      date: now,
      created_at: now,
    };

    db.createRefund(refund);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'refund',
      id: refund.id,
      data: refund,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'REFUND',
      entity_type: 'refund',
      entity_id: refund.id,
      details: `Remboursement de ${refundAmount} FCFA par ${client.name} (Reste dû : ${client.credit_balance} FCFA)`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Remboursement enregistré avec succès.',
      refund,
      client: db.getClientById(client_id, req.user!.boutique_id),
      stats: db.getDashboardStats(req.user!.boutique_id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur remboursement : ' + message });
  }
});

// --- GESTION DE LA CAISSE (RETRAITS & INJECTIONS) ---
app.get('/api/cash/movements', authMiddleware, (req: AuthRequest, res) => {
  const movements = db.getCashMovements(req.user!.boutique_id);
  res.json({ movements });
});

// Retrait de caisse (Formulaire obligatoire : Montant, Motif, Auteur)
app.post('/api/cash/withdrawals', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { amount, reason, author } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Le montant du retrait doit être supérieur à 0.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Le motif du retrait est obligatoire.' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'Le nom de la personne ayant effectué le retrait est obligatoire.' });
    }

    const now = new Date().toISOString();
    const movement: CashMovement = {
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      type: 'withdrawal',
      amount: numAmount,
      reason: reason.trim(),
      author: author.trim(),
      cashier_id: req.user!.id,
      date: now,
      created_at: now,
    };

    db.createCashMovement(movement);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'cash_movement',
      id: movement.id,
      data: movement,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'CREATE',
      entity_type: 'cash_movement',
      entity_id: movement.id,
      details: `Retrait de caisse de ${numAmount} FCFA par ${author.trim()} (Motif : ${reason.trim()})`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Retrait de caisse enregistré.',
      movement,
      stats: db.getDashboardStats(req.user!.boutique_id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur retrait : ' + message });
  }
});

// Injection de capital (Formulaire obligatoire : Montant, Motif, Auteur)
app.post('/api/cash/injections', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { amount, reason, author } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Le montant de l’injection doit être supérieur à 0.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Le motif de l’injection de capital est obligatoire.' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'Le nom de la personne ayant injecté les fonds est obligatoire.' });
    }

    const now = new Date().toISOString();
    const movement: CashMovement = {
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      type: 'injection',
      amount: numAmount,
      reason: reason.trim(),
      author: author.trim(),
      cashier_id: req.user!.id,
      date: now,
      created_at: now,
    };

    db.createCashMovement(movement);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'DATA_CREATED',
      entity: 'cash_movement',
      id: movement.id,
      data: movement,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'CREATE',
      entity_type: 'cash_movement',
      entity_id: movement.id,
      details: `Injection de capital de ${numAmount} FCFA par ${author.trim()} (Motif : ${reason.trim()})`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Injection de capital enregistrée.',
      movement,
      stats: db.getDashboardStats(req.user!.boutique_id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur injection : ' + message });
  }
});

// --- CLÔTURE DE CAISSE (ADMIN UNIQUEMENT) ---
app.get('/api/cash/closings', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const closings = db.getCashClosings(req.user!.boutique_id);
  res.json({ closings });
});

app.post('/api/cash/closings', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { counted_cash, notes } = req.body;
    const numCounted = Number(counted_cash);

    if (isNaN(numCounted) || numCounted < 0) {
      return res.status(400).json({ error: 'Le montant physique compté en caisse est obligatoire.' });
    }

    const stats = db.getDashboardStats(req.user!.boutique_id);
    const theoreticalCash = stats.solde_caisse;
    const discrepancy = numCounted - theoreticalCash;
    const now = new Date().toISOString();

    const sales = db.getSales(req.user!.boutique_id);
    const cashSales = sales.filter((s) => s.payment_type === 'cash').reduce((acc, s) => acc + s.total_amount, 0);
    const creditSales = sales.filter((s) => s.payment_type === 'credit').reduce((acc, s) => acc + s.total_amount, 0);
    const refunds = db.getRefunds(req.user!.boutique_id).reduce((acc, r) => acc + r.amount, 0);

    const closing: CashClosing = {
      id: 'cls_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      date: now,
      theoretical_cash: theoreticalCash,
      counted_cash: numCounted,
      discrepancy,
      total_cash_sales: cashSales,
      total_credit_sales: creditSales,
      total_refunds: refunds,
      total_withdrawals: stats.retraits_total,
      total_injections: stats.injections_total,
      notes: notes ? notes.trim() : undefined,
      closed_by_id: req.user!.id,
      closed_by_name: `${req.user!.first_name} ${req.user!.last_name}`,
      created_at: now,
    };

    db.createCashClosing(closing);

    realtimeHub.broadcastToBoutique(req.user!.boutique_id, {
      action: 'CASH_CLOSED',
      entity: 'cash_closing',
      id: closing.id,
      data: closing,
      timestamp: now,
      user_id: req.user!.id,
    });

    db.addAuditLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      boutique_id: req.user!.boutique_id,
      user_id: req.user!.id,
      user_name: `${req.user!.first_name} ${req.user!.last_name}`,
      action: 'CLOSE_CASH',
      entity_type: 'cash_closing',
      entity_id: closing.id,
      details: `Clôture de caisse journalière : Compté ${numCounted} FCFA vs Théorique ${theoreticalCash} FCFA (Écart : ${discrepancy >= 0 ? '+' : ''}${discrepancy} FCFA)`,
      timestamp: now,
    });

    res.status(201).json({
      message: 'Clôture de caisse effectuée et archivée.',
      closing,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: 'Erreur clôture caisse : ' + message });
  }
});

// --- DASHBOARD STATS (ADMIN UNIQUEMENT) ---
app.get('/api/dashboard/stats', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const stats = db.getDashboardStats(req.user!.boutique_id);
  res.json({ stats });
});

// --- AUDIT LOGS (ADMIN UNIQUEMENT) ---
app.get('/api/audit-logs', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  const logs = db.getAuditLogs(req.user!.boutique_id, 100);
  res.json({ logs });
});

// --- DELTA SYNC (SYNCHRONISATION HORS-LIGNE & MULTI-APPAREILS) ---
app.get('/api/sync/delta', authMiddleware, (req: AuthRequest, res) => {
  const since = req.query.since as string | undefined;
  const delta = db.getDelta(req.user!.boutique_id, since);
  res.json(delta);
});

// --- RESET DES DONNÉES MÉTIER (ADMIN UNIQUEMENT) ---
app.post('/api/boutique/reset', authMiddleware, requireAdmin, (req: AuthRequest, res) => {
  try {
    const boutiqueId = req.user!.boutique_id;
    db.resetBoutiqueBusinessData(boutiqueId);
    realtimeHub.broadcastToBoutique(boutiqueId, {
      action: 'DATA_DELETED',
      entity: 'stats',
      id: boutiqueId,
      timestamp: new Date().toISOString(),
      user_id: req.user!.id,
    });
    res.json({ message: 'Toutes les données métier ont été réinitialisées avec succès.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation';
    res.status(500).json({ error: message });
  }
});

// --- CLIENT-SIDE APPLICATION OR VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server, overlay: false },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BoutiquePro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
