/** Spanish UI labels for the English codes of the investor type. Everything the user reads comes from here. */
import { BAND_THRESHOLDS, SCORE_MAX, SCORE_TOTAL_MAX, type AuditStatus, type Band, type Cap, type Confidence, type EmailStatus, type InvestorType, type Rating, type Region } from "../types/investor";

export const RATING_LABELS: Record<Rating, string> = {
  approved: "Aprobado",
  doubtful: "Dudoso",
  rejected: "Desaprobado",
  filler: "Relleno",
};

/** Value used by the filters for investors without a rating. */
export const UNRATED = "unrated";
export const UNRATED_LABEL = "Sin calificar";

export const BAND_LABELS: Record<Band, string> = {
  undisputed: "Indiscutible",
  high_potential: "Alto potencial",
  reserve: "Reserva",
  discarded: "Descartado",
  unaudited: "Sin auditar",
};

export const BAND_RANGES: Record<Band, string> = {
  undisputed: `${BAND_THRESHOLDS.undisputed}-${SCORE_TOTAL_MAX}`,
  high_potential: `${BAND_THRESHOLDS.high_potential}-${BAND_THRESHOLDS.undisputed - 1}`,
  reserve: `${BAND_THRESHOLDS.reserve}-${BAND_THRESHOLDS.high_potential - 1}`,
  discarded: `0-${BAND_THRESHOLDS.reserve - 1}`,
  unaudited: "pendiente",
};

/** CSS class that colours a band. */
export const BAND_CLASS: Record<Band, string> = {
  undisputed: "band-1",
  high_potential: "band-2",
  reserve: "band-3",
  discarded: "band-4",
  unaudited: "band-0",
};

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = { reviewed: "revisado", pending: "pendiente" };

export const REGION_LABELS: Record<Region, string> = {
  us_hispanic: "EE.UU. (hispanohablante)",
  spain: "España",
  mexico: "México",
  out_of_region: "Fuera de región (excepcional)",
};

export const REGION_SHORT_LABELS: Record<Region, string> = {
  us_hispanic: "EE. UU.",
  spain: "España",
  mexico: "México",
  out_of_region: "Fuera de región",
};

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  institutional_vc: "VC institucional",
  business_angel: "Business angel",
  operator_fund: "Fondo operador / solo GP",
  corporate_vc: "Corporate VC",
  accelerator: "Aceleradora / programa",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = { high: "alta", medium: "media", low: "baja" };

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  public_verified: "público verificado",
  public_sourced: "público (ver fuente)",
  firm_general_mailbox: "buzón general del fondo (público)",
  inferred_pattern: "patrón inferido (no verificado)",
  not_found: "no encontrado",
};

export const CAP_LABELS: Record<Cap, string> = {
  thesis_below_6: "tesis < 6 → máx. 45",
  thesis_below_10: "tesis < 10 → máx. 55",
  no_check_writer: "no firma cheque → máx. 69",
  requires_traction: "Serie A o exige tracción → máx. 64",
};

export const SCORE_DIMENSIONS: { key: keyof typeof SCORE_MAX; label: string; max: number }[] = [
  { key: "thesis", label: "Tesis y encaje", max: SCORE_MAX.thesis },
  { key: "stage", label: "Etapa y pre-tracción", max: SCORE_MAX.stage },
  { key: "decision", label: "Decisión y capital", max: SCORE_MAX.decision },
  { key: "spanish", label: "Español y cercanía", max: SCORE_MAX.spanish },
  { key: "access", label: "Acceso y actividad", max: SCORE_MAX.access },
];
