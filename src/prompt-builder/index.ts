/**
 * "Buscar más perfiles" prompt. Entry point for the app: reads the environment, embeds the type source and assembles
 * the sections. Text lives in sections/, parameters in config.ts, the document order in sections.ts.
 */
import typeSource from "../types/investor.ts?raw";
import type { Investor } from "../types/investor";
import { assemblePrompt, clampCount } from "./assemble";
import { DEFAULT_COUNT } from "./config";
import { ingestEndpoint, ingestToken, tokenOrPlaceholder } from "./environment";
import { selectExamples } from "./sections/examples";

export { DEFAULT_COUNT, MAX_COUNT } from "./config";

export interface PromptOptions {
  /** Undisputed and high-potential investors requested, each. */
  count: number;
}

export interface ResearchPrompt {
  text: string;
  count: number;
  excluded: number;
  examples: number;
  endpoint: string;
  hasToken: boolean;
}

export function buildResearchPrompt(investors: Investor[], options: PromptOptions = { count: DEFAULT_COUNT }): ResearchPrompt {
  const count = clampCount(options.count);
  const token = ingestToken();
  const endpoint = ingestEndpoint();
  const text = assemblePrompt({
    count,
    investors,
    endpoint,
    token: tokenOrPlaceholder(token),
    date: new Date().toISOString().slice(0, 10),
    typeSource,
  });
  return { text, count, excluded: investors.length, examples: selectExamples(investors).length, endpoint, hasToken: Boolean(token) };
}
