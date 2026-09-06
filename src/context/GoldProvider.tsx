import { useEffect, useState, type ReactNode } from "react";
import { subscribeToGold } from "../lib/gold";
import { GoldContext, INITIAL_GOLD_STATE, type GoldState } from "./gold";

/** Subscribes to the `gold` collection for the life of the app and exposes it through `useGold()`. */
export default function GoldProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GoldState>(INITIAL_GOLD_STATE);

  useEffect(() => {
    return subscribeToGold(
      ({ evaluations, invalid }) => setState({ status: "ready", evaluations, invalid, error: null }),
      (error) => setState({ status: "error", evaluations: [], invalid: [], error }),
    );
  }, []);

  return <GoldContext value={state}>{children}</GoldContext>;
}
