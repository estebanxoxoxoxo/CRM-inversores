import { useEffect, useState, type ReactNode } from "react";
import { subscribeToInvestors } from "../lib/investors";
import { INITIAL_STATE, InvestorsContext, type InvestorsState } from "./investors";

/** Subscribes to the `investors` collection for the life of the app and exposes it through `useInvestors()`. */
export default function InvestorsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvestorsState>(INITIAL_STATE);

  useEffect(() => {
    return subscribeToInvestors(
      ({ investors, invalid }) => setState({ status: "ready", investors, invalid, error: null }),
      (error) => setState({ status: "error", investors: [], invalid: [], error }),
    );
  }, []);

  return <InvestorsContext value={state}>{children}</InvestorsContext>;
}
