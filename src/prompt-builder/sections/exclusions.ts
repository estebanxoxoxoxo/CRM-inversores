/** Section "Perfiles excluidos": every investor already in the database, so none is researched or sent twice. */
import type { Investor } from "../../types/investor";
import type { PromptSection } from "../types";

export const NO_LINKEDIN = "sin LinkedIn";
export const NO_EMAIL = "sin email";

export const exclusionLine = (investor: Investor): string => `- ${investor.name} · ${investor.linkedin || NO_LINKEDIN} · ${investor.email || NO_EMAIL}`;

export const exclusionsSection: PromptSection = {
  id: "exclusions",
  title: (ctx) => `Perfiles excluidos (${ctx.investors.length} ya en la base; no los repitas ni los envíes)`,
  render: (ctx) => ctx.investors.map(exclusionLine).join("\n"),
};
