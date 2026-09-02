/**
 * Tipo canónico de un perfil de inversor. Única fuente de verdad: Firestore (`inversores/{id}`, con el resumen en
 * `meta/indice` y la rúbrica en `meta/criterio`). El esquema zod valida en runtime (scripts y lectura desde
 * Firestore) y el tipo TypeScript se infiere de él.
 *
 * - `auditoria` vive dentro del perfil y es lo que se edita a mano: motivo, puntuación por dimensiones y motivo de
 *   "otros aspectos". Lo derivado (`puntuacion.bruto`, `topes`, `total`, y `nivel`, `banda`, `prioridad` en la raíz)
 *   lo recalcula `derivar()` a partir de esas entradas: los scripts al escribir y la app al leer. No se edita.
 * - `nivel` es 0-100. `banda` se deriva: Indiscutible >= 78, Alto potencial 60-77, Reserva 45-59, Descartado < 45;
 *   "Sin auditar" mientras `auditoria.estado` sea "pendiente". `prioridad` A/B/C se deriva del nivel.
 * - `confianza` califica las fuentes, no el encaje.
 * - Síntesis (`por_que_es_interesante`, `tesis_de_inversion`, `etapa_y_ticket`) y listas son arrays de strings;
 *   `antecedentes` e `investigacion_larga` son párrafos.
 * - `fuente_vias_de_contacto` documenta la procedencia de email, LinkedIn y otras vías; se muestra al final de la ficha.
 */
import { z } from "zod";

export const CRITERIO =
  "Rúbrica 0-100: tesis y encaje temático (0-25), etapa y pre-tracción (0-20), capacidad de decidir y capital (0-20), " +
  "español y cercanía (0-15), acceso y actividad (0-15), otros aspectos (-15/+5) con motivo obligatorio. " +
  "Topes: tesis < 6 → máx. 45; tesis < 10 → máx. 55; decisión ≤ 8 (no firma cheque) → máx. 69; " +
  "etapa ≤ 7 (Serie A o exige tracción) → máx. 64. Bandas: Indiscutible ≥ 78, Alto potencial 60-77, Reserva 45-59, " +
  "Descartado < 45. Origen y español sólo con autoidentificación pública o hechos biográficos documentados; " +
  "cada ficha se redacta en términos absolutos, sin comparaciones con otros perfiles.";

export const BANDAS = ["Indiscutible", "Alto potencial", "Reserva", "Descartado", "Sin auditar"] as const;
export const BandaSchema = z.enum(BANDAS);
export const UMBRALES = { Indiscutible: 78, "Alto potencial": 60, Reserva: 45 } as const;

export const EstadoAuditoriaSchema = z.enum(["revisado", "pendiente"]);
export const PrioridadSchema = z.enum(["A", "B", "C"]);
export const ConfianzaSchema = z.enum(["alta", "media", "baja"]);
export const RegionSchema = z.enum(["EE.UU. (hispanohablante)", "España", "México", "Fuera de región (excepcional)"]);
export const TipoInversorSchema = z.enum(["VC institucional", "Business angel", "Fondo operador / solo GP", "Corporate VC", "Aceleradora / programa"]);
export const EmailEstadoSchema = z.enum([
  "público verificado",
  "público (ver fuente)",
  "buzón general del fondo (público)",
  "patrón inferido (no verificado)",
  "no encontrado",
]);

/** Entradas editables de la puntuación. Máximos: 25/20/20/15/15; otros aspectos de -15 a +5 con motivo si no es 0. */
export const PuntuacionEntradaSchema = z.object({
  tesis: z.number().int().min(0).max(25),
  etapa: z.number().int().min(0).max(20),
  decision: z.number().int().min(0).max(20),
  espanol: z.number().int().min(0).max(15),
  acceso: z.number().int().min(0).max(15),
  otros_aspectos: z.number().int().min(-15).max(5),
  otros_aspectos_motivo: z.string(),
});
export type PuntuacionEntrada = z.infer<typeof PuntuacionEntradaSchema>;

/** Puntuación completa: entradas más lo derivado por `calcularPuntuacion`. */
export const PuntuacionSchema = PuntuacionEntradaSchema.extend({
  bruto: z.number().int(),
  topes: z.array(z.string()),
  total: z.number().int().min(0).max(100),
});
export type Puntuacion = z.infer<typeof PuntuacionSchema>;

export function calcularPuntuacion(p: PuntuacionEntrada): Puntuacion {
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
  return { ...p, bruto, topes, total };
}

export function bandaDe(nivel: number, estado: EstadoAuditoria): Banda {
  if (estado !== "revisado") return "Sin auditar";
  if (nivel >= UMBRALES.Indiscutible) return "Indiscutible";
  if (nivel >= UMBRALES["Alto potencial"]) return "Alto potencial";
  if (nivel >= UMBRALES.Reserva) return "Reserva";
  return "Descartado";
}

export function prioridadDe(nivel: number, estado: EstadoAuditoria): Prioridad {
  if (estado !== "revisado") return "C";
  if (nivel >= UMBRALES.Indiscutible) return "A";
  if (nivel >= UMBRALES["Alto potencial"]) return "B";
  return "C";
}

export const AuditoriaSchema = z.object({
  estado: EstadoAuditoriaSchema,
  /** Fecha (AAAA-MM-DD) de la última revisión manual. */
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Por qué tiene el nivel que tiene: encaje y reservas, en términos absolutos. */
  motivo: z.string(),
  puntuacion: PuntuacionSchema,
});

