import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let db: ReturnType<typeof getFirestore> | null = null;

// Require Vite env vars prefixed with VITE_
const required = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY;

if (required) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  try {
    db = getFirestore();
  } catch (e) {
    db = null;
    // silent fallback
  }
}

export { db };
