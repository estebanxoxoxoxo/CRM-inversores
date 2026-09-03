/** Closing line. Not numbered. */
import type { PromptContext } from "../types";

export const generatedOn = (date: string): string => `Documento generado el ${date}.`;

export function renderFooter(ctx: PromptContext): string {
  return generatedOn(ctx.date);
}
