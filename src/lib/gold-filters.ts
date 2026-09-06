/** Filters and order of the Gold section, kept in memory: the URL only carries the section and the selected id. */
import { VerdictSchema, type Evaluation, type Verdict } from "../gold/types/gold";
import { RegionSchema, type Investor, type Region } from "../types/investor";
import { normalize } from "./filters";

/** One row of the Gold section: the evaluation and, while the investor is still in the base, its profile. */
export interface GoldEntry {
  evaluation: Evaluation;
  investor: Investor | null;
}

export type AspectKey = keyof Evaluation["aspects"];
export const ASPECT_KEYS: readonly AspectKey[] = ["stage", "deepTech", "spanish", "hispanicFounders"];

export const VERDICTS: readonly Verdict[] = VerdictSchema.options;
export const GOLD_REGIONS: readonly Region[] = RegionSchema.options;

export type GoldSortKey = "level" | "name" | "date";
const GOLD_SORT_KEYS: readonly GoldSortKey[] = ["level", "name", "date"];
export const isGoldSortKey = (value: string): value is GoldSortKey => GOLD_SORT_KEYS.includes(value as GoldSortKey);

export interface GoldFilters {
  text: string;
  verdicts: Verdict[];
  regions: Region[];
  /** Keep only the evaluations that fail at least one of these aspects. */
  failing: AspectKey[];
  sort: GoldSortKey;
}

export type GoldListFilterKey = "verdicts" | "regions" | "failing";

export const EMPTY_GOLD_FILTERS: GoldFilters = { text: "", verdicts: [], regions: [], failing: [], sort: "level" };

/** The section opens on the gold verdict: the profiles worth writing to. */
export const DEFAULT_GOLD_FILTERS: GoldFilters = { ...EMPTY_GOLD_FILTERS, verdicts: ["gold"] };

export function joinGold(evaluations: Evaluation[], investors: Investor[]): GoldEntry[] {
  const byId = new Map(investors.map((investor) => [investor.id, investor]));
  return evaluations.map((evaluation) => ({ evaluation, investor: byId.get(evaluation.investorId) ?? null }));
}

/** Whether the evaluation fails this aspect. An aspect that does not apply (null) never fails. */
export function fails(evaluation: Evaluation, aspect: AspectKey): boolean {
  const value = evaluation.aspects[aspect];
  return value !== null && !value.passes;
}

export function applyGoldFilters(entries: GoldEntry[], filters: GoldFilters): GoldEntry[] {
  const terms = normalize(filters.text.trim()).split(/\s+/).filter(Boolean);
  const matching = entries.filter(({ evaluation, investor }) => {
    if (filters.verdicts.length && !filters.verdicts.includes(evaluation.verdict)) return false;
    if (filters.regions.length && !filters.regions.includes(evaluation.region as Region)) return false;
    if (filters.failing.length && !filters.failing.some((aspect) => fails(evaluation, aspect))) return false;
    if (terms.length) {
      const reasons = ASPECT_KEYS.map((aspect) => evaluation.aspects[aspect]?.reason ?? "");
      const haystack = normalize([evaluation.name, investor?.firm ?? "", investor?.role ?? "", investor?.baseCity ?? "", ...reasons].join(" · "));
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });
  const level = (entry: GoldEntry): number => entry.investor?.level ?? -1;
  const byName = (a: GoldEntry, b: GoldEntry) => a.evaluation.name.localeCompare(b.evaluation.name);
  const comparators: Record<GoldSortKey, (a: GoldEntry, b: GoldEntry) => number> = {
    level: (a, b) => level(b) - level(a) || byName(a, b),
    name: byName,
    date: (a, b) => b.evaluation.evaluatedAt.localeCompare(a.evaluation.evaluatedAt) || byName(a, b),
  };
  return matching.sort(comparators[filters.sort]);
}
