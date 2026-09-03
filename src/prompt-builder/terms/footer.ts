/** Term: closing line with the generation date. Unnumbered. */
import type { Term } from "../types";

export const generatedOn = (date: string): string => `Documento generado el ${date}.`;

export const footer: Term = {
  id: "footer",
  render: (ctx) => generatedOn(ctx.date),
};
