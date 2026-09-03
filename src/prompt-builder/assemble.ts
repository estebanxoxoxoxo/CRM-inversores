/**
 * Turns the sections into one Markdown document: intro, numbered sections, footer. Pure: no environment access, so
 * it can run in Node for previews and checks.
 */
import type { Investor } from "../types/investor";
import { DEFAULT_COUNT, MAX_COUNT } from "./config";
import { renderFooter } from "./sections/footer";
import { renderIntro } from "./sections/intro";
import { SECTIONS } from "./sections";
import type { PromptContext, SectionId } from "./types";

export interface AssembleInput {
  count: number;
  investors: Investor[];
  endpoint: string;
  token: string;
  date: string;
  typeSource: string;
}

export const clampCount = (count: number): number => Math.min(Math.max(1, Math.trunc(count) || DEFAULT_COUNT), MAX_COUNT);

export function createContext(input: AssembleInput): PromptContext {
  const numbers = new Map<SectionId, number>(SECTIONS.map((section, index) => [section.id, index + 1]));
  return {
    ...input,
    count: clampCount(input.count),
    typeSource: input.typeSource.trim(),
    sectionNumber: (id) => {
      const number = numbers.get(id);
      if (!number) throw new Error(`Unknown prompt section: ${id}`);
      return number;
    },
  };
}

export function assemblePrompt(input: AssembleInput): string {
  const ctx = createContext(input);
  const body = SECTIONS.map((section) => `## ${ctx.sectionNumber(section.id)}. ${section.title(ctx)}\n\n${section.render(ctx)}`);
  return [renderIntro(ctx), ...body, renderFooter(ctx)].join("\n\n") + "\n";
}
