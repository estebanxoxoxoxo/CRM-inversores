/**
 * "Evaluar más perfiles" prompt.
 *
 *   inputs/   where each input comes from: count (dialog), environment (endpoint URL and token, shared with the
 *             research prompt), type-source (the gold type file, embedded through Vite's `?raw`), date. The investors
 *             and the evaluations come from the app's live subscriptions.
 *   terms/    one file per piece of the prompt, every paragraph an exported constant
 *   build/    the aggregator (build.ts) and the numbering of sections with cross-references (numbering.ts)
 *   format/   Markdown helpers shared by the terms
 *   types/    Term and TermId (term.ts), PromptInput and PromptContext (prompt.ts)
 *
 * This entry point gathers the inputs and runs the build.
 */
import type { Investor } from "../../bronze/types/investor";
import { evaluatedIds, latestGold } from "../lib/gold";
import { EXAMPLES_COUNT, type Evaluation } from "../types/gold";
import { buildPrompt } from "./build/build";
import { DEFAULT_BATCH, clampBatch } from "./inputs/count";
import { today } from "./inputs/date";
import { appUrl, ingestEndpoint, ingestToken, tokenOrPlaceholder } from "./inputs/environment";
import { TYPE_SOURCE } from "./inputs/type-source";

export { DEFAULT_BATCH, MAX_BATCH } from "./inputs/count";

export interface GoldPromptOptions {
  /** Investors in the batch: the head of the unevaluated remainder. */
  count: number;
}

export interface GoldPrompt {
  text: string;
  /** Investors in this batch. */
  batch: number;
  /** Investors still unevaluated after this batch. */
  remaining: number;
  /** Gold documents shown as examples. */
  examples: number;
  /** Investors already evaluated, both verdicts. */
  excluded: number;
  endpoint: string;
  hasToken: boolean;
  /** Whether VITE_APP_URL is configured; without it the endpoint in the prompt is unusable. */
  hasEndpoint: boolean;
}

/** Investors with no document in `gold` yet, in the order the app holds them: level descending, then name. */
export function remainder(investors: Investor[], evaluations: Evaluation[]): Investor[] {
  const evaluated = evaluatedIds(evaluations);
  return investors.filter((investor) => !evaluated.has(investor.id));
}

export function buildGoldPrompt(investors: Investor[], evaluations: Evaluation[], options: GoldPromptOptions = { count: DEFAULT_BATCH }): GoldPrompt {
  const pending = remainder(investors, evaluations);
  const batch = pending.slice(0, clampBatch(options.count));
  const examples = latestGold(evaluations, EXAMPLES_COUNT);
  const token = ingestToken();
  const endpoint = ingestEndpoint();
  const text = buildPrompt({ batch, examples, excluded: evaluations, endpoint, token: tokenOrPlaceholder(token), typeSource: TYPE_SOURCE, date: today() });
  return {
    text,
    batch: batch.length,
    remaining: pending.length - batch.length,
    examples: examples.length,
    excluded: evaluations.length,
    endpoint,
    hasToken: Boolean(token),
    hasEndpoint: Boolean(appUrl()),
  };
}
