/** Section "Ejemplos de evaluaciones": the most recent evaluations carrying their facts, as JSON, the standard the batch has to match. */
import { REGION_ASPECTS, asksLanguageAspects, type Evaluation } from "../../types/gold";
import { codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const INTRO = "Son el estándar esperado. Fijate en lo concreto de cada `reason`, en las URL de `sources` y en lo seco de cada hecho de `relatedFacts`.";

export const empty = (ctx: PromptContext): string =>
  `Todavía no hay ninguna evaluación con hechos relacionados: el tipo de la sección ${ctx.sectionNumber("type")} y las reglas de este documento son toda la referencia.`;

/**
 * The example as the rule stands today. An evaluation written before the region rule carries `spanish` and
 * `hispanicFounders` outside the United States, and showing it that way would teach the agent a shape the endpoint
 * now refuses. The stored document is untouched: only what the prompt shows is brought up to date.
 */
export function forCurrentRule(evaluation: Evaluation): Evaluation {
  if (asksLanguageAspects(evaluation.region)) return evaluation;
  const aspects = { ...evaluation.aspects };
  for (const key of REGION_ASPECTS) aspects[key] = null;
  return { ...evaluation, aspects };
}

export const exampleBlock = (evaluation: Evaluation): string => codeBlock("json", JSON.stringify(forCurrentRule(evaluation), null, 2));

export const examples: Term = {
  id: "examples",
  title: (ctx) => `Ejemplos de evaluaciones (las ${ctx.examples.length} más recientes)`,
  render: (ctx) => (ctx.examples.length ? paragraphs(INTRO, ctx.examples.map(exampleBlock).join("\n\n")) : empty(ctx)),
};
