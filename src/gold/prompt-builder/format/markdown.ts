/** Markdown helpers shared by the sections. */

/** Paragraphs separated by a blank line; empty ones are skipped. */
export const paragraphs = (...blocks: string[]): string => blocks.filter(Boolean).join("\n\n");

export const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");

export const codeBlock = (language: string, body: string): string => "```" + language + "\n" + body + "\n```";
