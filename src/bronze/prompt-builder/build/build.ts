/**
 * The aggregator. TERMS lists every piece of the prompt in document order; `buildPrompt` renders each one with the
 * same context and joins them literally, separated by a blank line. Numbered terms get their heading here.
 *
 *   opening                        title and opening paragraph
 *   1. request                     el pedido
 *   2. context                     contexto del cliente y criterio de pureza
 *   3. discovery                   descubrimiento de candidatos
 *   4. research                    investigación profunda de cada persona
 *   5. rubric                      rúbrica de auditoría, leída del tipo
 *   6. type                        formato de salida: el tipo, incrustado tal cual
 *   7. endpoint                    envío de perfiles
 *   8. exclusions                  perfiles ya en la base
 *   9. examples                    perfiles de ejemplo
 *   footer                         fecha de generación
 *
 * The files in terms/ carry the same order as a numeric prefix (01-opening … 11-footer). Move a term here and every
 * heading and cross-reference follows (see numbering.ts, next to this file).
 */
import { numberTerms, sectionNumberOf } from "./numbering";
import { context } from "../terms/03-context";
import { discovery } from "../terms/04-discovery";
import { endpoint } from "../terms/08-endpoint";
import { examples } from "../terms/10-examples";
import { exclusions } from "../terms/09-exclusions";
import { footer } from "../terms/11-footer";
import { opening } from "../terms/01-opening";
import { request } from "../terms/02-request";
import { research } from "../terms/05-research";
import { rubric } from "../terms/06-rubric";
import { type } from "../terms/07-type";
import type { PromptContext, PromptInput } from "../types/prompt";
import type { Term, TermId } from "../types/term";

export const TERMS: readonly Term[] = [opening, request, context, discovery, research, rubric, type, endpoint, exclusions, examples, footer];

function renderTerm(term: Term, ctx: PromptContext, numbers: Map<TermId, number>): string {
  const body = term.render(ctx);
  return term.title ? `## ${numbers.get(term.id)}. ${term.title(ctx)}\n\n${body}` : body;
}

export function buildPrompt(input: PromptInput): string {
  const numbers = numberTerms(TERMS);
  const ctx: PromptContext = { ...input, sectionNumber: sectionNumberOf(numbers) };
  return TERMS.map((term) => renderTerm(term, ctx, numbers)).join("\n\n") + "\n";
}
