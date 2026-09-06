/**
 * The aggregator. TERMS lists every piece of the prompt in document order; `buildPrompt` renders each one with the
 * same context and joins them literally, separated by a blank line. Numbered terms get their heading here.
 *
 *   opening                        title and opening paragraph
 *   1. client                      who the emails speak for
 *   2. aspects                     the four aspects and the verdict rule
 *   3. justifications              what a reason must contain
 *   4. emails                      the four cold emails of a gold profile
 *   5. type                        the gold type, embedded verbatim
 *   6. endpoint                    where the evaluations are sent
 *   7. batch                       the investors to evaluate
 *   8. excluded                    the investors already evaluated
 *   9. examples                    recent gold documents
 *   footer                         generation date
 *
 * The files in terms/ carry the same order as a numeric prefix (01-opening … 11-footer). Move a term here and every
 * heading and cross-reference follows (see numbering.ts, next to this file).
 */
import { numberTerms, sectionNumberOf } from "./numbering";
import { aspects } from "../terms/03-aspects";
import { batch } from "../terms/08-batch";
import { client } from "../terms/02-client";
import { emails } from "../terms/05-emails";
import { endpoint } from "../terms/07-endpoint";
import { examples } from "../terms/10-examples";
import { excluded } from "../terms/09-excluded";
import { footer } from "../terms/11-footer";
import { justifications } from "../terms/04-justifications";
import { opening } from "../terms/01-opening";
import { type } from "../terms/06-type";
import type { PromptContext, PromptInput } from "../types/prompt";
import type { Term, TermId } from "../types/term";

export const TERMS: readonly Term[] = [opening, client, aspects, justifications, emails, type, endpoint, batch, excluded, examples, footer];

function renderTerm(term: Term, ctx: PromptContext, numbers: Map<TermId, number>): string {
  const body = term.render(ctx);
  return term.title ? `## ${numbers.get(term.id)}. ${term.title(ctx)}\n\n${body}` : body;
}

export function buildPrompt(input: PromptInput): string {
  const numbers = numberTerms(TERMS);
  const ctx: PromptContext = { ...input, sectionNumber: sectionNumberOf(numbers) };
  return TERMS.map((term) => renderTerm(term, ctx, numbers)).join("\n\n") + "\n";
}
