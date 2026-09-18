/** Section "Perfiles ya evaluados": every investor already in `gold`, passing or not, so none is evaluated twice. */
import type { Evaluation } from "../../types/gold";
import type { Term } from "../types/term";

export const NONE = "Todavía no hay ninguno: este es el primer lote.";

export const excludedLine = (evaluation: Evaluation): string => `- ${evaluation.name} · ${evaluation.investorId}`;

export const excluded: Term = {
  id: "excluded",
  title: (ctx) => `Perfiles ya evaluados (${ctx.excluded.length}; no los repitas)`,
  render: (ctx) => (ctx.excluded.length ? ctx.excluded.map(excludedLine).join("\n") : NONE),
};
