/** Input: how many investors go in the batch. Comes from the dialog; empty or invalid means the default. Capped by what one request accepts. */
import { BATCH_SIZE, MAX_PER_REQUEST } from "../../types/gold";

export const DEFAULT_BATCH = BATCH_SIZE;
export const MAX_BATCH = MAX_PER_REQUEST;

export const clampBatch = (count: number): number => Math.min(Math.max(1, Math.trunc(count) || DEFAULT_BATCH), MAX_BATCH);
