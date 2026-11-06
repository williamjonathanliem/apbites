// Firestore with full rights, for server code only (skips the security rules).
// Env (server only, never VITE_):
//   FIRESTORE_EMULATOR_HOST    set in dev -> talks to the emulator, no credentials
//   FIREBASE_PROJECT_ID        defaults to demo-apbites
//   FIREBASE_SERVICE_ACCOUNT   the service account JSON on one line (production)

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db = null;

export function adminDb() {
  if (db) return db;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-apbites';
  let app = getApps()[0];
  if (!app) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      app = initializeApp({ projectId });
    } else {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
      app = initializeApp({ credential: cert(JSON.parse(raw)), projectId });
    }
  }
  db = getFirestore(app);
  return db;
}
