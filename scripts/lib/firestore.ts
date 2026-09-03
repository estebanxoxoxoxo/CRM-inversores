/**
 * Firestore connection for the scripts (web SDK with the config from .env). The project's security rules must allow
 * reading and writing `investors/*` from the web SDK.
 */
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export function connect(): Firestore {
  const required = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing variables in .env: ${missing.join(", ")} (see .env.example)`);
    process.exit(1);
  }
  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  });
  console.log(`Firestore project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  return getFirestore(app);
}

export function explainError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/storage\/unauthorized|storage\/unauthenticated/i.test(message)) {
    return `${message}\nStorage rules do not allow this operation from the web SDK. Check Storage > Rules for backups/**.`;
  }
  if (/permission|PERMISSION_DENIED|insufficient/i.test(message)) {
    return `${message}\nFirestore rules do not allow this operation from the web SDK. Check Firestore > Rules for investors/*.`;
  }
  return message;
}
