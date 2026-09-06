/** Input: the generation date, YYYY-MM-DD. */

export const today = (): string => new Date().toISOString().slice(0, 10);
