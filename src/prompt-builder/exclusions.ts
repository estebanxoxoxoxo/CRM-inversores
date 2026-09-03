/**
 * Step 3 — the exclusions: every investor already in the database, one line each with name, LinkedIn and email, so
 * none is researched or sent twice. The investors come from the app's live subscription.
 */
import type { Investor } from "../types/investor";
import type { PromptSection } from "./types";

export const NO_LINKEDIN = "sin LinkedIn";
export const NO_EMAIL = "sin email";

export const exclusionLine = (investor: Investor): string => `- ${investor.name} · ${investor.linkedin || NO_LINKEDIN} · ${investor.email || NO_EMAIL}`;

export const renderExclusions = (investors: Investor[]): string => investors.map(exclusionLine).join("\n");

export const exclusionsSection: PromptSection = {
  id: "exclusions",
  title: (ctx) => `Perfiles excluidos (${ctx.investors.length} ya en la base; no los repitas ni los envíes)`,
  render: (ctx) => renderExclusions(ctx.investors),
};
