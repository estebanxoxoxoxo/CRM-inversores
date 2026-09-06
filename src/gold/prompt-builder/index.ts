/**
 * "Evaluación de inversores gold" prompt.
 *
 *   inputs/   where each input comes from: environment (endpoint URL and token), type-source (the gold type file),
 *             date. The batch and the gold documents come from the database, read by the console script.
 *   terms/    one file per piece of the prompt, every paragraph an exported constant
 *   build/    the aggregator (build.ts) and the numbering of sections with cross-references (numbering.ts)
 *   format/   Markdown helpers shared by the terms
 *   types/    Term and TermId (term.ts), PromptInput and PromptContext (prompt.ts)
 *
 * This entry point gathers the inputs and runs the build.
 */
import { EXAMPLES_COUNT, type Evaluation } from "../types/gold";
import type { InvestorDigest } from "../types/investor";
import { latestGold } from "../lib/gold";
import { buildPrompt } from "./build/build";
import { today } from "./inputs/date";
import { appUrl, ingestEndpoint, ingestToken, tokenOrPlaceholder } from "./inputs/environment";
import { readTypeSource } from "./inputs/type-source";

export interface GoldPrompt {
  text: string;
  /** Investors in this batch. */
  batch: number;
  /** Gold documents shown as examples. */
  examples: number;
  /** Investors already evaluated, both verdicts. */
  excluded: number;
  endpoint: string;
  hasToken: boolean;
  /** Whether VITE_APP_URL is configured; without it the endpoint in the prompt is unusable. */
  hasEndpoint: boolean;
}

export function buildGoldPrompt(batch: InvestorDigest[], gold: Evaluation[]): GoldPrompt {
  const examples = latestGold(gold, EXAMPLES_COUNT);
  const token = ingestToken();
  const endpoint = ingestEndpoint();
  const text = buildPrompt({ batch, examples, excluded: gold, endpoint, token: tokenOrPlaceholder(token), typeSource: readTypeSource(), date: today() });
  return { text, batch: batch.length, examples: examples.length, excluded: gold.length, endpoint, hasToken: Boolean(token), hasEndpoint: Boolean(appUrl()) };
}
