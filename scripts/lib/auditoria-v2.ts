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
  "español y cercanía (0-15), acceso y actividad (0-15), otros aspectos (-15/+5). Topes: tesis<6 → máx. 45; tesis<10 → máx. 55; " +
  "decisión≤8 (no firma cheque) → máx. 69; etapa≤7 (Serie A o exige tracción) → máx. 64. " +
  "Bandas: Indiscutible ≥78, Alto potencial 60-77, Reserva 45-59, Descartado <45. " +
  "Origen y español sólo con autoidentificación pública o hechos biográficos documentados.";

export interface DecisionV2 {
  puntuacion: { tesis: number; etapa: number; decision: number; espanol: number; acceso: number; otros_aspectos: number; otros_aspectos_motivo?: string };
  motivo: string;
  por_que: string[];
  etapa_y_ticket: string[];
  tesis: string[];
}

export function cargarDecisiones(raiz: string): Record<string, DecisionV2> {
  const carpeta = path.join(raiz, "data", "auditoria_v2");
  const out: Record<string, Partial<DecisionV2>> = {};
  for (const f of fs.readdirSync(carpeta).filter((f) => /^lote.*\.json$/.test(f)).sort()) {
    const lote = JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8")) as Record<string, Partial<DecisionV2>>;
    for (const [id, d] of Object.entries(lote)) {
      if (id.startsWith("_")) continue;
      out[id] = { ...(out[id] ?? {}), ...d };
    }
  }
  // Motivos de 'otros aspectos' (data/auditoria_v2/otros_aspectos.json): obligatorios cuando el valor es distinto de cero.
  const rutaOtros = path.join(carpeta, "otros_aspectos.json");
  const otrosAspectos = fs.existsSync(rutaOtros)
    ? (JSON.parse(fs.readFileSync(rutaOtros, "utf8")) as Record<string, string>)
    : {};
  const completas: Record<string, DecisionV2> = {};
  const incompletas: string[] = [];
  for (const [id, d] of Object.entries(out)) {
    if (d.puntuacion && d.motivo && d.por_que && d.etapa_y_ticket && d.tesis) {
      const motivoOtros = otrosAspectos[id] ?? "";
      if (d.puntuacion.otros_aspectos !== 0 && !motivoOtros) incompletas.push(`${id} (otros_aspectos ${d.puntuacion.otros_aspectos} sin motivo en otros_aspectos.json)`);
      completas[id] = { ...(d as DecisionV2), puntuacion: { ...d.puntuacion, otros_aspectos_motivo: d.puntuacion.otros_aspectos === 0 ? "" : motivoOtros } };
    } else incompletas.push(`${id} (faltan: ${["puntuacion", "motivo", "por_que", "etapa_y_ticket", "tesis"].filter((k) => !(k in d)).join(", ")})`);
  }
  if (incompletas.length) throw new Error(`Decisiones incompletas en data/auditoria_v2:\n - ${incompletas.join("\n - ")}`);
  return completas;
}

export function calcularPuntuacion(p: DecisionV2["puntuacion"]): Puntuacion {
  const bruto = p.tesis + p.etapa + p.decision + p.espanol + p.acceso + p.otros_aspectos;
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
  return { ...p, otros_aspectos_motivo: p.otros_aspectos_motivo ?? "", bruto, topes, total };
}

const aLista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : String(v ?? "").split(/\r?\n+/).map((s) => s.trim()).filter(Boolean));

/** Convierte las notas libres de contacto (texto con " | ", " || ", saltos de línea, guiones) en una lista limpia sin duplicados. */
function aNotas(v: unknown): string[] {
  const texto = Array.isArray(v) ? v.map(String).join("\n") : String(v ?? "");
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const bruto of texto.split(/\r?\n+|\s\|\|\s|\s\|\s/)) {
    let n = bruto.trim().replace(/^[—–\-·•]\s*/, "").replace(/\s+/g, " ").trim();
    // Paréntesis huérfano heredado de la extracción del email ("buzón general ... )") → se elimina el ")" sin pareja.
    let abiertos = 0;
    n = [...n].filter((c) => (c === "(" ? (abiertos++, true) : c === ")" ? (abiertos > 0 ? (abiertos--, true) : false) : true)).join("");
    n = n.replace(/^[\s,;:]+/, "").trim();
    if (n && !/^(https?:\/\/|www\.)/i.test(n)) n = n[0].toUpperCase() + n.slice(1);
    n = n.replace(/^Https?:\/\//, (m) => m.toLowerCase());
    if (!n || /^no encontrado\.?$/i.test(n)) continue;
    const clave = n.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    out.push(n);
  }
  return out;
}

/** Construye `fuente_vias_de_contacto` desde los campos sueltos v1 (email_fuente, linkedin_nota, otros_perfiles) o conserva el v2. */
function fuenteViasDeContacto(perfil: Record<string, unknown>, esV2: boolean): { email: string[]; linkedin: string[]; otras: string[] } {
  if (esV2 && perfil.fuente_vias_de_contacto) {
    const v = perfil.fuente_vias_de_contacto as { email: unknown; linkedin: unknown; otras: unknown };
    return { email: aNotas(v.email), linkedin: aNotas(v.linkedin), otras: aNotas(v.otras) };
  }
  const email = aNotas(perfil.email_fuente);
  const estado = String(perfil.email_estado ?? "");
  if (!email.length) {
    if (estado === "no encontrado") email.push("No se localizó email individual en fuentes públicas.");
    else if (estado.startsWith("patrón")) email.push("Dirección inferida del patrón del dominio del fondo; no verificada.");
    else if (estado.startsWith("buzón")) email.push("Buzón general del fondo publicado en su web.");
  }
  return { email, linkedin: aNotas(perfil.linkedin_nota), otras: aNotas(perfil.otros_perfiles) };
}

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
    fuente_vias_de_contacto: fuenteViasDeContacto(perfil, esV2),
    textos_v1: textosV1,
  };
  for (const k of ["nivel_etiqueta", "email_fuente", "linkedin_nota", "otros_perfiles", "email_original"]) delete (candidato as Record<string, unknown>)[k];
  return InversorSchema.parse(candidato);
}

export function ordenarPerfiles(perfiles: Inversor[]): Inversor[] {
  return perfiles.sort((a, b) => b.nivel - a.nivel || a.region.localeCompare(b.region) || a.nombre.localeCompare(b.nombre));
}
