import type { PromptContext } from "./prompt";

/** Every term of the prompt, in document order. Numbered terms carry a title; opening and footer do not. */
export type TermId = "opening" | "client" | "aspects" | "justifications" | "emails" | "type" | "endpoint" | "batch" | "excluded" | "examples" | "footer";

/** One piece of the prompt. The aggregator (build.ts) renders every term in order and joins them literally. */
export interface Term {
  id: TermId;
  /** Heading without the number. Present only on numbered terms. */
  title?: (ctx: PromptContext) => string;
  /** Body in Markdown, without the heading. */
  render: (ctx: PromptContext) => string;
}
