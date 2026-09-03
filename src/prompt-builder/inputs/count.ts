/** Input: how many investors are requested, per category. Comes from the dialog; empty or invalid means the default. */

export const DEFAULT_COUNT = 30;
export const MAX_COUNT = 500;

export const clampCount = (count: number): number => Math.min(Math.max(1, Math.trunc(count) || DEFAULT_COUNT), MAX_COUNT);
