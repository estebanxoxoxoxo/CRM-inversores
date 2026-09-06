/** Spanish UI labels for the English codes of the gold type. Everything the user reads about an evaluation comes from here. */
import type { Verdict } from "../types/gold";
import type { AspectKey } from "./filters";

export const VERDICT_LABELS: Record<Verdict, string> = { gold: "Gold", rejected: "Rechazado" };

export const ASPECT_LABELS: Record<AspectKey, string> = {
  stage: "Etapa: pre-seed o seed",
  deepTech: "Deep tech, IA profunda o dev tools",
  spanish: "Habla español",
  hispanicFounders: "Founders hispanos",
};

export const ASPECT_SHORT_LABELS: Record<AspectKey, string> = {
  stage: "Etapa",
  deepTech: "Deep tech",
  spanish: "Español",
  hispanicFounders: "Founders",
};
