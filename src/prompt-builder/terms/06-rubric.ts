/**
 * Section "Rúbrica de auditoría". Weights, caps and bands are read from the type so the prompt can never drift from
 * what the server computes; only the wording lives here.
 */
import { BAND_THRESHOLDS, CAP_RULES, SCORE_MAX, SCORE_TOTAL_MAX, SCORE_WEIGHTS, type ScoreDimension } from "../../types/investor";
import { bullets, decimal, paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const INTRO =
  "Cada perfil lleva una puntuación en `audit.score` y un motivo en `audit.reason` que explique el nivel en términos absolutos: " +
  "encaje y reservas. La auditoría es tuya, no del equipo: la escribís vos al terminar la investigación. " +
  'Si está completa (motivo redactado y las cinco dimensiones puntuadas), `audit.status` va en `"reviewed"`; ' +
  '`"pending"` es sólo para un perfil que dejás a medias, y hace que el nivel no muestre banda ni prioridad. ' +
  "El veredicto del equipo es otra cosa y vive en `rating`, que vos nunca enviás y queda en `null` hasta que una persona lo emita.";

export const scale = (): string =>
  `Cada dimensión se puntúa de 0 a ${SCORE_MAX}, con un decimal como máximo. El nivel (0-${SCORE_TOTAL_MAX}) es el promedio ponderado con estos pesos:`;

/** What each dimension measures. Thresholds quoted inside come from CAP_RULES. */
export const DIMENSION_DESCRIPTIONS: Record<ScoreDimension, () => string> = {
  thesis: () =>
    "tesis explícita en infraestructura de IA, dev tools o deep tech de software, con inversiones documentadas que la respalden. " +
    `Menos de ${decimal(CAP_RULES.thesis_below_10.below)} cuando el foco es adyacente; menos de ${decimal(CAP_RULES.thesis_below_6.below)} cuando no hay evidencia.`,
  stage: () => `invierte en pre-seed o seed, antes de la tracción. ${decimal(CAP_RULES.requires_traction.atMost)} o menos cuando sólo entra en Serie A o exige tracción.`,
  decision: () =>
    `firma el cheque (GP, managing partner, angel con capital propio). ${decimal(CAP_RULES.no_check_writer.atMost)} o menos cuando no decide: principal, venture partner, scout, asociado.`,
  spanish: () => "fluidez en español documentada y cercanía con el ecosistema hispanohablante.",
  access: () => "accesible y activo en 2024-2026: email público, eventos, programas, intros por portfolio.",
};

export const dimensions = (): string =>
  bullets((Object.keys(SCORE_WEIGHTS) as ScoreDimension[]).map((dimension) => `\`${dimension}\` (peso ${SCORE_WEIGHTS[dimension]}): ${DIMENSION_DESCRIPTIONS[dimension]()}`));

export const caps = (): string =>
  "Topes que aplica el servidor sobre el promedio: " +
  [
    `thesis < ${decimal(CAP_RULES.thesis_below_6.below)} → máximo ${CAP_RULES.thesis_below_6.max}`,
    `thesis < ${decimal(CAP_RULES.thesis_below_10.below)} → máximo ${CAP_RULES.thesis_below_10.max}`,
    `decision ≤ ${decimal(CAP_RULES.no_check_writer.atMost)} → máximo ${CAP_RULES.no_check_writer.max}`,
    `stage ≤ ${decimal(CAP_RULES.requires_traction.atMost)} → máximo ${CAP_RULES.requires_traction.max}`,
  ].join("; ") +
  ".";

export const bands = (): string => {
  const t = BAND_THRESHOLDS;
  const highPotential = `${t.high_potential}-${t.undisputed - 1}`;
  return (
    `Bandas resultantes: indiscutible ≥ ${t.undisputed}, alto potencial ${highPotential}, reserva ${t.reserve}-${t.high_potential - 1}, descartado < ${t.reserve}. ` +
    `Los perfiles indiscutibles tienen que quedar, con honestidad, en ${t.undisputed} o más; los de muchísimo potencial en ${highPotential}, con la reserva explicada.`
  );
};

export const rubric: Term = {
  id: "rubric",
  title: () => "Rúbrica de auditoría",
  render: () => paragraphs(INTRO, scale(), dimensions(), `${caps()} ${bands()}`),
};
