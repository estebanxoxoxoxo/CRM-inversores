/**
 * Firestore connection for the scripts: loads .env, checks the web config and reuses the server initialiser
 * (server/firestore.ts). The project's rules must allow the web SDK to read and write `investors/*` and `backups/**`.
 */
import "dotenv/config";
import type { Firestore } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "../../server/firestore";

export function connect(): Firestore {
  if (!isFirebaseConfigured()) {
    console.error("Missing VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_APP_ID in .env (see .env.example)");
    process.exit(1);
  }
  console.log(`Firestore project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  return getDb();
}

export function explainError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/storage\/unauthorized|storage\/unauthenticated/i.test(message)) {
    return `${message}
Storage rules do not allow this operation from the web SDK. Check Storage > Rules for backups/**.`;
  }
  if (/permission|PERMISSION_DENIED|insufficient/i.test(message)) {
    return `${message}
Firestore rules do not allow this operation from the web SDK. Check Firestore > Rules for investors/*.`;
  }
  return message;
}
