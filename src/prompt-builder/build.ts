/**
 * Step 6 — the build: joins every part, literally and in this order, into the final Markdown string.
 *
 *   opening (ask/intro)
 *   1. El pedido                     ask
 *   2. Contexto y criterio de pureza ask
 *   3. Descubrimiento                ask
 *   4. Investigación profunda        ask
 *   5. Rúbrica                       ask
 *   6. Formato de salida             type
 *   7. Envío: endpoint               endpoint
 *   8. Perfiles excluidos            exclusions
 *   9. Perfiles de ejemplo           examples
 *   footer: generation date
 *
 * Sections are numbered here, so reordering SECTIONS renumbers headings and every cross-reference ("sección 6").
 */
import type { Investor } from "../types/investor";
import { ASK_SECTIONS, renderOpening } from "./ask";
import { DEFAULT_COUNT, MAX_COUNT } from "./config";
import { endpointSection } from "./endpoint";
import { examplesSection } from "./examples";
import { exclusionsSection } from "./exclusions";
import { typeSection } from "./type";
import type { PromptContext, PromptSection, SectionId } from "./types";

export const SECTIONS: readonly PromptSection[] = [...ASK_SECTIONS, typeSection, endpointSection, exclusionsSection, examplesSection];

export const footer = (date: string): string => `Documento generado el ${date}.`;

export interface BuildInput {
  count: number;
  investors: Investor[];
  endpoint: string;
  token: string;
  date: string;
}

export const clampCount = (count: number): number => Math.min(Math.max(1, Math.trunc(count) || DEFAULT_COUNT), MAX_COUNT);

export function createContext(input: BuildInput): PromptContext {
  const numbers = new Map<SectionId, number>(SECTIONS.map((section, index) => [section.id, index + 1]));
  return {
    ...input,
    count: clampCount(input.count),
    sectionNumber: (id) => {
      const number = numbers.get(id);
      if (!number) throw new Error(`Unknown prompt section: ${id}`);
      return number;
    },
  };
}

export function buildPrompt(input: BuildInput): string {
  const ctx = createContext(input);
  const sections = SECTIONS.map((section) => `## ${ctx.sectionNumber(section.id)}. ${section.title(ctx)}\n\n${section.render(ctx)}`);
  return [renderOpening(ctx), ...sections, footer(ctx.date)].join("\n\n") + "\n";
}
