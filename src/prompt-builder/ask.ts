/**
 * Step 1 — the ask: everything we tell the model to do. The opening paragraph plus five numbered sections, one file
 * per topic under ask/, every paragraph an exported constant so a change touches one idea.
 *
 *   ask/intro.ts      title and opening paragraph (role, objective, what the document contains)
 *   ask/request.ts    "El pedido": the founder's request
 *   ask/context.ts    "Contexto del cliente y criterio de pureza"
 *   ask/discovery.ts  "Descubrimiento de candidatos"
 *   ask/research.ts   "Investigación profunda de cada persona seleccionada"
 *   ask/rubric.ts     "Rúbrica de auditoría": weights, caps and bands read from the type
 */
import { contextSection } from "./ask/context";
import { discoverySection } from "./ask/discovery";
import { renderIntro } from "./ask/intro";
import { requestSection } from "./ask/request";
import { researchSection } from "./ask/research";
import { rubricSection } from "./ask/rubric";
import type { PromptSection } from "./types";

export const renderOpening = renderIntro;

export const ASK_SECTIONS: readonly PromptSection[] = [requestSection, contextSection, discoverySection, researchSection, rubricSection];
