/**
 * Section "Perfiles a evaluar": the batch, one JSON block per investor, in the order the app holds them.
 *
 * Each block is the profile whole, every field, compact on one line: the profile is a lead for the research and
 * nothing in it is left out so no evidence gets lost.
 */
import type { Investor } from "../../../bronze/types/investor";
import { paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const intro = (count: number): string =>
  `Los primeros ${count} del remanente sin evaluar, ordenados por nivel. Cada perfil sale de nuestra base tal cual está guardado; verificá todo en la web.`;

export const investorBlock = (investor: Investor): string => "```json\n" + JSON.stringify(investor) + "\n```";

export const batch: Term = {
  id: "batch",
  title: (ctx) => `Perfiles a evaluar (lote de ${ctx.batch.length})`,
  render: (ctx) => paragraphs(intro(ctx.batch.length), ctx.batch.map(investorBlock).join("\n\n")),
};
