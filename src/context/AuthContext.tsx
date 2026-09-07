import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Boutique } from '../types';
import { firebaseAuthService, getCachedAuthProfile } from '../services/firebaseAuth';
import { realtimeClient } from '../services/realtime';
import { api, setStoredToken } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';

interface AuthContextType {
  user: User | null;
  boutique: Boutique | null;
  role: 'admin' | 'cashier' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsEmailVerification: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    first_name: string;
    last_name: string;
    boutique_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  googleLogin: (forceRedirect?: boolean) => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  requestPasswordResetCode: (email: string) => Promise<{ code: string; expiresAt: string; resetId: string }>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<{ valid: boolean; resetId?: string; oobCode?: string; error?: string }>;
  completePasswordReset: (params: { email: string; code: string; newPassword: string; resetId?: string; oobCode?: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  updateBoutiqueState: (updates: Partial<Boutique>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous cached session recovery to eliminate blank loading screens
  const initialData = (() => {
    try {
      const lastUid = typeof localStorage !== 'undefined' ? localStorage.getItem('boutiquepro_last_auth_uid') : null;
      if (lastUid) {
        const cached = getCachedAuthProfile(lastUid);
        if (cached.user) {
          return {
            user: cached.user,
            boutique: cached.boutique,
          };
        }
      }
    } catch {
      // Ignore storage restrictions
    }
    return { user: null, boutique: null };
  })();

  const [user, setUser] = useState<User | null>(initialData.user);
  const [boutique, setBoutique] = useState<Boutique | null>(initialData.boutique);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  // Only start in loading state if awaiting a Google redirect return or waiting initial sync
  const isAwaitingRedirect =
    typeof window !== 'undefined' && sessionStorage.getItem('bp_google_redirect_pending') === 'true';
  const [isLoading, setIsLoading] = useState<boolean>(isAwaitingRedirect);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real Firebase Auth State changes and process redirect return
  useEffect(() => {
    // 1. Process Google signInWithRedirect credential if user is returning from Google
    firebaseAuthService
      .checkGoogleRedirectResult()
      .then((res) => {
        if (res) {
          setUser(res.user);
          setBoutique(res.boutique);
          setNeedsEmailVerification(false);
          realtimeClient.connect();
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result error:', err);
        const msg = err instanceof Error ? err.message : String(err || '');
        if (msg.includes('unauthorized-domain')) {
          setError(
            `Le domaine "${window.location.hostname}" n'est pas encore autorisé dans Firebase Auth. Veuillez l'ajouter dans la Console Firebase (Authentification > Paramètres > Domaines autorisés).`
          );
        } else {
          setError(msg);
        }
        setIsLoading(false);
      });

    // 2. Safety timeout guard: do not block the UI for more than 1.2s under any network condition
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // 3. Official Firebase Auth listener
    const unsubscribe = firebaseAuthService.onAuthStateChange(
      ({ user: authUser, boutique: authBtq, needsEmailVerification: unverified, isAuthLoading }) => {
        clearTimeout(safetyTimer);
        setUser(authUser);
        setBoutique(authBtq);
        setNeedsEmailVerification(unverified);
        setIsLoading(isAuthLoading);
        if (authUser) {
          realtimeClient.connect();
          // Synchronize server-side session token for API routes
          api.syncSession({
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.first_name,
            last_name: authUser.last_name,
            role: authUser.role,
            boutique_id: authUser.boutique_id,
          }).then((res) => {
            if (res.token) {
              setStoredToken(res.token);
            }
          }).catch((err) => {
            console.warn('Notice: Backend session sync deferred:', err);
          });
        } else {
          setStoredToken(null);
          realtimeClient.disconnect();
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const isVerified = await firebaseAuthService.checkEmailVerificationStatus();
      setNeedsEmailVerification(!isVerified);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await firebaseAuthService.loginWithEmail(email, password);
      setUser(res.user);
      setBoutique(res.boutique);
      setNeedsEmailVerification(res.needsEmailVerification);
      realtimeClient.connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de connexion';
      // User-friendly Firebase Auth error messages in French
      let cleanMsg = msg;
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        cleanMsg = 'Identifiants incorrects (adresse e-mail ou mot de passe invalide).';
      } else if (msg.includes('auth/invalid-email')) {
        cleanMsg = 'Format d’adresse e-mail invalide.';
      } else if (msg.includes('auth/too-many-requests')) {
        cleanMsg = 'Trop de tentatives infructueuses. Veuillez patienter quelques instants.';
      }
      setError(cleanMsg);
      throw new Error(cleanMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    first_name: string;
    last_name: string;
    boutique_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => {
    setIsLoading(true);
    setError(null);

    if (payload.password !== payload.password_confirm) {
      const err = 'Les deux mots de passe ne correspondent pas.';
      setError(err);
      setIsLoading(false);
      throw new Error(err);
    }

    try {
      // Purge any stale offline queue items from previous sessions to guarantee a pristine 0-balance new account
      offlineStorage.clearQueue();

      const res = await firebaseAuthService.registerWithEmail({
        firstName: payload.first_name,
        lastName: payload.last_name,
        boutiqueName: payload.boutique_name,
        email: payload.email,
        password: payload.password,
      });
      // Purge any accidental local cache for this new boutique id
      offlineStorage.clearBoutiqueData(res.boutique.id);
      setUser(res.user);
      setBoutique(res.boutique);
      setNeedsEmailVerification(res.needsEmailVerification);
      realtimeClient.connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l’inscription';
      let cleanMsg = msg;
      if (msg.includes('auth/email-already-in-use')) {
        cleanMsg = 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.';
      } else if (msg.includes('auth/weak-password')) {
        cleanMsg = 'Le mot de passe doit comporter au moins 6 caractères.';
      } else if (msg.includes('auth/invalid-email')) {
        cleanMsg = 'Format d’adresse e-mail invalide.';
      }
      setError(cleanMsg);
      throw new Error(cleanMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (forceRedirect = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await firebaseAuthService.loginWithGoogle(forceRedirect);
      if (res) {
        setUser(res.user);
        setBoutique(res.boutique);
        setNeedsEmailVerification(false);
        realtimeClient.connect();
        setIsLoading(false);
      } else {
        // Redirection plein écran déclenchée via signInWithRedirect
        // On maintient l'état de chargement pendant la navigation du navigateur vers Google
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Échec de la connexion Google';
      if (msg.includes('auth/popup-closed-by-user')) {
        setError('Fenêtre de connexion Google fermée par l’utilisateur.');
      } else if (msg.includes('auth/unauthorized-domain')) {
        setError(
          `Le domaine actuel "${window.location.hostname}" n'est pas encore autorisé dans Firebase Console (Authentification > Paramètres > Domaines autorisés). Ajoutez-le ou connectez-vous par e-mail ci-dessous.`
        );
      } else {
        setError(msg);
      }
      throw err;
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    const verified = await firebaseAuthService.checkEmailVerificationStatus();
    if (verified) {
      setNeedsEmailVerification(false);
    }
    return verified;
  };

  const resendVerificationEmail = async () => {
    await firebaseAuthService.resendVerificationEmail();
  };

  const forgotPassword = async (email: string) => {
    await firebaseAuthService.sendPasswordReset(email);
  };

  const requestPasswordResetCode = async (email: string) => {
    setError(null);
    try {
      return await firebaseAuthService.requestPasswordResetCode(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’envoi du code';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    setError(null);
    return await firebaseAuthService.verifyPasswordResetCode(email, code);
  };

  const completePasswordReset = async (params: {
    email: string;
    code: string;
    newPassword: string;
    resetId?: string;
    oobCode?: string;
  }) => {
    setError(null);
    try {
      await firebaseAuthService.completePasswordReset(params);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setStoredToken(null);
    offlineStorage.clearQueue();
    firebaseAuthService.logout();
    setUser(null);
    setBoutique(null);
    setNeedsEmailVerification(false);
    realtimeClient.disconnect();
  };

  const clearError = () => setError(null);

  const updateBoutiqueState = (updates: Partial<Boutique>) => {
    setBoutique((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        boutique,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        needsEmailVerification,
        error,
        login,
        register,
        googleLogin,
        checkEmailVerification,
        resendVerificationEmail,
        forgotPassword,
        requestPasswordResetCode,
        verifyPasswordResetCode,
        completePasswordReset,
        logout,
        refreshProfile,
        clearError,
        updateBoutiqueState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
