import type { Investor } from "../types/investor";

/** Stable ids of the numbered sections. Other sections refer to them through `PromptContext.sectionNumber`. */
export type SectionId = "request" | "context" | "discovery" | "research" | "rubric" | "output" | "endpoint" | "exclusions" | "examples";

/** Everything a section may need. Built once per prompt by the assembler; sections are pure functions of it. */
export interface PromptContext {
  /** How many undisputed and how many high-potential investors are requested. */
  count: number;
  /** Every investor in the database, used for exclusions and examples. */
  investors: Investor[];
  /** Full URL of the ingest endpoint. */
  endpoint: string;
  /** Bearer token for the endpoint, or the placeholder when it is not configured. */
  token: string;
  /** Generation date, YYYY-MM-DD. */
  date: string;
  /** Source code of src/types/investor.ts, embedded verbatim. */
  typeSource: string;
  /** Number of a section in the final document, so cross-references survive reordering. */
  sectionNumber: (id: SectionId) => number;
}

export interface PromptSection {
  id: SectionId;
  /** Heading without the number. May depend on the context (counts). */
  title: (ctx: PromptContext) => string;
  /** Body in Markdown, without the heading. */
  render: (ctx: PromptContext) => string;
}
