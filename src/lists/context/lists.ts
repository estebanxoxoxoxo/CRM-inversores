import { createContext, useContext } from "react";
import type { DataError, InvalidDocument } from "../../lib/data";
import type { List } from "../types/list";

export interface ListsState {
  status: "loading" | "ready" | "error";
  /** Every list, by name. */
  lists: List[];
  invalid: InvalidDocument[];
  error: DataError | null;
}

export const INITIAL_LISTS_STATE: ListsState = { status: "loading", lists: [], invalid: [], error: null };

export const ListsContext = createContext<ListsState>(INITIAL_LISTS_STATE);

export function useLists(): ListsState {
  return useContext(ListsContext);
}