/** Procedencia de las vías de contacto: notas cortas (texto o URL) por canal. */
export const FuenteViasDeContactoSchema = z.object({
  email: z.array(z.string()),
  linkedin: z.array(z.string()),
  otras: z.array(z.string()),
});

export const InversorSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id debe ser un slug"),
  nombre: z.string().min(1),
  nivel: z.number().int().min(0).max(100),
  banda: BandaSchema,
  prioridad: PrioridadSchema,
  confianza: ConfianzaSchema,
  region: RegionSchema,
  firma: z.string(),
  rol: z.string(),
  ciudad_base: z.string(),
  tipo_inversor: TipoInversorSchema,
  tipo_inversor_detalle: z.string(),
  etapa_y_ticket: z.array(z.string()),
  linkedin: z.union([z.url(), z.literal("")]),
  /** Sitio, blog o newsletter que controla la propia persona (nunca la web del fondo). Vacío si no se localizó. */
  web_personal: z.union([z.url(), z.literal("")]),
  email: z.union([z.email(), z.literal("")]),
  email_estado: EmailEstadoSchema,
  por_que_es_interesante: z.array(z.string()),
  tesis_de_inversion: z.array(z.string()),
  antecedentes: z.string(),
  inversiones_relevantes: z.array(z.string()),
  senales_de_encaje: z.array(z.string()),
  riesgos_o_alertas: z.array(z.string()),
  como_llegar: z.array(z.string()),
  investigacion_larga: z.string(),
  fuentes: z.array(z.string()),
  fuente_vias_de_contacto: FuenteViasDeContactoSchema,
  auditoria: AuditoriaSchema,
});

export type Inversor = z.infer<typeof InversorSchema>;
export type Banda = z.infer<typeof BandaSchema>;
export type EstadoAuditoria = z.infer<typeof EstadoAuditoriaSchema>;
export type Prioridad = z.infer<typeof PrioridadSchema>;
export type Confianza = z.infer<typeof ConfianzaSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type TipoInversor = z.infer<typeof TipoInversorSchema>;
export type EmailEstado = z.infer<typeof EmailEstadoSchema>;
export type Auditoria = z.infer<typeof AuditoriaSchema>;
export type FuenteViasDeContacto = z.infer<typeof FuenteViasDeContactoSchema>;

/**
 * Deriva y valida un perfil a partir de sus entradas editables: recalcula puntuacion.bruto/topes/total y nivel,
 * banda y prioridad. Lo usan los scripts al escribir y la app al leer, así lo derivado nunca queda desfasado.
 */
export function derivar(bruto: unknown): Inversor {
  const b = (bruto ?? {}) as Record<string, unknown>;
  const au = (b.auditoria ?? {}) as Record<string, unknown>;
  const entrada = PuntuacionEntradaSchema.parse(au.puntuacion ?? {});
  const estado: EstadoAuditoria = au.estado === "pendiente" ? "pendiente" : "revisado";
  const puntuacion = calcularPuntuacion(entrada);
  if (entrada.otros_aspectos !== 0 && !entrada.otros_aspectos_motivo.trim()) throw new Error("otros_aspectos distinto de 0 sin motivo");
  if (estado === "revisado") {
    if (!String(au.motivo ?? "").trim()) throw new Error("auditoría revisada sin motivo");
    for (const k of ["por_que_es_interesante", "tesis_de_inversion", "etapa_y_ticket"] as const) {
      if (!Array.isArray(b[k]) || !(b[k] as unknown[]).length) throw new Error(`auditoría revisada con ${k} vacío`);
    }
  }
  const { actualizado: _a, ...resto } = b;
  void _a;
  return InversorSchema.parse({
    ...resto,
    nivel: puntuacion.total,
    banda: bandaDe(puntuacion.total, estado),
    prioridad: prioridadDe(puntuacion.total, estado),
    auditoria: { estado, fecha: au.fecha, motivo: au.motivo ?? "", puntuacion },
  });
}

/** Resumen ligero para listados y filtros (`meta/indice` en Firestore). */
export const InversorResumenSchema = InversorSchema.pick({
  id: true,
  nombre: true,
  nivel: true,
  banda: true,
  prioridad: true,
  confianza: true,
  region: true,
  firma: true,
  rol: true,
  ciudad_base: true,
  tipo_inversor: true,
  linkedin: true,
  web_personal: true,
  email: true,
  email_estado: true,
}).extend({
  estado_auditoria: EstadoAuditoriaSchema,
  etapa_resumen: z.string(),
  motivo_nivel: z.string(),
  puntuacion: PuntuacionSchema,
});
export type InversorResumen = z.infer<typeof InversorResumenSchema>;

/** Recalcula lo derivado de una entrada del índice (por si el índice guardado quedó desfasado). */
export function derivarResumen(r: InversorResumen): InversorResumen {
  const puntuacion = calcularPuntuacion(r.puntuacion);
  return { ...r, puntuacion, nivel: puntuacion.total, banda: bandaDe(puntuacion.total, r.estado_auditoria), prioridad: prioridadDe(puntuacion.total, r.estado_auditoria) };
}

export const IndiceSchema = z.object({
  generado: z.string(),
  total: z.number().int().nonnegative(),
  perfiles: z.array(InversorResumenSchema),
});
export type Indice = z.infer<typeof IndiceSchema>;

export function resumenDe(p: Inversor): InversorResumen {
  return InversorResumenSchema.parse({
    ...p,
    estado_auditoria: p.auditoria.estado,
    etapa_resumen: p.etapa_y_ticket[0] ?? "",
    motivo_nivel: p.auditoria.motivo,
    puntuacion: p.auditoria.puntuacion,
  });
}
