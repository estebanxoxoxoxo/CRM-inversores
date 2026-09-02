/**
 * Mantenimiento de la base (única fuente de verdad):
 *  1. Lee todos los documentos de `inversores`.
 *  2. Deriva de cada uno lo que no se edita (puntuacion.bruto/topes/total, nivel, banda, prioridad) y valida contra el tipo.
 *  3. Escribe de vuelta sólo los documentos que cambiaron.
 *  4. Regenera `meta/indice` (resumen para listados) y `meta/criterio` (rúbrica).
 *
 * Uso: npm run recalcular   (idempotente; termina con código 1 si algún documento no valida)
 */
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { CRITERIO, derivar, resumenDe, type Inversor } from "../src/types/inversor";
import { conectar, explicarError } from "./lib/firestore";

export async function recalcularBase(db: ReturnType<typeof conectar>): Promise<{ perfiles: Inversor[]; cambiados: number; errores: string[] }> {
  const snap = await getDocs(collection(db, "inversores"));
  const perfiles: Inversor[] = [];
  const errores: string[] = [];
  let cambiados = 0;
  let batch = writeBatch(db);
  let enBatch = 0;
  const ahora = new Date().toISOString();
  for (const d of snap.docs) {
    const bruto = d.data() as Record<string, unknown>;
    try {
      const p = derivar({ ...bruto, id: bruto.id ?? d.id });
      perfiles.push(p);
      const { actualizado: _a, ...sinMarca } = bruto;
      void _a;
      if (JSON.stringify(sinMarca) !== JSON.stringify(p)) {
        batch.set(doc(db, "inversores", p.id), { ...p, actualizado: ahora });
        cambiados++;
        if (++enBatch >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          enBatch = 0;
        }
      }
    } catch (e) {
      errores.push(`${d.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  perfiles.sort((a, b) => b.nivel - a.nivel || a.region.localeCompare(b.region) || a.nombre.localeCompare(b.nombre));
  batch.set(doc(db, "meta", "indice"), { generado: ahora.slice(0, 10), total: perfiles.length, perfiles: perfiles.map(resumenDe) });
  batch.set(doc(db, "meta", "criterio"), { texto: CRITERIO, actualizado: ahora });
  await batch.commit();
  return { perfiles, cambiados, errores };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/recalcular.ts")) {
  const db = conectar();
  recalcularBase(db)
    .then(({ perfiles, cambiados, errores }) => {
      const cuenta = perfiles.reduce<Record<string, number>>((a, p) => ((a[p.banda] = (a[p.banda] ?? 0) + 1), a), {});
      console.log(`Validados ${perfiles.length} perfiles; ${cambiados} reescritos; meta/indice y meta/criterio regenerados.`);
      console.log("Bandas:", cuenta);
      if (errores.length) {
        console.error("\nDOCUMENTOS QUE NO VALIDAN (no se tocaron):");
        for (const e of errores) console.error(" -", e);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((e: unknown) => {
      console.error("ERROR:", explicarError(e));
      process.exit(1);
    });
}
