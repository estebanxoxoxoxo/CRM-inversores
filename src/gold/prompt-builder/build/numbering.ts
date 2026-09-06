/**
 * Section numbers and cross-references. Numbered terms (those with a title) get 1, 2, 3… in the order they appear in
 * the aggregator; the context's `sectionNumber` lets one term refer to another ("el tipo de la sección 5") without
 * hardcoding the number, so reordering the terms renumbers headings and references together.
 */
import type { Term, TermId } from "../types/term";

export function numberTerms(terms: readonly Term[]): Map<TermId, number> {
  const numbers = new Map<TermId, number>();
  for (const term of terms) if (term.title) numbers.set(term.id, numbers.size + 1);
  return numbers;
}

export function sectionNumberOf(numbers: Map<TermId, number>): (id: TermId) => number {
  return (id) => {
    const number = numbers.get(id);
    if (number === undefined) throw new Error(`"${id}" is not a numbered section of the prompt`);
    return number;
  };
}
