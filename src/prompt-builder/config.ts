/** Tunable parameters of the research prompt. Everything else is text (sections/) or derived from the type. */
import type { Rating } from "../types/investor";

/** Investors requested per category when the dialog is left empty. */
export const DEFAULT_COUNT = 30;
/** Upper bound accepted from the dialog. */
export const MAX_COUNT = 500;
/** A profile is used as an example when its level is strictly above this. */
export const EXAMPLE_MIN_LEVEL = 80;
/** Profiles with these team ratings are never used as examples. */
export const EXAMPLE_EXCLUDED_RATINGS: readonly Rating[] = ["rejected", "filler"];
/** Shown in place of the token when VITE_INGEST_TOKEN is not configured. */
export const MISSING_TOKEN = "<VITE_INGEST_TOKEN no configurado>";
