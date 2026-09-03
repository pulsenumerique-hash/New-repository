import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, ActiveSession } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'boutiquepro_jwt_secret_dev_2026_super_secure';

export interface AuthRequest extends Request {
  user?: User;
  session_id?: string;
  token?: string;
}

export function generateToken(user: User, sessionId: string): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      boutique_id: user.boutique_id,
      session_id: sessionId,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string; boutique_id: string; session_id: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; boutique_id: string; session_id: string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié. Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Session expirée ou token invalide. Veuillez vous reconnecter.' });
  }

  let user = db.findUserById(decoded.id);
  if (!user && decoded.email) {
    user = db.findUserByEmail(decoded.email);
  }

  // If token is cryptographically valid from our server but DB was cleared/restarted, auto-restore
  if (!user && decoded.id && decoded.email) {
    const now = new Date().toISOString();
    db.createUser({
      id: decoded.id,
      email: decoded.email,
      first_name: 'Utilisateur',
      last_name: decoded.role === 'admin' ? 'Admin' : 'Caissier',
      role: (decoded.role as 'admin' | 'cashier') || 'admin',
      boutique_id: decoded.boutique_id || 'btq_default',
      is_active: true,
      password_hash: '',
      created_at: now,
      last_login: now,
    });
    user = db.findUserById(decoded.id);
  }

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Compte utilisateur désactivé ou inexistant.' });
  }

  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  req.session_id = decoded.session_id;
  req.token = token;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé exclusivement à l’Administrateur de la boutique.' });
  }
  next();
}

export function extractDeviceInfo(req: Request): { deviceName: string; deviceType: 'desktop' | 'mobile' | 'tablet'; browser: string } {
  const ua = req.headers['user-agent'] || '';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  let deviceName = 'Ordinateur';

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
    deviceName = 'Tablette';
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = /android/i.test(ua) ? 'Téléphone Android' : /iphone/i.test(ua) ? 'iPhone' : 'Smartphone';
  } else {
    if (/macintosh|mac os x/i.test(ua)) deviceName = 'Mac (Desktop)';
    else if (/windows/i.test(ua)) deviceName = 'PC Windows';
    else if (/linux/i.test(ua)) deviceName = 'PC Linux';
  }

  let browser = 'Navigateur';
  if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  return { deviceName, deviceType, browser };
}
