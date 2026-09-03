/** Section "Perfiles de ejemplo": the best reviewed profiles, as full JSON, to show the expected quality. */
import type { Investor } from "../../types/investor";
import { EXAMPLE_EXCLUDED_RATINGS, EXAMPLE_MIN_LEVEL } from "../config";
import { codeBlock, paragraphs } from "../format";
import type { PromptSection } from "../types";

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

export const examplesSection: PromptSection = {
  id: "examples",
  title: (ctx) => `Perfiles de ejemplo (nivel superior a ${EXAMPLE_MIN_LEVEL}, ${selectExamples(ctx.investors).length} perfiles)`,
  render: (ctx) => paragraphs(INTRO, selectExamples(ctx.investors).map(exampleBlock).join("\n\n")),
};
