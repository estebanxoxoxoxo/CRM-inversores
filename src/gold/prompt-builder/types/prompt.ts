import type { Evaluation } from "../../types/gold";
import type { InvestorDigest } from "../../types/investor";
import type { TermId } from "./term";

/** The inputs of a prompt. Gathered by index.ts from the database (batch, examples, excluded) and the environment (the rest). */
export interface PromptInput {
  /** The investors to evaluate in this run: the head of the unevaluated remainder. */
  batch: InvestorDigest[];
  /** Recent gold documents shown as the quality bar. */
  examples: Evaluation[];
  /** Every evaluated investor, both verdicts, so none is evaluated twice. */
  excluded: Evaluation[];
  /** Full URL of the ingest endpoint. */
  endpoint: string;
  /** Bearer token for the endpoint, or the placeholder when it is not configured. */
  token: string;
  /** Source code of src/types/gold.ts, embedded verbatim. */
  typeSource: string;
  /** Generation date, YYYY-MM-DD. */
  date: string;
}

/** What a term receives when rendering: the inputs plus the numbering, so cross-references survive reordering. */
export interface PromptContext extends PromptInput {
  /** Number of a numbered term in the final document. Throws for unnumbered or unknown terms. */
  sectionNumber: (id: TermId) => number;
}
