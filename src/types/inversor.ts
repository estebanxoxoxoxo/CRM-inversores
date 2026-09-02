/**
 * Tipo canónico de un perfil de inversor (versión 2, auditoría numérica).
 *
 * Única definición del tipo: el esquema zod valida en runtime (scripts y lectura desde Firestore) y el tipo
 * TypeScript se infiere de él.
 *
 * Convenciones:
 * - `id` es el slug y el id del documento en Firestore.
 * - `nivel` es una puntuación 0-100 asignada en la auditoría manual con la rúbrica de `auditoria.puntuacion`
 *   (tesis 25, etapa 20, decisión y capital 20, español 15, acceso y actividad 15, otros aspectos -15/+5, más topes).
 *   `banda` se deriva de `nivel`: Indiscutible >= 78, Alto potencial 60-77, Reserva 45-59, Descartado < 45.
 * - `prioridad` se deriva de `nivel` (A >= 78, B >= 60, C resto); `confianza` califica las fuentes, no el encaje.
 * - Los campos de síntesis (`por_que_es_interesante`, `tesis_de_inversion`, `etapa_y_ticket`) y las listas
 *   (inversiones, señales, riesgos, cómo llegar, fuentes) son SIEMPRE arrays de strings; `antecedentes` e
 *   `investigacion_larga` son párrafos.
 * - `fuente_vias_de_contacto` documenta de dónde sale cada vía de contacto (email, LinkedIn, otras) como listas
 *   de notas cortas; se muestra al final de la ficha. Los datos de contacto en sí van en `email`, `email_estado`
 *   y `linkedin`.
 */
import { z } from "zod";

export const BANDAS = ["Indiscutible", "Alto potencial", "Reserva", "Descartado"] as const;
export const BandaSchema = z.enum(BANDAS);
export const UMBRALES = { Indiscutible: 78, "Alto potencial": 60, Reserva: 45 } as const;

export function bandaDe(nivel: number): Banda {
  if (nivel >= UMBRALES.Indiscutible) return "Indiscutible";
  if (nivel >= UMBRALES["Alto potencial"]) return "Alto potencial";
  if (nivel >= UMBRALES.Reserva) return "Reserva";
  return "Descartado";
}

export function prioridadDe(nivel: number): Prioridad {
  if (nivel >= UMBRALES.Indiscutible) return "A";
  if (nivel >= UMBRALES["Alto potencial"]) return "B";
  return "C";
}

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

/** Desglose de la puntuación 0-100. Los máximos por dimensión son 25/20/20/15/15; 'otros aspectos' va de -15 a +5. */
export const PuntuacionSchema = z.object({
  tesis: z.number().int().min(0).max(25),
  etapa: z.number().int().min(0).max(20),
  decision: z.number().int().min(0).max(20),
  espanol: z.number().int().min(0).max(15),
  acceso: z.number().int().min(0).max(15),
  otros_aspectos: z.number().int().min(-15).max(5),
  otros_aspectos_motivo: z.string(),
  bruto: z.number().int(),
  topes: z.array(z.string()),
  total: z.number().int().min(0).max(100),
});
export type Puntuacion = z.infer<typeof PuntuacionSchema>;

/** Procedencia de las vías de contacto: notas cortas (texto o URL) por canal. */
export const FuenteViasDeContactoSchema = z.object({
  email: z.array(z.string()),
  linkedin: z.array(z.string()),
  otras: z.array(z.string()),
});
export type FuenteViasDeContacto = z.infer<typeof FuenteViasDeContactoSchema>;

export const AuditoriaSchema = z.object({
  version: z.literal(2),
  fecha: z.string(),
  auditor: z.string(),
  criterio: z.string(),
  puntuacion: PuntuacionSchema,
  motivo: z.string(),
  nivel_v1: z.string(),
  prioridad_agente: PrioridadSchema,
  confianza_agente: ConfianzaSchema,
  prioridad_v1: PrioridadSchema,
  confianza_final: ConfianzaSchema,
  motivo_v1: z.string(),
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
  nombre_original: z.string(),
  textos_v1: z
    .object({
      por_que_es_interesante: z.string(),
      tesis_de_inversion: z.string(),
      etapa_y_ticket: z.array(z.string()),
    })
    .optional(),
});

export type Inversor = z.infer<typeof InversorSchema>;
export type Banda = z.infer<typeof BandaSchema>;
export type Prioridad = z.infer<typeof PrioridadSchema>;
export type Confianza = z.infer<typeof ConfianzaSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type TipoInversor = z.infer<typeof TipoInversorSchema>;
export type EmailEstado = z.infer<typeof EmailEstadoSchema>;
export type Auditoria = z.infer<typeof AuditoriaSchema>;

/** Resumen ligero para listados y filtros (`meta/indice` en Firestore y `data/indice.json`). */
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
  etapa_resumen: z.string(),
  motivo_nivel: z.string(),
  puntuacion: PuntuacionSchema,
});
export type InversorResumen = z.infer<typeof InversorResumenSchema>;

export const IndiceSchema = z.object({
  generado: z.string(),
  version: z.literal(2),
  total: z.number().int().nonnegative(),
  perfiles: z.array(InversorResumenSchema),
});
export type Indice = z.infer<typeof IndiceSchema>;

export function resumenDe(p: Inversor): InversorResumen {
  return InversorResumenSchema.parse({
    ...p,
    etapa_resumen: p.etapa_y_ticket[0] ?? "",
    motivo_nivel: p.auditoria.motivo,
    puntuacion: p.auditoria.puntuacion,
  });
}
