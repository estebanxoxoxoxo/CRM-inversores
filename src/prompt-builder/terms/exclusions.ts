/** Term "Perfiles excluidos": every investor already in the database, one line each, so none is repeated. */
import type { Investor } from "../../types/investor";
import type { Term } from "../types/term";

export const NO_LINKEDIN = "sin LinkedIn";
export const NO_EMAIL = "sin email";

export const exclusionLine = (investor: Investor): string => `- ${investor.name} · ${investor.linkedin || NO_LINKEDIN} · ${investor.email || NO_EMAIL}`;

export const exclusions: Term = {
  id: "exclusions",
  title: (ctx) => `Perfiles excluidos (${ctx.investors.length} ya en la base; no los repitas ni los envíes)`,
  render: (ctx) => ctx.investors.map(exclusionLine).join("\n"),
};
