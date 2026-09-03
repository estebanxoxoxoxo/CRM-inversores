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
 * Move a term here and every heading and cross-reference follows (see numbering.ts).
 */
import { numberTerms, sectionNumberOf } from "./numbering";
import { context } from "./terms/context";
import { discovery } from "./terms/discovery";
import { endpoint } from "./terms/endpoint";
import { examples } from "./terms/examples";
import { exclusions } from "./terms/exclusions";
import { footer } from "./terms/footer";
import { opening } from "./terms/opening";
import { request } from "./terms/request";
import { research } from "./terms/research";
import { rubric } from "./terms/rubric";
import { type } from "./terms/type";
import type { PromptContext, PromptInput, Term, TermId } from "./types";

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
