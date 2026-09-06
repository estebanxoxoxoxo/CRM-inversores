/**
 * Term "Perfiles de ejemplo": the best profiles as full JSON, the quality bar. The selection rules live here:
 * reviewed, level above EXAMPLE_MIN_LEVEL, and not rated rejected or filler by the team.
 */
import type { Investor, Rating } from "../../types/investor";
import { codeBlock, paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

/** A profile is an example when its level is strictly above this. */
export const EXAMPLE_MIN_LEVEL = 80;
/** Profiles with these team ratings are never used as examples. */
export const EXAMPLE_EXCLUDED_RATINGS: readonly Rating[] = ["rejected", "filler"];

export const INTRO =
  "Son el estándar de calidad esperado. Fijate en la concreción de `deepResearch`, en las listas breves de `whyInteresting`, " +
  "`investmentThesis` y `stageAndTicket`, en la procedencia de cada vía de contacto y en el motivo de la auditoría.";

export const isExample = (investor: Investor): boolean =>
  investor.audit.status === "reviewed" && investor.level > EXAMPLE_MIN_LEVEL && !(investor.rating && EXAMPLE_EXCLUDED_RATINGS.includes(investor.rating));

export const selectExamples = (investors: Investor[]): Investor[] => investors.filter(isExample);

/** The profile as JSON, without the write timestamp. */
export const exampleBlock = (investor: Investor): string => {
  const { updatedAt: _updatedAt, ...profile } = investor;
  void _updatedAt;
  return codeBlock("json", JSON.stringify(profile, null, 2));
};

export const examples: Term = {
  id: "examples",
  title: (ctx) => `Perfiles de ejemplo (nivel superior a ${EXAMPLE_MIN_LEVEL}, ${selectExamples(ctx.investors).length} perfiles)`,
  render: (ctx) => paragraphs(INTRO, selectExamples(ctx.investors).map(exampleBlock).join("\n\n")),
};
