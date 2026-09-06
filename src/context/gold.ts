import { createContext, useContext } from "react";
import type { Evaluation } from "../gold/types/gold";
import type { DataError, InvalidDocument } from "../lib/investors";

export interface GoldState {
  status: "loading" | "ready" | "error";
  /** Every evaluation, both verdicts, newest first. */
  evaluations: Evaluation[];
  invalid: InvalidDocument[];
  error: DataError | null;
}

export const INITIAL_GOLD_STATE: GoldState = { status: "loading", evaluations: [], invalid: [], error: null };

export const GoldContext = createContext<GoldState>(INITIAL_GOLD_STATE);

export function useGold(): GoldState {
  return useContext(GoldContext);
}
