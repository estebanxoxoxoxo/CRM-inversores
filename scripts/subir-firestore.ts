/**
 * Sube data/perfiles/*.json a Firestore tal cual: un documento por inversor en `inversores/{id}`, el resumen en
 * `meta/indice` y el criterio de la rúbrica en `meta/criterio`. Antes de subir valida y recalcula cada perfil.
 *
 * Uso: npm run subir
 * Credenciales: (1) service account *firebase-adminsdk*.json o *serviceAccount*.json en la raíz (ignorada por git);
 * (2) si no, el SDK web con .env (VITE_FIREBASE_*), que requiere reglas de Firestore que permitan escribir.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { CRITERIO, IndiceSchema, resumenDe, type Inversor } from "../src/types/inversor";
import { ordenar, recalcularPerfil } from "./recalcular";

const raiz = path.resolve(import.meta.dirname, "..");
const carpeta = path.join(raiz, "data", "perfiles");
const perfiles: Inversor[] = ordenar(
  fs
    .readdirSync(carpeta)
    .filter((f) => f.endsWith(".json"))
    .map((f) => recalcularPerfil(JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8")))),
);
const ahora = new Date().toISOString();
const indice = IndiceSchema.parse({ generado: ahora.slice(0, 10), total: perfiles.length, perfiles: perfiles.map(resumenDe) });
const criterio = { texto: CRITERIO, actualizado: ahora };

const serviceAccount = fs.readdirSync(raiz).find((f) => /(firebase-adminsdk|serviceAccount).*\.json$/i.test(f));

async function subirConAdmin(archivo: string) {
  const admin = await import("firebase-admin");
  const cred = JSON.parse(fs.readFileSync(path.join(raiz, archivo), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(cred), projectId: cred.project_id });
  const db = admin.firestore();
  console.log(`Credencial: service account ${archivo} (proyecto ${cred.project_id})`);
  for (let i = 0; i < perfiles.length; i += 400) {
    const batch = db.batch();
    for (const p of perfiles.slice(i, i + 400)) batch.set(db.collection("inversores").doc(p.id), { ...p, actualizado: ahora });
    await batch.commit();
    console.log(`Subidos ${Math.min(i + 400, perfiles.length)}/${perfiles.length} perfiles a inversores/`);
  }
  await db.collection("meta").doc("indice").set(indice);
  await db.collection("meta").doc("criterio").set(criterio);
}

async function subirConWeb() {
  const requeridas = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"] as const;
  const faltan = requeridas.filter((k) => !process.env[k]);
  if (faltan.length) throw new Error(`Faltan variables en .env: ${faltan.join(", ")}`);
  const { initializeApp } = await import("firebase/app");
  const { doc, getFirestore, writeBatch } = await import("firebase/firestore");
  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);
  console.log(`Credencial: SDK web (proyecto ${process.env.VITE_FIREBASE_PROJECT_ID}); depende de las reglas de Firestore`);
  for (let i = 0; i < perfiles.length; i += 400) {
    const batch = writeBatch(db);
    for (const p of perfiles.slice(i, i + 400)) batch.set(doc(db, "inversores", p.id), { ...p, actualizado: ahora });
    await batch.commit();
    console.log(`Subidos ${Math.min(i + 400, perfiles.length)}/${perfiles.length} perfiles a inversores/`);
  }
  const b = writeBatch(db);
  b.set(doc(db, "meta", "indice"), indice);
  b.set(doc(db, "meta", "criterio"), criterio);
  await b.commit();
}

(serviceAccount ? subirConAdmin(serviceAccount) : subirConWeb())
  .then(() => {
    console.log(`Subidos meta/indice (${indice.total} entradas) y meta/criterio. Listo.`);
    process.exit(0);
  })
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ERROR al subir:", msg);
    if (/permission|PERMISSION_DENIED|insufficient/i.test(msg)) {
      console.error(
        "\nLas reglas de Firestore no permiten escribir con el SDK web sin autenticación. Opciones:\n" +
          " (a) service account en la raíz del proyecto (Firebase Console > Configuración > Cuentas de servicio > Generar clave);\n" +
          " (b) permitir la escritura en Firestore > Reglas.",
      );
    }
    process.exit(1);
  });
