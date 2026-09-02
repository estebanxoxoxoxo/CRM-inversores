/**
 * Builds the "find more investors" prompt: the research brief with the exact type source, the ingest endpoint,
 * every existing investor as an exclusion and the top profiles as examples. The static text lives in
 * src/prompt/research-brief.md; placeholders are filled from the live collection.
 */
import brief from "../prompt/research-brief.md?raw";
import typeSource from "../types/investor.ts?raw";
import type { Investor } from "../types/investor";

export const EXAMPLE_MIN_LEVEL = 80;
export const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";

export interface ResearchPrompt {
  text: string;
  excluded: number;
  examples: number;
  endpoint: string;
  hasToken: boolean;
}

export function ingestEndpoint(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
  return `${base.replace(/\/+$/, "")}/api/investors`;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, () => value), template);
}

export function buildResearchPrompt(investors: Investor[]): ResearchPrompt {
  const token = (import.meta.env.VITE_INGEST_TOKEN as string | undefined) || "";
  const endpoint = ingestEndpoint();
  const excluded = investors.map((i) => `- ${i.name} · ${i.linkedin || "sin LinkedIn"} · ${i.email || "sin email"}`);
  const examples = investors
    .filter((i) => i.audit.status === "reviewed" && i.level > EXAMPLE_MIN_LEVEL)
    .map((investor) => {
      const { updatedAt: _updatedAt, ...profile } = investor;
      void _updatedAt;
      return "```json\n" + JSON.stringify(profile, null, 2) + "\n```";
    });
  const text = fill(brief, {
    TYPE_SOURCE: typeSource.trim(),
    ENDPOINT: endpoint,
    TOKEN: token || MISSING_TOKEN,
    EXCLUDED_COUNT: String(excluded.length),
    EXCLUDED: excluded.join("\n"),
    EXAMPLES_COUNT: String(examples.length),
    EXAMPLES: examples.join("\n\n"),
    DATE: new Date().toISOString().slice(0, 10),
  });
  return { text, excluded: excluded.length, examples: examples.length, endpoint, hasToken: Boolean(token) };
}
