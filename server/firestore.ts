/** Firestore connection for the Vercel functions (web SDK, same VITE_FIREBASE_* variables as the app). */
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_APP_ID);
}

export function getDb(): Firestore {
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    });
  return getFirestore(app);
}
