/**
 * Sube data/perfiles/*.json a Firestore: un documento por inversor en la colección `inversores` (id = slug)
 * y un documento resumen `meta/indice` para listados y filtros.
 *
 * Uso: npx tsx scripts/subir-firestore.ts
 * Requiere .env con VITE_FIREBASE_* (config web). Usa el SDK web; las reglas de Firestore deben permitir la escritura
 * (o habilitá acceso anónimo). Si las reglas lo bloquean, el script lo indica.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { doc, getFirestore, writeBatch } from "firebase/firestore";
import { IndiceSchema, InversorSchema, resumenDe, type Inversor } from "../src/types/inversor";

const requeridas = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"] as const;
const faltan = requeridas.filter((k) => !process.env[k]);
if (faltan.length) {
  console.error("Faltan variables en .env:", faltan.join(", "));
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
const db = getFirestore(app);

const raiz = path.resolve(import.meta.dirname, "..");
const carpeta = path.join(raiz, "data", "perfiles");
const perfiles: Inversor[] = fs
  .readdirSync(carpeta)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => InversorSchema.parse(JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8"))));

const indice = IndiceSchema.parse({ generado: new Date().toISOString().slice(0, 10), total: perfiles.length, perfiles: perfiles.map(resumenDe) });

async function main() {
  // Firestore admite hasta 500 operaciones por batch; 84 perfiles + 1 índice entran en uno, pero se trocea por seguridad.
  const TAM = 400;
  for (let i = 0; i < perfiles.length; i += TAM) {
    const batch = writeBatch(db);
    for (const p of perfiles.slice(i, i + TAM)) batch.set(doc(db, "inversores", p.id), { ...p, actualizado: new Date().toISOString() });
    await batch.commit();
    console.log(`Subidos ${Math.min(i + TAM, perfiles.length)}/${perfiles.length} perfiles a inversores/`);
  }
  const b = writeBatch(db);
  b.set(doc(db, "meta", "indice"), indice);
  await b.commit();
  console.log(`Subido meta/indice con ${indice.total} entradas.`);
}

main()
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ERROR al subir:", msg);
    if (/permission|PERMISSION_DENIED|insufficient/i.test(msg)) {
      console.error(
        "\nLas reglas de Firestore no permiten escribir con el SDK web sin autenticación.\n" +
          "Opciones: (a) en Firebase Console > Firestore > Reglas, permitir escritura temporalmente para cargar los datos;\n" +
          "(b) habilitar Anonymous Auth y adaptar este script; (c) usar firebase-admin con una service account (archivo ignorado por git).",
      );
    }
    process.exit(1);
  });
