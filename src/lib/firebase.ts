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
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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

// Firestore Database with Memory Local Cache & Long Polling
// memoryLocalCache completely avoids QuotaExceededError in sandboxed iframe environments
// experimentalForceLongPolling prevents 10s WebChannel timeout in sandboxed iframes & proxies
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
      experimentalForceLongPolling: true,
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

export { firebaseConfig };

