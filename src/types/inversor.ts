/**
 * Tipo canónico de un perfil de inversor.
 *
 * Es la única definición del tipo: el esquema zod valida en runtime (scripts de importación y subida,
 * lectura desde Firestore) y el tipo TypeScript se infiere de él, así que no pueden divergir.
 *
 * Convenciones:
 * - `id` es el slug (nombre en minúsculas sin acentos, con guiones) y es el id del documento en Firestore.
 * - Los campos que en la investigación eran listas (inversiones, señales, riesgos, cómo llegar, fuentes)
 *   son SIEMPRE arrays de strings; los párrafos son strings.
 * - Los enums cerrados (nivel, prioridad, confianza, región, tipo de inversor, estado del email) se
 *   validan estrictamente; el texto libre original de `tipo_inversor` se conserva en `tipo_inversor_detalle`.
 */
import { z } from "zod";

export const NIVELES = {
  "1": "1 - Indiscutible (pureza)",
  "2": "2 - Alto potencial",
  r: "3 - Reserva (encaje parcial)",
  x: "4 - Descartado (ver riesgos)",
} as const;

export const NivelSchema = z.enum(["1", "2", "r", "x"]);
export const PrioridadSchema = z.enum(["A", "B", "C"]);
export const ConfianzaSchema = z.enum(["alta", "media", "baja"]);
export const RegionSchema = z.enum([
  "EE.UU. (hispanohablante)",
  "España",
  "México",
  "Fuera de región (excepcional)",
]);
export const TipoInversorSchema = z.enum([
  "VC institucional",
  "Business angel",
  "Fondo operador / solo GP",
  "Corporate VC",
  "Aceleradora / programa",
]);
export const EmailEstadoSchema = z.enum([
  "público verificado",
  "público (ver fuente)",
  "buzón general del fondo (público)",
  "patrón inferido (no verificado)",
  "no encontrado",
]);

export const AuditoriaSchema = z.object({
  fecha: z.string(),
  auditor: z.string(),
  prioridad_agente: PrioridadSchema,
  confianza_agente: ConfianzaSchema,
  prioridad_final: PrioridadSchema,
  confianza_final: ConfianzaSchema,
  nivel_final: NivelSchema,
  cambio_prioridad: z.boolean(),
  cambio_confianza: z.boolean(),
  motivo: z.string(),
});

export const InversorSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id debe ser un slug"),
  nombre: z.string().min(1),
  nivel: NivelSchema,
  nivel_etiqueta: z.string(),
  prioridad: PrioridadSchema,
  confianza: ConfianzaSchema,
  region: RegionSchema,
  firma: z.string(),
  rol: z.string(),
  ciudad_base: z.string(),
  tipo_inversor: TipoInversorSchema,
  tipo_inversor_detalle: z.string(),
  etapa_y_ticket: z.string(),
  linkedin: z.union([z.url(), z.literal("")]),
  linkedin_nota: z.string(),
  otros_perfiles: z.string(),
  email: z.union([z.email(), z.literal("")]),
  email_estado: EmailEstadoSchema,
  email_fuente: z.string(),
  tesis_de_inversion: z.string(),
  antecedentes: z.string(),
  por_que_es_interesante: z.string(),
  inversiones_relevantes: z.array(z.string()),
  senales_de_encaje: z.array(z.string()),
  riesgos_o_alertas: z.array(z.string()),
  como_llegar: z.array(z.string()),
  investigacion_larga: z.string(),
  fuentes: z.array(z.string()),
  auditoria: AuditoriaSchema,
  nombre_original: z.string(),
  email_original: z.string(),
});

export type Inversor = z.infer<typeof InversorSchema>;
export type Nivel = z.infer<typeof NivelSchema>;
export type Prioridad = z.infer<typeof PrioridadSchema>;
export type Confianza = z.infer<typeof ConfianzaSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type TipoInversor = z.infer<typeof TipoInversorSchema>;
export type EmailEstado = z.infer<typeof EmailEstadoSchema>;
export type Auditoria = z.infer<typeof AuditoriaSchema>;

/** Resumen ligero para listados y filtros (lo que guarda `meta/indice` en Firestore y `data/indice.json`). */
export const InversorResumenSchema = InversorSchema.pick({
  id: true,
  nombre: true,
  nivel: true,
  nivel_etiqueta: true,
  prioridad: true,
  confianza: true,
  region: true,
  firma: true,
  rol: true,
  ciudad_base: true,
  tipo_inversor: true,
  etapa_y_ticket: true,
  linkedin: true,
  email: true,
  email_estado: true,
}).extend({
  motivo_nivel: z.string(),
});
export type InversorResumen = z.infer<typeof InversorResumenSchema>;

export const IndiceSchema = z.object({
  generado: z.string(),
  total: z.number().int().nonnegative(),
  perfiles: z.array(InversorResumenSchema),
});
export type Indice = z.infer<typeof IndiceSchema>;

export function resumenDe(p: Inversor): InversorResumen {
  return InversorResumenSchema.parse({ ...p, motivo_nivel: p.auditoria.motivo });
}
