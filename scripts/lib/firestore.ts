/**
 * Conexión a Firestore para los scripts (SDK web con la config de .env). Las reglas del proyecto deben permitir
 * leer y escribir `inversores/*` y `meta/*` desde el SDK web.
 */
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export function conectar(): Firestore {
  const requeridas = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"] as const;
  const faltan = requeridas.filter((k) => !process.env[k]);
  if (faltan.length) {
    console.error(`Faltan variables en .env: ${faltan.join(", ")} (ver .env.example)`);
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
  console.log(`Firestore: proyecto ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  return getFirestore(app);
}

export function explicarError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/permission|PERMISSION_DENIED|insufficient/i.test(msg)) {
    return `${msg}\nLas reglas de Firestore no permiten esta operación con el SDK web. Revisá Firestore > Reglas (inversores/* y meta/*).`;
  }
  return msg;
}
