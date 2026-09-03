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
      initial_capital: 100000,
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
    await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...user,
      email_verified: fbUser.emailVerified,
      updated_at: now,
    });

    // Record session
    await this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, boutiqueId);

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

    // Check user doc in Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    let userSnap = await getDoc(userDocRef);

    let user: User;
    let boutique: Boutique;
    const now = new Date().toISOString();

    if (!userSnap.exists()) {
      // Auto-reconstruct user doc if missing
      const nameParts = (fbUser.displayName || 'Gérant Boutique').split(' ');
      const firstName = nameParts[0] || 'Gérant';
      const lastName = nameParts.slice(1).join(' ') || 'Admin';
      const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);

      boutique = {
        id: boutiqueId,
        name: 'Ma Boutique Pro',
        owner_id: fbUser.uid,
        initial_capital: 100000,
        currency: 'FCFA',
        created_at: now,
      };
      await setDoc(doc(db, 'boutiques', boutiqueId), boutique);

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
      await setDoc(userDocRef, { ...user, email_verified: fbUser.emailVerified });
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

      await updateDoc(userDocRef, {
        last_login: now,
        email_verified: fbUser.emailVerified,
      });

      const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
      if (btqSnap.exists()) {
        boutique = btqSnap.data() as Boutique;
      } else {
        boutique = {
          id: user.boutique_id,
          name: 'Ma Boutique Pro',
          owner_id: fbUser.uid,
          initial_capital: 100000,
          currency: 'FCFA',
          created_at: now,
        };
        await setDoc(doc(db, 'boutiques', user.boutique_id), boutique);
      }
    }

    await this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, user.boutique_id);

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

    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);
    const now = new Date().toISOString();

    let user: User;
    let boutique: Boutique;

    if (!userSnap.exists()) {
      const nameParts = (fbUser.displayName || 'Commerçant Google').split(' ');
      const firstName = nameParts[0] || 'Commerçant';
      const lastName = nameParts.slice(1).join(' ') || 'Google';
      const boutiqueId = 'btq_' + Math.random().toString(36).substring(2, 9);

      boutique = {
        id: boutiqueId,
        name: `Boutique de ${firstName}`,
        owner_id: fbUser.uid,
        initial_capital: 150000,
        currency: 'FCFA',
        created_at: now,
      };
      await setDoc(doc(db, 'boutiques', boutiqueId), boutique);

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
      await setDoc(userDocRef, {
        ...user,
        email_verified: true,
        provider: 'google',
      });
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

      await updateDoc(userDocRef, {
        last_login: now,
        avatar: fbUser.photoURL || data.avatar || null,
        email_verified: true,
      });

      const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
      if (btqSnap.exists()) {
        boutique = btqSnap.data() as Boutique;
      } else {
        boutique = {
          id: user.boutique_id,
          name: `Boutique de ${user.first_name}`,
          owner_id: fbUser.uid,
          initial_capital: 150000,
          currency: 'FCFA',
          created_at: now,
        };
        await setDoc(doc(db, 'boutiques', user.boutique_id), boutique);
      }
    }

    await this.recordSession(fbUser.uid, `${user.first_name} ${user.last_name}`, user.boutique_id);

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

          const btqSnap = await getDoc(doc(db, 'boutiques', user.boutique_id));
          const boutique = btqSnap.exists()
            ? (btqSnap.data() as Boutique)
            : {
                id: user.boutique_id,
                name: 'Ma Boutique Pro',
                owner_id: user.id,
                initial_capital: 100000,
                currency: 'FCFA',
                created_at: new Date().toISOString(),
              };

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
            initial_capital: 100000,
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

          await setDoc(doc(db, 'boutiques', boutiqueId), boutique);
          await setDoc(userDocRef, { ...user, email_verified: fbUser.emailVerified });

          callback({
            user,
            boutique,
            needsEmailVerification: !fbUser.emailVerified && !fbUser.providerData.some((p) => p.providerId === 'google.com'),
            isAuthLoading: false,
          });
        }
      } catch (err) {
        console.error('Error fetching auth user profile from Firestore:', err);
        callback({ user: null, boutique: null, needsEmailVerification: false, isAuthLoading: false });
      }
    });
  },
};
