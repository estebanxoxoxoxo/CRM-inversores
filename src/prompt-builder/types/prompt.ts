import type { Investor } from "../../types/investor";
import type { TermId } from "./term";

/** The inputs of a prompt. Gathered by index.ts from the app (investors, count) and the environment (the rest). */
export interface PromptInput {
  /** How many undisputed and how many high-potential investors are requested. */
  count: number;
  /** Every investor in the database, for exclusions and examples. */
  investors: Investor[];
  /** Full URL of the ingest endpoint. */
  endpoint: string;
  /** Bearer token for the endpoint, or the placeholder when it is not configured. */
  token: string;
  /** Generation date, YYYY-MM-DD. */
  date: string;
  /** Source code of src/types/investor.ts, embedded verbatim. */
  typeSource: string;
}

/** What a term receives when rendering: the inputs plus the numbering, so cross-references survive reordering. */
export interface PromptContext extends PromptInput {
  /** Number of a numbered term in the final document. Throws for unnumbered or unknown terms. */
  sectionNumber: (id: TermId) => number;
}
