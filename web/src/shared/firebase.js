import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const env = import.meta.env;

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-apbites.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-apbites',
  appId: env.VITE_FIREBASE_APP_ID || 'demo-app',
});

// Read-only from the browser. Writes go through /api (server).
export const db = getFirestore(app);

// Dev uses the emulator unless VITE_USE_EMULATORS=false. The host is the page's
// own host, so a phone on the same Wi-Fi reaches the emulator on this PC.
export const usingEmulators =
  env.VITE_USE_EMULATORS === 'true' || (env.DEV && env.VITE_USE_EMULATORS !== 'false');

if (usingEmulators) {
  connectFirestoreEmulator(db, window.location.hostname, 8080);
}
