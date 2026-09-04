/**
 * "Buscar más perfiles" prompt.
 *
 *   inputs/   where each input comes from: count (dialog), environment (endpoint URL and token), type-source
 *             (the investor type file), date. The investors come from the app's live subscription.
 *   terms/    one file per piece of the prompt, every paragraph an exported constant
 *   build/    the aggregator (build.ts) and the numbering of sections with cross-references (numbering.ts)
 *   format/   Markdown helpers shared by the terms
 *   types/    Term and TermId (term.ts), PromptInput and PromptContext (prompt.ts)
 *
 * This entry point gathers the inputs and runs the build.
 */
import type { Investor } from "../types/investor";
import { buildPrompt } from "./build/build";
import { DEFAULT_COUNT, clampCount } from "./inputs/count";
import { today } from "./inputs/date";
import { ingestEndpoint, ingestToken, tokenOrPlaceholder } from "./inputs/environment";
import { TYPE_SOURCE } from "./inputs/type-source";
import { selectExamples } from "./terms/10-examples";

export { DEFAULT_COUNT, MAX_COUNT } from "./inputs/count";

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
  const text = buildPrompt({ count, investors, endpoint, token: tokenOrPlaceholder(token), date: today(), typeSource: TYPE_SOURCE });
  return { text, count, excluded: investors.length, examples: selectExamples(investors).length, endpoint, hasToken: Boolean(token) };
}
