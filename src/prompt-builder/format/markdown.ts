/** Markdown helpers shared by the sections. */

/** Number with a comma decimal, no decimals when whole: 2.4 → "2,4", 4 → "4". */
export const decimal = (value: number): string => value.toLocaleString("es-AR", { maximumFractionDigits: 1 });

/** Paragraphs separated by a blank line; empty ones are skipped. */
export const paragraphs = (...blocks: string[]): string => blocks.filter(Boolean).join("\n\n");

/** Block quote with one quoted paragraph per item, separated by an empty quoted line. */
export const quote = (items: string[]): string => items.map((item) => `> ${item}`).join("\n>\n");

export const numbered = (items: string[]): string => items.map((item, index) => `${index + 1}. ${item}`).join("\n");

export const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");

export const codeBlock = (language: string, body: string): string => "```" + language + "\n" + body + "\n```";

/** Items in double quotes joined by commas, for lists of example queries. */
export const quotedList = (items: string[]): string => items.map((item) => `"${item}"`).join(", ");
