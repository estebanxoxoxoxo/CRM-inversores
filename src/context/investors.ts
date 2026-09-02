import { createContext, useContext } from "react";
import type { DataError, InvalidDocument } from "../lib/investors";
import type { Investor } from "../types/investor";

export interface InvestorsState {
  status: "loading" | "ready" | "error";
  investors: Investor[];
  invalid: InvalidDocument[];
  error: DataError | null;
}

export const INITIAL_STATE: InvestorsState = { status: "loading", investors: [], invalid: [], error: null };

export const InvestorsContext = createContext<InvestorsState>(INITIAL_STATE);

export function useInvestors(): InvestorsState {
  return useContext(InvestorsContext);
}
