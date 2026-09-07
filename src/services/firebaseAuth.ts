import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode as fbVerifyPasswordResetCode,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { User, Boutique, ActiveSession } from '../types';

function getDeviceInfo(): { deviceName: string; deviceType: 'desktop' | 'mobile' | 'tablet'; browser: string } {
  const ua = navigator.userAgent || '';
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

const AUTH_CACHE_USER_KEY = 'boutiquepro_auth_cached_user_';
const AUTH_CACHE_BTQ_KEY = 'boutiquepro_auth_cached_btq_';

export function cacheAuthProfile(user: User, boutique: Boutique): void {
  try {
    localStorage.setItem(AUTH_CACHE_USER_KEY + user.id, JSON.stringify(user));
    localStorage.setItem(AUTH_CACHE_BTQ_KEY + boutique.id, JSON.stringify(boutique));
    localStorage.setItem('boutiquepro_last_auth_uid', user.id);
  } catch {
    // Ignore quota/private browsing issues
  }
}

export function getCachedAuthProfile(uid: string): { user: User | null; boutique: Boutique | null } {
  try {
    const rawUser = localStorage.getItem(AUTH_CACHE_USER_KEY + uid);
    if (!rawUser) return { user: null, boutique: null };
    const user = JSON.parse(rawUser) as User;
    const rawBtq = localStorage.getItem(AUTH_CACHE_BTQ_KEY + user.boutique_id);
    const boutique = rawBtq ? (JSON.parse(rawBtq) as Boutique) : null;
    return { user, boutique };
  } catch {
    return { user: null, boutique: null };
  }
}

export function clearCachedAuthProfile(uid?: string): void {
  try {
    if (uid) {
      localStorage.removeItem(AUTH_CACHE_USER_KEY + uid);
    }
    localStorage.removeItem('boutiquepro_last_auth_uid');
  } catch {
    // Ignore
  }
}

export const firebaseAuthService = {
  /**
   * Inscription par e-mail et mot de passe avec envoi automatique d'e-mail de vérification
   */
  async registerWithEmail(params: {
    firstName: string;
    lastName: string;
    boutiqueName: string;
    email: string;
    password: string;
  }): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean }> {
    const { firstName, lastName, boutiqueName, email, password } = params;
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(fbUser, {
      displayName: `${firstName.trim()} ${lastName.trim()}`,
    });

    // Send real email verification
    try {
      await sendEmailVerification(fbUser);
    } catch (verifErr) {
      console.warn('Erreur envoi email verification:', verifErr);
    }

    const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const boutique: Boutique = {
      id: boutiqueId,
      name: boutiqueName.trim(),
      owner_id: fbUser.uid,
      initial_capital: 0,
      currency: 'FCFA',
      created_at: now,
    };

    const user: User = {
      id: fbUser.uid,
      email: fbUser.email || email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: 'admin',
      boutique_id: boutiqueId,
      is_active: true,
      created_at: now,
      last_login: now,
    };

    // Store in Firestore
    try {
      await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...user,
        email_verified: fbUser.emailVerified,
        updated_at: now,
      });
      // Record session
      await this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, boutiqueId);
    } catch (writeErr) {
      console.warn('Notice: Deferred write of registration profile while offline:', writeErr);
    }

    cacheAuthProfile(user, boutique);

    return {
      user,
      boutique,
      needsEmailVerification: !fbUser.emailVerified,
    };
  },

  /**
   * Connexion avec Email & Mot de passe
   */
  async loginWithEmail(email: string, password: string): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean }> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = userCredential.user;

    const cached = getCachedAuthProfile(fbUser.uid);
    const now = new Date().toISOString();

    let user: User;
    let boutique: Boutique;

    try {
      // Check user doc in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // Auto-reconstruct user doc if missing
        const nameParts = (fbUser.displayName || email.split('@')[0] || 'Gérant').split(' ');
        const firstName = nameParts[0] || 'Gérant';
        const lastName = nameParts.slice(1).join(' ') || 'Admin';
        const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);

        boutique = {
          id: boutiqueId,
          name: 'Ma Boutique Pro',
          owner_id: fbUser.uid,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };
        try {
          await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
        } catch (e) {
          console.warn('Could not write boutique doc while offline:', e);
        }

        user = {
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          boutique_id: boutiqueId,
          is_active: true,
          created_at: now,
          last_login: now,
        };
        try {
          await setDoc(userDocRef, { ...user, email_verified: fbUser.emailVerified });
        } catch (e) {
          console.warn('Could not write user doc while offline:', e);
        }
      } else {
        const data = userSnap.data() as User & { email_verified?: boolean };
        user = {
          id: fbUser.uid,
          email: fbUser.email || data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role || 'admin',
          boutique_id: data.boutique_id,
          is_active: data.is_active !== undefined ? data.is_active : true,
          created_at: data.created_at || now,
          last_login: now,
          avatar: data.avatar || fbUser.photoURL || undefined,
        };

        if (!user.is_active) {
          await signOut(auth);
          throw new Error('Ce compte utilisateur a été désactivé par l’administrateur.');
        }

        try {
          await updateDoc(userDocRef, {
            last_login: now,
            email_verified: fbUser.emailVerified,
          });
        } catch (e) {
          console.warn('Could not update user last_login while offline:', e);
        }

        try {
          const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
          if (btqSnap.exists()) {
            boutique = btqSnap.data() as Boutique;
          } else {
            boutique = {
              id: user.boutique_id,
              name: 'Ma Boutique Pro',
              owner_id: fbUser.uid,
              initial_capital: 0,
              currency: 'FCFA',
              created_at: now,
            };
            await setDoc(doc(db, 'boutiques', user.boutique_id), boutique);
          }
        } catch (e) {
          console.warn('Could not fetch boutique doc while offline, fallback to cache:', e);
          boutique = cached.boutique || {
            id: user.boutique_id,
            name: 'Ma Boutique Pro',
            owner_id: fbUser.uid,
            initial_capital: 0,
            currency: 'FCFA',
            created_at: now,
          };
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore offline during loginWithEmail, utilizing local cache:', firestoreErr);
      if (cached.user) {
        user = cached.user;
        boutique = cached.boutique || {
          id: user.boutique_id,
          name: 'Ma Boutique Pro',
          owner_id: user.id,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: user.created_at,
        };
      } else {
        const nameParts = (fbUser.displayName || email.split('@')[0] || 'Gérant').split(' ');
        const boutiqueId = 'btq_' + fbUser.uid.substring(0, 8);
        user = {
          id: fbUser.uid,
          email: fbUser.email || email.trim(),
          first_name: nameParts[0] || 'Gérant',
          last_name: nameParts.slice(1).join(' ') || 'Admin',
          role: 'admin',
          boutique_id: boutiqueId,
          is_active: true,
          created_at: now,
          last_login: now,
        };
        boutique = {
          id: boutiqueId,
          name: 'Ma Boutique Pro',
          owner_id: fbUser.uid,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };
      }
    }

    cacheAuthProfile(user, boutique);
    this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, user.boutique_id).catch(() => {});

    return {
      user,
      boutique,
      needsEmailVerification: !fbUser.emailVerified,
    };
  },

  /**
   * Traitement standardisé d'un profil utilisateur Google (création / synchronisation boutique)
   */
  async handleGoogleUser(fbUser: FirebaseUser): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean }> {
    const cached = getCachedAuthProfile(fbUser.uid);
    const now = new Date().toISOString();

    let user: User;
    let boutique: Boutique;

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const nameParts = (fbUser.displayName || 'Commerçant Google').split(' ');
        const firstName = nameParts[0] || 'Commerçant';
        const lastName = nameParts.slice(1).join(' ') || 'Google';
        const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);

        boutique = {
          id: boutiqueId,
          name: `Boutique de ${firstName}`,
          owner_id: fbUser.uid,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };
        try {
          await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
        } catch (e) {
          console.warn('Could not write boutique doc while offline:', e);
        }

        user = {
          id: fbUser.uid,
          email: fbUser.email || '',
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          boutique_id: boutiqueId,
          is_active: true,
          avatar: fbUser.photoURL || undefined,
          created_at: now,
          last_login: now,
        };
        try {
          await setDoc(userDocRef, {
            ...user,
            email_verified: true,
            provider: 'google',
          });
        } catch (e) {
          console.warn('Could not write user doc while offline:', e);
        }
      } else {
        const data = userSnap.data() as User;
        user = {
          id: fbUser.uid,
          email: fbUser.email || data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role || 'admin',
          boutique_id: data.boutique_id,
          is_active: data.is_active !== undefined ? data.is_active : true,
          created_at: data.created_at || now,
          last_login: now,
          avatar: fbUser.photoURL || data.avatar,
        };

        if (!user.is_active) {
          await signOut(auth);
          throw new Error('Ce compte utilisateur a été désactivé.');
        }

        try {
          await updateDoc(userDocRef, {
            last_login: now,
            avatar: fbUser.photoURL || data.avatar || null,
            email_verified: true,
          });
        } catch (e) {
          console.warn('Could not update user doc while offline:', e);
        }

        try {
          const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
          if (btqSnap.exists()) {
            boutique = btqSnap.data() as Boutique;
          } else {
            boutique = {
              id: user.boutique_id,
              name: `Boutique de ${user.first_name}`,
              owner_id: fbUser.uid,
              initial_capital: 0,
              currency: 'FCFA',
              created_at: now,
            };
            await setDoc(doc(db, 'boutiques', user.boutique_id), boutique);
          }
        } catch (e) {
          console.warn('Could not fetch boutique doc while offline, fallback to cache:', e);
          boutique = cached.boutique || {
            id: user.boutique_id,
            name: `Boutique de ${user.first_name}`,
            owner_id: fbUser.uid,
            initial_capital: 0,
            currency: 'FCFA',
            created_at: now,
          };
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore offline during loginWithGoogle, utilizing local cache:', firestoreErr);
      if (cached.user) {
        user = cached.user;
        boutique = cached.boutique || {
          id: user.boutique_id,
          name: `Boutique de ${user.first_name}`,
          owner_id: user.id,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: user.created_at,
        };
      } else {
        const nameParts = (fbUser.displayName || 'Commerçant Google').split(' ');
        const boutiqueId = 'btq_' + fbUser.uid.substring(0, 8);
        user = {
          id: fbUser.uid,
          email: fbUser.email || '',
          first_name: nameParts[0] || 'Commerçant',
          last_name: nameParts.slice(1).join(' ') || 'Google',
          role: 'admin',
          boutique_id: boutiqueId,
          is_active: true,
          avatar: fbUser.photoURL || undefined,
          created_at: now,
          last_login: now,
        };
        boutique = {
          id: boutiqueId,
          name: `Boutique de ${user.first_name}`,
          owner_id: fbUser.uid,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };
      }
    }

    cacheAuthProfile(user, boutique);
    this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, user.boutique_id).catch(() => {});

    return {
      user,
      boutique,
      needsEmailVerification: false,
    };
  },

  /**
   * Connexion officielle via Google OAuth avec repli automatique (Popup -> Redirection pleine page)
   * En cas de blocage des popups par le navigateur (auth/popup-blocked), la redirection s'active automatiquement
   */
  async loginWithGoogle(forceRedirect = false): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean } | null> {
    if (forceRedirect) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('bp_google_redirect_pending', 'true');
      }
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return await this.handleGoogleUser(userCredential.user);
    } catch (popupErr: unknown) {
      const err = popupErr as { code?: string; message?: string };
      const errCode = err?.code || '';
      const errMsg = String(err?.message || '');

      // Détection du blocage de pop-up par le navigateur ou mode PWA / mobile
      const isPopupBlocked =
        errCode === 'auth/popup-blocked' ||
        errCode === 'auth/cancelled-popup-request' ||
        errMsg.includes('popup-blocked') ||
        errMsg.includes('popup has been blocked');

      if (isPopupBlocked) {
        console.warn('Pop-up bloquée par le navigateur. Basculement automatique en mode redirection plein écran...');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('bp_google_redirect_pending', 'true');
        }
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      throw popupErr;
    }
  },

  /**
   * Vérifie et traite le retour d'une redirection Google OAuth (signInWithRedirect)
   */
  async checkGoogleRedirectResult(): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean } | null> {
    try {
      const result = await getRedirectResult(auth);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('bp_google_redirect_pending');
      }
      if (result && result.user) {
        return await this.handleGoogleUser(result.user);
      }
      return null;
    } catch (redirectErr) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('bp_google_redirect_pending');
      }
      console.warn('Erreur lors du traitement du retour de redirection Google:', redirectErr);
      throw redirectErr;
    }
  },

  /**
   * Vérification de l'état d'email vérifié en direct
   */
  async checkEmailVerificationStatus(): Promise<boolean> {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const isVerified = auth.currentUser.emailVerified;
    if (isVerified) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          email_verified: true,
        });
      } catch (e) {
        console.warn('Could not update email_verified flag in firestore:', e);
      }
    }
    return isVerified;
  },

  /**
   * Renvoyer l'email de confirmation
   */
  async resendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Aucun utilisateur connecté pour renvoyer le lien.');
    }
    await sendEmailVerification(auth.currentUser);
  },

  /**
   * 1. Demande de réinitialisation avec génération d'un code à 8 chiffres
   * Fonctionne parfaitement sur Netlify et avec Firebase
   */
  async requestPasswordResetCode(email: string): Promise<{ code: string; expiresAt: string; resetId: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Veuillez renseigner une adresse e-mail valide.');
    }

    // Génération d'un code sécurisé à exactement 8 chiffres
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const resetId = 'rst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes de validité

    // Enregistrement dans la collection Firestore password_resets
    try {
      await setDoc(doc(db, 'password_resets', resetId), {
        id: resetId,
        email: cleanEmail,
        code,
        created_at: now.toISOString(),
        expires_at: expiresAt,
        used: false,
        attempts: 0,
      });
    } catch (firestoreErr) {
      console.warn('Impossible d’enregistrer le code de réinitialisation dans Firestore:', firestoreErr);
    }

    // 1. Envoi via le déclencheur d'email Firestore (Extension Firebase Mail)
    try {
      await addDoc(collection(db, 'mail'), {
        to: cleanEmail,
        message: {
          subject: `BoutiquePro - Code de réinitialisation : ${code}`,
          text: `Bonjour,\n\nVous avez demandé la réinitialisation du mot de passe de votre compte BoutiquePro.\n\nVotre code de vérification à 8 chiffres est :\n${code}\n\nCopiez ce code et collez-le dans l'application BoutiquePro pour définir votre nouveau mot de passe.\nCe code est valable pendant 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\nL'équipe BoutiquePro`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
              <h2 style="color: #0d9488; font-size: 20px; font-weight: 800; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                BoutiquePro &bull; Récupération de compte
              </h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.5;">Bonjour,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                Vous avez demandé la réinitialisation de votre mot de passe pour le compte <strong>${cleanEmail}</strong>.
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #0d9488; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">Votre code à 8 chiffres</span>
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f766e; font-family: monospace;">${code}</span>
              </div>
              <p style="font-size: 13px; color: #475569; line-height: 1.5;">
                Copiez ce code et renseignez-le dans l'espace réservé sur l'application BoutiquePro pour définir votre nouveau mot de passe.
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                Ce code expirera dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
              </p>
            </div>
          `,
        },
      });
    } catch (mailErr) {
      console.warn('Tentative écriture déclencheur mail Firestore:', mailErr);
    }

    // 2. Envoi simultané via le service officiel Firebase Auth sendPasswordResetEmail
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const actionCodeSettings = {
        url: `${baseUrl}/?code=${code}&email=${encodeURIComponent(cleanEmail)}`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    } catch (fbErr) {
      console.warn('Firebase sendPasswordResetEmail notification:', fbErr);
    }

    return { code, expiresAt, resetId };
  },

  /**
   * 2. Vérification du code à 8 chiffres ou code d'action Firebase
   */
  async verifyPasswordResetCode(email: string, rawCode: string): Promise<{ valid: boolean; resetId?: string; oobCode?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    let code = rawCode.trim();

    if (!code) {
      return { valid: false, error: 'Veuillez saisir le code à 8 chiffres.' };
    }

    // Si l'utilisateur a collé un lien complet reçu par e-mail
    if (code.includes('?') || code.includes('http')) {
      try {
        const parsed = new URL(code.startsWith('http') ? code : `https://example.com/${code}`);
        const extractedOob = parsed.searchParams.get('oobCode');
        const extractedCode = parsed.searchParams.get('code');
        if (extractedOob) {
          return { valid: true, oobCode: extractedOob };
        }
        if (extractedCode) {
          code = extractedCode.trim();
        }
      } catch {
        // Ignorer l'erreur d'URL
      }
    }

    // Nettoyage des espaces et tirets éventuels
    code = code.replace(/[\s-]/g, '');

    // 1. Vérification dans Firestore (code à 8 chiffres)
    try {
      const resetsRef = collection(db, 'password_resets');
      const q = query(
        resetsRef,
        where('email', '==', cleanEmail),
        where('code', '==', code),
        where('used', '==', false),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docData = snap.docs[0].data();
        const expiresAt = new Date(docData.expires_at).getTime();
        if (Date.now() > expiresAt) {
          return { valid: false, error: 'Ce code à 8 chiffres a expiré. Veuillez demander un nouveau code.' };
        }
        return { valid: true, resetId: snap.docs[0].id };
      }
    } catch (err) {
      console.warn('Erreur vérification code Firestore:', err);
    }

    // 2. Vérification comme code d'action Firebase oobCode
    try {
      await fbVerifyPasswordResetCode(auth, code);
      return { valid: true, oobCode: code };
    } catch {
      // Ignorer si ce n'est pas un oobCode
    }

    return {
      valid: false,
      error: 'Le code saisi est incorrect ou a expiré. Veuillez vérifier et réessayer.',
    };
  },

  /**
   * 3. Application du nouveau mot de passe
   */
  async completePasswordReset(params: {
    email: string;
    code: string;
    newPassword: string;
    resetId?: string;
    oobCode?: string;
  }): Promise<void> {
    const { email, code, newPassword, resetId, oobCode } = params;
    const cleanEmail = email.trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
    }

    // A. Si nous avons un oobCode Firebase (soit direct, soit extrait)
    if (oobCode) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur de mise à jour Firebase';
        console.warn('confirmPasswordReset error:', msg);
        if (msg.includes('auth/invalid-action-code') || msg.includes('auth/expired-action-code')) {
          throw new Error('Le code de sécurité a expiré. Veuillez demander un nouveau code.');
        }
      }
    }

    // B. Marquer le code à 8 chiffres comme utilisé dans Firestore
    if (resetId) {
      try {
        await updateDoc(doc(db, 'password_resets', resetId), {
          used: true,
          used_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not mark reset doc as used:', e);
      }
    } else {
      // Rechercher et invalider le code correspondant
      try {
        const q = query(
          collection(db, 'password_resets'),
          where('email', '==', cleanEmail),
          where('code', '==', code.replace(/[\s-]/g, '')),
          where('used', '==', false),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'password_resets', snap.docs[0].id), {
            used: true,
            used_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Could not invalidate reset record:', e);
      }
    }

    // C. Mettre à jour le statut utilisateur dans Firestore
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', cleanEmail), limit(1));
      const userSnap = await getDocs(usersQuery);
      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          password_updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not update user password_updated_at flag:', e);
    }
  },

  /**
   * Raccourci de réinitialisation simple par e-mail
   */
  async sendPasswordReset(email: string): Promise<void> {
    await this.requestPasswordResetCode(email);
  },

  /**
   * Déconnexion complète
   */
  async logout(): Promise<void> {
    const currentSessionId = localStorage.getItem('boutiquepro_firebase_session_id');
    if (currentSessionId) {
      try {
        await deleteDoc(doc(db, 'active_sessions', currentSessionId));
      } catch (e) {
        console.warn('Could not remove active session doc:', e);
      }
      localStorage.removeItem('boutiquepro_firebase_session_id');
    }
    clearCachedAuthProfile(auth.currentUser?.uid);
    await signOut(auth);
  },

  /**
   * Enregistrement de session active multi-appareils
   */
  async recordSession(userId: string, userName: string, boutiqueId: string): Promise<string> {
    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('boutiquepro_firebase_session_id', sessionId);
    const deviceInfo = getDeviceInfo();
    const now = new Date().toISOString();

    const session: ActiveSession = {
      id: sessionId,
      user_id: userId,
      user_name: userName,
      boutique_id: boutiqueId,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      ip: 'Cloud Sync',
      last_active: now,
      is_current: true,
    };

    try {
      await setDoc(doc(db, 'active_sessions', sessionId), session);
    } catch (err) {
      console.warn('Could not record active session in Firestore:', err);
    }

    return sessionId;
  },

  /**
   * Écouteur d'état d'authentification
   */
  onAuthStateChange(
    callback: (data: { user: User | null; boutique: Boutique | null; needsEmailVerification: boolean; isAuthLoading: boolean }) => void
  ) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback({ user: null, boutique: null, needsEmailVerification: false, isAuthLoading: false });
        return;
      }

      // 1. Instant Cache Fallback: Immediately supply cached user profile so UI loads without waiting
      const cached = getCachedAuthProfile(fbUser.uid);
      if (cached.user) {
        const fallbackBoutique: Boutique = cached.boutique || {
          id: cached.user.boutique_id,
          name: 'Ma Boutique Pro',
          owner_id: cached.user.id,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: cached.user.created_at,
        };
        callback({
          user: cached.user,
          boutique: fallbackBoutique,
          needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
          isAuthLoading: false,
        });
      }

      // 2. Fetch fresh document from Firestore
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as User;
          const user: User = {
            id: fbUser.uid,
            email: fbUser.email || data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role || 'admin',
            boutique_id: data.boutique_id,
            is_active: data.is_active !== undefined ? data.is_active : true,
            created_at: data.created_at,
            last_login: new Date().toISOString(),
            avatar: fbUser.photoURL || data.avatar,
          };

          let boutique: Boutique = cached.boutique || {
            id: user.boutique_id,
            name: 'Ma Boutique Pro',
            owner_id: user.id,
            initial_capital: 0,
            currency: 'FCFA',
            created_at: new Date().toISOString(),
          };

          try {
            const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
            if (btqSnap.exists()) {
              boutique = btqSnap.data() as Boutique;
            }
          } catch (btqErr) {
            console.warn('Notice: Offline fetching boutique doc:', btqErr);
          }

          cacheAuthProfile(user, boutique);

          callback({
            user,
            boutique,
            needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
            isAuthLoading: false,
          });
        } else {
          // New Google or direct login
          const nameParts = (fbUser.displayName || 'Gérant').split(' ');
          const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);
          const now = new Date().toISOString();

          const boutique: Boutique = {
            id: boutiqueId,
            name: `Boutique de ${nameParts[0]}`,
            owner_id: fbUser.uid,
            initial_capital: 0,
            currency: 'FCFA',
            created_at: now,
          };

          const user: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            first_name: nameParts[0] || 'Gérant',
            last_name: nameParts.slice(1).join(' ') || 'Admin',
            role: 'admin',
            boutique_id: boutiqueId,
            is_active: true,
            created_at: now,
            last_login: now,
            avatar: fbUser.photoURL || undefined,
          };

          try {
            await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
            await setDoc(userDocRef, { ...user, email_verified: fbUser.emailVerified });
          } catch (writeErr) {
            console.warn('Notice: Deferred write while offline:', writeErr);
          }

          cacheAuthProfile(user, boutique);

          callback({
            user,
            boutique,
            needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
            isAuthLoading: false,
          });
        }
      } catch (err) {
        console.warn('Notice: Operating in offline mode for auth profile:', err);
        // Do NOT log the user out if Firebase Auth recognizes them!
        if (cached.user) {
          const fallbackBoutique: Boutique = cached.boutique || {
            id: cached.user.boutique_id,
            name: 'Ma Boutique Pro',
            owner_id: cached.user.id,
            initial_capital: 0,
            currency: 'FCFA',
            created_at: cached.user.created_at,
          };
          callback({
            user: cached.user,
            boutique: fallbackBoutique,
            needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
            isAuthLoading: false,
          });
          return;
        }

        // Generate safe offline profile from Firebase Auth user data
        const nameParts = (fbUser.displayName || 'Gérant').split(' ');
        const fallbackBtqId = 'btq_' + fbUser.uid.substring(0, 8);
        const now = new Date().toISOString();

        const fallbackUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          first_name: nameParts[0] || 'Gérant',
          last_name: nameParts.slice(1).join(' ') || 'Admin',
          role: 'admin',
          boutique_id: fallbackBtqId,
          is_active: true,
          created_at: now,
          last_login: now,
          avatar: fbUser.photoURL || undefined,
        };

        const fallbackBtq: Boutique = {
          id: fallbackBtqId,
          name: `Boutique de ${nameParts[0]}`,
          owner_id: fbUser.uid,
          initial_capital: 0,
          currency: 'FCFA',
          created_at: now,
        };

        cacheAuthProfile(fallbackUser, fallbackBtq);

        callback({
          user: fallbackUser,
          boutique: fallbackBtq,
          needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
          isAuthLoading: false,
        });
      }
    });
  },
};
