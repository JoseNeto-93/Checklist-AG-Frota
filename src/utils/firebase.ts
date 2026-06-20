import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let db: ReturnType<typeof getFirestore> | null = null;

/**
 * Try to initialize Firebase using (in order):
 * 1) explicit config passed as argument
 * 2) Vite build-time env `import.meta.env.VITE_*`
 * 3) runtime config saved in localStorage under `fleet_firebase_config`
 */
export function initFirebaseRuntime(config?: Record<string, string> | null) {
  if (db) return db;

  // Prefer explicit config passed programmatically
  let finalCfg: Record<string, string> | null = config || null;

  // Then check build-time env
  if (!finalCfg && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    finalCfg = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // Fallback: config persisted in localStorage (allows runtime setup without rebuild)
  if (!finalCfg) {
    try {
      const raw = localStorage.getItem('fleet_firebase_config');
      if (raw) finalCfg = JSON.parse(raw);
    } catch (e) {
      // ignore
    }
  }

  if (!finalCfg) {
    console.warn('[firebase] No firebase config available at runtime. Firestore not initialized.');
    return null;
  }

  try {
    if (!getApps().length) initializeApp(finalCfg as any);
    db = getFirestore();
    console.log('[firebase] initialized Firestore at runtime');
    return db;
  } catch (e) {
    db = null;
    console.error('[firebase] getFirestore() failed:', e);
    return null;
  }
}

export function saveFirebaseConfigToLocalStorage(cfg: Record<string, string>) {
  try {
    localStorage.setItem('fleet_firebase_config', JSON.stringify(cfg));
    initFirebaseRuntime(cfg);
  } catch (e) {
    console.error('[firebase] failed to save runtime config:', e);
  }
}

export { db };
