import { useEffect, useState, type ReactNode } from "react";
import { subscribeToLists } from "../lib/lists";
import { INITIAL_LISTS_STATE, ListsContext, type ListsState } from "./lists";

/** Subscribes to the `lists` collection for the life of the app and exposes it through `useLists()`. */
export default function ListsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ListsState>(INITIAL_LISTS_STATE);

  useEffect(() => {
    return subscribeToLists(
      ({ lists, invalid }) => setState({ status: "ready", lists, invalid, error: null }),
      (error) => setState({ status: "error", lists: [], invalid: [], error }),
    );
  }, []);

  return <ListsContext value={state}>{children}</ListsContext>;
}
