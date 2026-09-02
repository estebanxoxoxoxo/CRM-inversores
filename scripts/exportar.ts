/**
 * Respaldo local de la base: vuelca `inversores/*` y `meta/*` a respaldo/<fecha>/ (carpeta ignorada por git).
 * No es fuente de verdad; sirve para copia de seguridad o para revisar datos sin la consola de Firebase.
 *
 * Uso: npm run exportar
 */
import fs from "node:fs";
import path from "node:path";
import { collection, getDocs } from "firebase/firestore";
import { conectar, explicarError } from "./lib/firestore";

const raiz = path.resolve(import.meta.dirname, "..");
const db = conectar();
(async () => {
  const fecha = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const destino = path.join(raiz, "respaldo", fecha);
  fs.mkdirSync(path.join(destino, "inversores"), { recursive: true });
  fs.mkdirSync(path.join(destino, "meta"), { recursive: true });
  let n = 0;
  for (const col of ["inversores", "meta"] as const) {
    const snap = await getDocs(collection(db, col));
    for (const d of snap.docs) {
      fs.writeFileSync(path.join(destino, col, `${d.id}.json`), JSON.stringify(d.data(), null, 2) + "\n", "utf8");
      n++;
    }
  }
  console.log(`Exportados ${n} documentos a ${destino}`);
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explicarError(e));
  process.exit(1);
});
