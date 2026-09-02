/**
 * Auditoría v2: puntuación 0-100 por perfil y síntesis en puntos.
 *
 * Las decisiones viven en data/auditoria_v2/lote*.json (un objeto por id con `puntuacion`, `motivo`, `por_que`,
 * `etapa_y_ticket` y `tesis`). Este módulo las carga, calcula el total con topes y construye el perfil v2.
 */
import fs from "node:fs";
import path from "node:path";
import { InversorSchema, bandaDe, prioridadDe, type Inversor, type Puntuacion } from "../../src/types/inversor";

export const CRITERIO =
  "Rúbrica 0-100: tesis y encaje temático (0-25), etapa y pre-tracción (0-20), capacidad de decidir y capital (0-20), " +
  "español y cercanía (0-15), acceso y actividad (0-15), ajuste (-15/+5). Topes: tesis<6 → máx. 45; tesis<10 → máx. 55; " +
  "decisión≤8 (no firma cheque) → máx. 69; etapa≤7 (Serie A o exige tracción) → máx. 64. " +
  "Bandas: Indiscutible ≥78, Alto potencial 60-77, Reserva 45-59, Descartado <45. " +
  "Origen y español sólo con autoidentificación pública o hechos biográficos documentados.";

export interface DecisionV2 {
  puntuacion: { tesis: number; etapa: number; decision: number; espanol: number; acceso: number; ajuste: number };
  motivo: string;
  por_que: string[];
  etapa_y_ticket: string[];
  tesis: string[];
}

export function cargarDecisiones(raiz: string): Record<string, DecisionV2> {
  const carpeta = path.join(raiz, "data", "auditoria_v2");
  const out: Record<string, Partial<DecisionV2>> = {};
  for (const f of fs.readdirSync(carpeta).filter((f) => f.endsWith(".json")).sort()) {
    const lote = JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8")) as Record<string, Partial<DecisionV2>>;
    for (const [id, d] of Object.entries(lote)) out[id] = { ...(out[id] ?? {}), ...d };
  }
  const completas: Record<string, DecisionV2> = {};
  const incompletas: string[] = [];
  for (const [id, d] of Object.entries(out)) {
    if (d.puntuacion && d.motivo && d.por_que && d.etapa_y_ticket && d.tesis) completas[id] = d as DecisionV2;
    else incompletas.push(`${id} (faltan: ${["puntuacion", "motivo", "por_que", "etapa_y_ticket", "tesis"].filter((k) => !(k in d)).join(", ")})`);
  }
  if (incompletas.length) throw new Error(`Decisiones incompletas en data/auditoria_v2:\n - ${incompletas.join("\n - ")}`);
  return completas;
}

export function calcularPuntuacion(p: DecisionV2["puntuacion"]): Puntuacion {
  const bruto = p.tesis + p.etapa + p.decision + p.espanol + p.acceso + p.ajuste;
  const topes: string[] = [];
  let total = bruto;
  const tope = (cond: boolean, max: number, etiqueta: string) => {
    if (cond && total > max) {
      total = max;
      topes.push(etiqueta);
    }
  };
  tope(p.tesis < 6, 45, "tesis < 6 → máx. 45");
  tope(p.tesis < 10, 55, "tesis < 10 → máx. 55");
  tope(p.decision <= 8, 69, "no firma cheque → máx. 69");
  tope(p.etapa <= 7, 64, "Serie A o exige tracción → máx. 64");
  total = Math.max(0, Math.min(100, Math.round(total)));
  return { ...p, bruto, topes, total };
}

const aLista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : String(v ?? "").split(/\r?\n+/).map((s) => s.trim()).filter(Boolean));

/** Construye el perfil v2 a partir de un perfil v1 (importado) o de un perfil v2 ya aplicado (re-ejecución). */
export function aplicarV2(perfil: Record<string, unknown>, d: DecisionV2, fecha: string): Inversor {
  const au = (perfil.auditoria ?? {}) as Record<string, unknown>;
  const esV2 = au.version === 2;
  const textosV1 = esV2
    ? (perfil.textos_v1 as Record<string, unknown>)
    : {
        por_que_es_interesante: String(perfil.por_que_es_interesante ?? ""),
        tesis_de_inversion: String(perfil.tesis_de_inversion ?? ""),
        etapa_y_ticket: aLista(perfil.etapa_y_ticket),
      };
  const puntuacion = calcularPuntuacion(d.puntuacion);
  const candidato = {
    ...perfil,
    nivel: puntuacion.total,
    banda: bandaDe(puntuacion.total),
    prioridad: prioridadDe(puntuacion.total),
    confianza: esV2 ? au.confianza_final : perfil.confianza,
    por_que_es_interesante: d.por_que,
    tesis_de_inversion: d.tesis,
    etapa_y_ticket: d.etapa_y_ticket,
    auditoria: {
      version: 2 as const,
      fecha,
      auditor: "orquestador (Claude), revisión manual perfil a perfil, segunda pasada con rúbrica numérica",
      criterio: CRITERIO,
      puntuacion,
      motivo: d.motivo,
      nivel_v1: esV2 ? au.nivel_v1 : String(perfil.nivel ?? ""),
      prioridad_agente: au.prioridad_agente,
      confianza_agente: au.confianza_agente,
      prioridad_v1: esV2 ? au.prioridad_v1 : perfil.prioridad,
      confianza_final: esV2 ? au.confianza_final : perfil.confianza,
      motivo_v1: esV2 ? au.motivo_v1 : au.motivo,
    },
    textos_v1: textosV1,
  };
  delete (candidato as Record<string, unknown>).nivel_etiqueta;
  return InversorSchema.parse(candidato);
}

export function ordenarPerfiles(perfiles: Inversor[]): Inversor[] {
  return perfiles.sort((a, b) => b.nivel - a.nivel || a.region.localeCompare(b.region) || a.nombre.localeCompare(b.nombre));
}
