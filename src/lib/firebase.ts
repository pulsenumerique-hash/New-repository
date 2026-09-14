import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Safely resolve Firebase configuration: prioritize VITE_* environment variables (e.g. Netlify settings)
// and gracefully fall back to the bundled firebase-applet-config.json
const rawConfig = (defaultFirebaseConfig || {}) as Record<string, string>;

// If a custom project ID is provided via env var that differs from the bundled AI Studio template,
// we should only use a custom firestore database ID if explicitly specified via VITE_FIRESTORE_DATABASE_ID.
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isCustomProject = Boolean(envProjectId && rawConfig.projectId && envProjectId !== rawConfig.projectId);

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || '',
  projectId: envProjectId || rawConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    (isCustomProject ? '' : rawConfig.firestoreDatabaseId || ''),
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || rawConfig.oAuthClientId || '',
};

if (!firebaseConfig.apiKey) {
  console.warn(
    'Attention: Clé API Firebase manquante ! Veuillez configurer VITE_FIREBASE_API_KEY dans vos variables d’environnement ou vérifier firebase-applet-config.json.'
  );
}

// Silence internal Firestore SDK connection logs/retries to prevent noisy console errors
setLogLevel('silent');

// Intercept and prevent unhandled QuotaExceededError from restricted iframes or IndexedDB
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.name === 'QuotaExceededError' ||
        String(reason.message || '').includes('QuotaExceededError') ||
        String(reason.message || '').includes('createOrUpgrade'))
    ) {
      console.warn('Handled QuotaExceededError in restricted storage environment:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const err = event.error;
    const msg = event.message || '';
    if (
      (err && (err.name === 'QuotaExceededError' || String(err.message || '').includes('QuotaExceededError'))) ||
      msg.includes('QuotaExceededError') ||
      msg.includes('createOrUpgrade')
    ) {
      console.warn('Handled QuotaExceededError event in restricted storage environment:', event);
      event.preventDefault();
    }
  });
}

// Initialize or reuse Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Authentication
export const auth = getAuth(app);

// Use device language for international Google OAuth dialogs
try {
  auth.useDeviceLanguage();
} catch (langErr) {
  console.warn('Could not set device language on Firebase Auth:', langErr);
}

// Configure persistent auth session across tab refreshes and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set auth persistence:', err);
});

/**
 * Fournisseur officiel Google OAuth (GoogleAuthProvider)
 * Configuré sans aucune restriction pour autoriser TOUS les utilisateurs Google (comptes personnels @gmail.com,
 * comptes professionnels Google Workspace, etc.).
 * Aucune restriction de domaine 'hd' (hosted domain) n'est imposée.
 */
export const googleProvider = new GoogleAuthProvider();

// Scopes ouverts standards pour l'identité et le profil
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');

// Paramètres personnalisés ouverts :
// - prompt: 'select_account' permet à l'utilisateur de choisir n'importe lequel de ses comptes Google connectés
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore Database with Memory Local Cache & Auto-Detect Transport
// memoryLocalCache completely avoids QuotaExceededError in sandboxed iframe environments
// experimentalAutoDetectLongPolling allows graceful fallback without premature connection failure logs
let dbInstance: Firestore;
try {
  const dbId =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? firebaseConfig.firestoreDatabaseId
      : undefined;

  dbInstance = initializeFirestore(
    app,
    {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    },
    dbId
  );
} catch {
  // Fallback to getFirestore if already initialized
  dbInstance =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
}

export const db = dbInstance;

