import type { Investor } from "../types/investor";

/** Every term of the prompt, in document order. Numbered terms carry a title; opening and footer do not. */
export type TermId = "opening" | "request" | "context" | "discovery" | "research" | "rubric" | "type" | "endpoint" | "exclusions" | "examples" | "footer";

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

/** One piece of the prompt. The aggregator (build.ts) renders every term in order and joins them literally. */
export interface Term {
  id: TermId;
  /** Heading without the number. Present only on numbered terms. */
  title?: (ctx: PromptContext) => string;
  /** Body in Markdown, without the heading. */
  render: (ctx: PromptContext) => string;
}
