/**
 * Sube data/perfiles/*.json a Firestore: un documento por inversor en la colección `inversores` (id = slug)
 * y un documento resumen `meta/indice` para listados y filtros.
 *
 * Uso: npm run subir   (o npx tsx scripts/subir-firestore.ts)
 *
 * Credenciales, en este orden:
 *  1. Si en la raíz del proyecto hay un archivo *firebase-adminsdk*.json o *serviceAccount*.json (ambos ignorados
 *     por git), usa firebase-admin con esa service account: no depende de las reglas de seguridad.
 *  2. Si no, usa el SDK web con la config de .env (VITE_FIREBASE_*): requiere que las reglas de Firestore
 *     permitan escribir sin autenticación.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { IndiceSchema, InversorSchema, resumenDe, type Inversor } from "../src/types/inversor";

const raiz = path.resolve(import.meta.dirname, "..");
const carpeta = path.join(raiz, "data", "perfiles");
const perfiles: Inversor[] = fs
  .readdirSync(carpeta)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => InversorSchema.parse(JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8"))));
const indice = IndiceSchema.parse({ generado: new Date().toISOString().slice(0, 10), version: 2, total: perfiles.length, perfiles: perfiles.map(resumenDe) });
const ahora = new Date().toISOString();

const serviceAccount = fs.readdirSync(raiz).find((f) => /(firebase-adminsdk|serviceAccount).*\.json$/i.test(f));

async function subirConAdmin(archivo: string) {
  const admin = await import("firebase-admin");
  const cred = JSON.parse(fs.readFileSync(path.join(raiz, archivo), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(cred), projectId: cred.project_id });
  const db = admin.firestore();
  console.log(`Credencial: service account ${archivo} (proyecto ${cred.project_id})`);
  const TAM = 400;
  for (let i = 0; i < perfiles.length; i += TAM) {
    const batch = db.batch();
    for (const p of perfiles.slice(i, i + TAM)) batch.set(db.collection("inversores").doc(p.id), { ...p, actualizado: ahora });
    await batch.commit();
    console.log(`Subidos ${Math.min(i + TAM, perfiles.length)}/${perfiles.length} perfiles a inversores/`);
  }
  await db.collection("meta").doc("indice").set(indice);
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
  const TAM = 400;
  for (let i = 0; i < perfiles.length; i += TAM) {
    const batch = writeBatch(db);
    for (const p of perfiles.slice(i, i + TAM)) batch.set(doc(db, "inversores", p.id), { ...p, actualizado: ahora });
    await batch.commit();
    console.log(`Subidos ${Math.min(i + TAM, perfiles.length)}/${perfiles.length} perfiles a inversores/`);
  }
  const b = writeBatch(db);
  b.set(doc(db, "meta", "indice"), indice);
  await b.commit();
}

(serviceAccount ? subirConAdmin(serviceAccount) : subirConWeb())
  .then(() => {
    console.log(`Subido meta/indice con ${indice.total} entradas. Listo.`);
    process.exit(0);
  })
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ERROR al subir:", msg);
    if (/permission|PERMISSION_DENIED|insufficient/i.test(msg)) {
      console.error(
        "\nLas reglas de Firestore no permiten escribir con el SDK web sin autenticación. Opciones:\n" +
          " (a) Descargar una service account (Firebase Console > Configuración del proyecto > Cuentas de servicio > Generar clave)\n" +
          "     y dejar el JSON en la raíz del proyecto (queda ignorado por git); volver a ejecutar npm run subir.\n" +
          " (b) Permitir temporalmente la escritura en Firestore > Reglas y volver a ejecutar.",
      );
    }
    process.exit(1);
  });
