import { createContext, useContext } from "react";

/** The two sections of the app: Bronce is the investors list, Gold the evaluations made over it. */
export type Section = "bronze" | "gold";

export interface Navigation {
  section: Section;
  /** Selected investor id; in Gold it is the evaluated investor's id (same ids in both collections). */
  selectedId: string | null;
}

/** Reads `#s=gold&id=…`. The section is omitted for Bronce, so the older `#id=…` links keep working. */
export function navigationFromHash(): Navigation {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return { section: params.get("s") === "gold" ? "gold" : "bronze", selectedId: params.get("id") };
}

export function navigationToHash({ section, selectedId }: Navigation): void {
  const params = new URLSearchParams();
  if (section !== "bronze") params.set("s", section);
  if (selectedId) params.set("id", selectedId);
  const hash = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`);
}

export interface SectionState extends Navigation {
  /** Switches section and, optionally, the selected profile: `null` closes the panel, `undefined` keeps it. */
  go: (section: Section, selectedId?: string | null) => void;
}

export const SectionContext = createContext<SectionState>({ section: "bronze", selectedId: null, go: () => {} });

export function useSection(): SectionState {
  return useContext(SectionContext);
}
