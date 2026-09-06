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

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || rawConfig.measurementId || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    rawConfig.firestoreDatabaseId ||
    '',
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

// Configure persistent auth session across tab refreshes and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set auth persistence:', err);
});

// Official Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();
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

