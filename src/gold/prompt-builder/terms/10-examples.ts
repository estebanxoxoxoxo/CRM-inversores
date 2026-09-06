/** Section "Ejemplos de documentos gold": recent gold documents as JSON, the standard the batch has to match. */
import type { Evaluation } from "../../types/gold";
import { codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const INTRO = "Son el estándar esperado. Fijate en lo concreto de cada `reason`, en las URL de `sources` y en la evidencia sobre la que se apoya cada mail.";

export const empty = (ctx: PromptContext): string =>
  `Todavía no hay documentos gold: el tipo de la sección ${ctx.sectionNumber("type")} y las reglas de este documento son toda la referencia.`;

export const exampleBlock = (evaluation: Evaluation): string => codeBlock("json", JSON.stringify(evaluation, null, 2));

export const examples: Term = {
  id: "examples",
  title: (ctx) => `Ejemplos de documentos gold (los ${ctx.examples.length} más recientes)`,
  render: (ctx) => (ctx.examples.length ? paragraphs(INTRO, ctx.examples.map(exampleBlock).join("\n\n")) : empty(ctx)),
};
