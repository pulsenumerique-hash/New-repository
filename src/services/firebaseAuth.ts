import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
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
   * Connexion officielle via Google OAuth Popup
   */
  async loginWithGoogle(): Promise<{ user: User; boutique: Boutique; needsEmailVerification: boolean }> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const fbUser = userCredential.user;

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
   * Réinitialisation de mot de passe par email
   */
  async sendPasswordReset(email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new Error('Veuillez saisir une adresse e-mail valide.');
    }
    await sendPasswordResetEmail(auth, email.trim());
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
