/**
 * "Buscar más perfiles" prompt, built in six steps, one file each:
 *
 *   1. ask.ts         what we ask the model (text under ask/)
 *   2. type.ts        the investor type, embedded verbatim
 *   3. exclusions.ts  every existing investor, so none is repeated
 *   4. examples.ts    the best profiles, as the quality bar
 *   5. endpoint.ts    where to send the result (URL and token from the environment)
 *   6. build.ts       joins all of the above, literally, into the final string
 *
 * Parameters live in config.ts. This entry point gathers the inputs (investors from the app, count from the dialog)
 * and runs the build.
 */
import type { Investor } from "../types/investor";
import { buildPrompt, clampCount } from "./build";
import { DEFAULT_COUNT } from "./config";
import { ingestEndpoint, ingestToken, tokenOrPlaceholder } from "./endpoint";
import { selectExamples } from "./examples";

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
  const text = buildPrompt({ count, investors, endpoint, token: tokenOrPlaceholder(token), date: new Date().toISOString().slice(0, 10) });
  return { text, count, excluded: investors.length, examples: selectExamples(investors).length, endpoint, hasToken: Boolean(token) };
}
