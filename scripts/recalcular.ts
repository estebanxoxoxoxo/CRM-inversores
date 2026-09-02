/**
 * Recalcula lo derivado de cada perfil a partir de su propia auditoría (única fuente de verdad), valida contra el
 * tipo canónico y regenera data/indice.json.
 *
 * Deriva: auditoria.puntuacion.{bruto, topes, total} y, en la raíz, nivel, banda y prioridad.
 * Exige: motivo de "otros aspectos" cuando el valor no es 0; motivo y síntesis no vacíos si el estado es "revisado".
 *
 * Uso: npm run recalcular   (idempotente; falla con código 1 si algún perfil no valida)
 */
import fs from "node:fs";
import path from "node:path";
import { InversorSchema, PuntuacionEntradaSchema, bandaDe, calcularPuntuacion, prioridadDe, resumenDe, type Inversor } from "../src/types/inversor";

const raiz = path.resolve(import.meta.dirname, "..");
const carpeta = path.join(raiz, "data", "perfiles");

export function recalcularPerfil(bruto: Record<string, unknown>): Inversor {
  const au = (bruto.auditoria ?? {}) as Record<string, unknown>;
  const entrada = PuntuacionEntradaSchema.parse(au.puntuacion ?? {});
  const estado = au.estado === "pendiente" ? "pendiente" : "revisado";
  const puntuacion = calcularPuntuacion(entrada);
  const errores: string[] = [];
  if (entrada.otros_aspectos !== 0 && !entrada.otros_aspectos_motivo.trim()) errores.push("otros_aspectos distinto de 0 sin motivo");
  if (estado === "revisado") {
    if (!String(au.motivo ?? "").trim()) errores.push("auditoría revisada sin motivo");
    for (const k of ["por_que_es_interesante", "tesis_de_inversion", "etapa_y_ticket"] as const) {
      if (!Array.isArray(bruto[k]) || !(bruto[k] as unknown[]).length) errores.push(`auditoría revisada con ${k} vacío`);
    }
  }
  if (errores.length) throw new Error(errores.join("; "));
  return InversorSchema.parse({
    ...bruto,
    nivel: puntuacion.total,
    banda: bandaDe(puntuacion.total, estado),
    prioridad: prioridadDe(puntuacion.total, estado),
    auditoria: { estado, fecha: au.fecha, motivo: au.motivo ?? "", puntuacion },
  });
}

export function ordenar(perfiles: Inversor[]): Inversor[] {
  return perfiles.sort((a, b) => b.nivel - a.nivel || a.region.localeCompare(b.region) || a.nombre.localeCompare(b.nombre));
}

export function escribirIndice(perfiles: Inversor[]): void {
  const hoy = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(raiz, "data", "indice.json"), JSON.stringify({ generado: hoy, total: perfiles.length, perfiles: perfiles.map(resumenDe) }, null, 1) + "\n", "utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const perfiles: Inversor[] = [];
  const errores: string[] = [];
  for (const f of fs.readdirSync(carpeta).filter((f) => f.endsWith(".json")).sort()) {
    try {
      const p = recalcularPerfil(JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8")));
      fs.writeFileSync(path.join(carpeta, f), JSON.stringify(p, null, 2) + "\n", "utf8");
      perfiles.push(p);
    } catch (e) {
      errores.push(`${f}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  ordenar(perfiles);
  escribirIndice(perfiles);
  const cuenta = (f: (p: Inversor) => string) => perfiles.reduce<Record<string, number>>((a, p) => ((a[f(p)] = (a[f(p)] ?? 0) + 1), a), {});
  console.log(`Recalculados ${perfiles.length} perfiles. Bandas:`, cuenta((p) => p.banda), "| con topes:", perfiles.filter((p) => p.auditoria.puntuacion.topes.length).length);
  if (errores.length) {
    console.error("\nPERFILES QUE NO VALIDAN:");
    for (const e of errores) console.error(" -", e);
    process.exit(1);
  }
}
