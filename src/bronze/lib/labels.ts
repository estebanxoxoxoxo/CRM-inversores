/** Spanish UI labels for the English codes of the investor type. Everything the user reads about an investor comes from here. */
import { BAND_THRESHOLDS, CAP_RULES, SCORE_TOTAL_MAX, SCORE_WEIGHTS, type ScoreDimension, type Band, type Cap, type Confidence, type ConnectionState, type EmailStatus, type InvestorType, type Rating, type Region } from "../types/investor";

export const RATING_LABELS: Record<Rating, string> = {
  approved: "Aprobado",
  doubtful: "Dudoso",
  rejected: "Desaprobado",
  filler: "Relleno",
};

export const CONNECTION_LABELS: Record<ConnectionState, string> = {
  requested: "Conexión pedida",
  accepted: "Conexión aceptada",
};
export const CONNECTION_NONE_LABEL = "Ninguno";

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

/** Scores are shown with a comma decimal, and without decimals when whole. */
export const formatScore = (value: number): string => value.toLocaleString("es-AR", { maximumFractionDigits: 1 });

export const CAP_LABELS: Record<Cap, string> = {
  thesis_below_6: `tesis < ${formatScore(CAP_RULES.thesis_below_6.below)} → máx. ${CAP_RULES.thesis_below_6.max}`,
  thesis_below_10: `tesis < ${formatScore(CAP_RULES.thesis_below_10.below)} → máx. ${CAP_RULES.thesis_below_10.max}`,
  no_check_writer: `no firma cheque (decisión ≤ ${formatScore(CAP_RULES.no_check_writer.atMost)}) → máx. ${CAP_RULES.no_check_writer.max}`,
  requires_traction: `Serie A o exige tracción (etapa ≤ ${formatScore(CAP_RULES.requires_traction.atMost)}) → máx. ${CAP_RULES.requires_traction.max}`,
};

export const SCORE_DIMENSION_LABELS: Record<ScoreDimension, string> = {
  thesis: "Tesis y encaje",
  stage: "Etapa y pre-tracción",
  decision: "Decisión y capital",
  spanish: "Español y cercanía",
  access: "Acceso y actividad",
};

export const scoreWeightLabel = (dimension: ScoreDimension): string => `${SCORE_WEIGHTS[dimension]}%`;
