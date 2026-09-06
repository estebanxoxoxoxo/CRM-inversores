/**
 * Section "Perfiles a evaluar": the batch, one JSON block per investor, in the order the reader gave them.
 *
 * Each block is the stored document whole, every field the CRM wrote, compact on one line: the profile is a lead
 * for the research and nothing in it is left out so no evidence gets lost.
 */
import type { InvestorDigest } from "../../types/investor";
import { paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const intro = (count: number): string =>
  `Los primeros ${count} del remanente sin evaluar, ordenados por nivel. Cada perfil sale de nuestra base tal cual está guardado; verificá todo en la web.`;

export const investorBlock = (investor: InvestorDigest): string => "```json\n" + JSON.stringify(investor) + "\n```";

export const batch: Term = {
  id: "batch",
  title: (ctx) => `Perfiles a evaluar (lote de ${ctx.batch.length})`,
  render: (ctx) => paragraphs(intro(ctx.batch.length), ctx.batch.map(investorBlock).join("\n\n")),
};
