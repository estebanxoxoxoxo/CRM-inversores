/**
 * Re-aplica la auditoría v2 (data/auditoria_v2/lote*.json) sobre data/perfiles/*.json y regenera data/indice.json.
 * Idempotente: se puede ejecutar tras editar una puntuación o un texto. Uso: npm run auditar
 */
import fs from "node:fs";
import path from "node:path";
import { resumenDe, type Inversor } from "../src/types/inversor";
import { aplicarV2, cargarDecisiones, ordenarPerfiles } from "./lib/auditoria-v2";

const raiz = path.resolve(import.meta.dirname, "..");
const carpeta = path.join(raiz, "data", "perfiles");
const decisiones = cargarDecisiones(raiz);
const hoy = new Date().toISOString().slice(0, 10);

const perfiles: Inversor[] = [];
const errores: string[] = [];
for (const f of fs.readdirSync(carpeta).filter((f) => f.endsWith(".json")).sort()) {
  const id = f.replace(/\.json$/, "");
  const d = decisiones[id];
  if (!d) {
    errores.push(`${id}: sin decisión en data/auditoria_v2`);
    continue;
  }
  try {
    const p = aplicarV2(JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8")), d, hoy);
    fs.writeFileSync(path.join(carpeta, f), JSON.stringify(p, null, 2) + "\n", "utf8");
    perfiles.push(p);
  } catch (e) {
    errores.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
ordenarPerfiles(perfiles);
fs.writeFileSync(
  path.join(raiz, "data", "indice.json"),
  JSON.stringify({ generado: hoy, version: 2, total: perfiles.length, perfiles: perfiles.map(resumenDe) }, null, 1) + "\n",
  "utf8",
);
const cuenta = (f: (p: Inversor) => string) => perfiles.reduce<Record<string, number>>((a, p) => ((a[f(p)] = (a[f(p)] ?? 0) + 1), a), {});
console.log(`Auditoría v2 aplicada a ${perfiles.length} perfiles.`);
console.log("bandas:", cuenta((p) => p.banda), "| con topes:", perfiles.filter((p) => p.auditoria.puntuacion.topes.length).length);
if (errores.length) {
  console.error("\nERRORES:");
  for (const e of errores) console.error(" -", e);
  process.exit(1);
}
