/** Section "Ejemplos de documentos gold": recent gold documents as JSON, the standard the batch has to match. */
import { REGION_ASPECTS, US_REGION, type Evaluation } from "../../types/gold";
import { codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const INTRO = "Son el estándar esperado. Fijate en lo concreto de cada `reason`, en las URL de `sources` y en la evidencia sobre la que se apoya cada mail.";

export const empty = (ctx: PromptContext): string =>
  `Todavía no hay documentos gold: el tipo de la sección ${ctx.sectionNumber("type")} y las reglas de este documento son toda la referencia.`;

/**
 * The example as the rule stands today. An evaluation written before the region rule carries `spanish` and
 * `hispanicFounders` outside the United States, and showing it that way would teach the agent a shape the endpoint
 * now refuses. The stored document is untouched: only what the prompt shows is brought up to date.
 */
export function forCurrentRule(evaluation: Evaluation): Evaluation {
  if (evaluation.region === US_REGION) return evaluation;
  const aspects = { ...evaluation.aspects };
  for (const key of REGION_ASPECTS) aspects[key] = null;
  return { ...evaluation, aspects };
}

export const exampleBlock = (evaluation: Evaluation): string => codeBlock("json", JSON.stringify(forCurrentRule(evaluation), null, 2));

export const examples: Term = {
  id: "examples",
  title: (ctx) => `Ejemplos de documentos gold (los ${ctx.examples.length} más recientes)`,
  render: (ctx) => (ctx.examples.length ? paragraphs(INTRO, ctx.examples.map(exampleBlock).join("\n\n")) : empty(ctx)),
};
