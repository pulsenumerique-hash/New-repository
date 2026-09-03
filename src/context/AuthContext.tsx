import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Boutique } from '../types';
import { firebaseAuthService } from '../services/firebaseAuth';
import { realtimeClient } from '../services/realtime';

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
  googleLogin: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real Firebase Auth State changes
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange(
      ({ user: authUser, boutique: authBtq, needsEmailVerification: unverified, isAuthLoading }) => {
        setUser(authUser);
        setBoutique(authBtq);
        setNeedsEmailVerification(unverified);
        setIsLoading(isAuthLoading);
        if (authUser) {
          realtimeClient.connect();
        } else {
          realtimeClient.disconnect();
        }
      }
    );

    return () => unsubscribe();
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
      const res = await firebaseAuthService.registerWithEmail({
        firstName: payload.first_name,
        lastName: payload.last_name,
        boutiqueName: payload.boutique_name,
        email: payload.email,
        password: payload.password,
      });
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

  const googleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await firebaseAuthService.loginWithGoogle();
      setUser(res.user);
      setBoutique(res.boutique);
      setNeedsEmailVerification(false);
      realtimeClient.connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la connexion Google';
      if (msg.includes('auth/popup-closed-by-user')) {
        setError('Fenêtre de connexion Google fermée.');
      } else {
        setError(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
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

  const logout = () => {
    firebaseAuthService.logout();
    setUser(null);
    setBoutique(null);
    setNeedsEmailVerification(false);
    realtimeClient.disconnect();
  };

  const clearError = () => setError(null);

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
        logout,
        refreshProfile,
        clearError,
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
