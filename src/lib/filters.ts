import {
  BandSchema,
  ConfidenceSchema,
  EmailStatusSchema,
  InvestorTypeSchema,
  RATINGS,
  RegionSchema,
  type Band,
  type Confidence,
  type EmailStatus,
  type Investor,
  type InvestorType,
  type Rating,
  type Region,
} from "../types/investor";
import { REGION_LABELS, UNRATED } from "./labels";

export type SortKey = "level" | "name" | "firm" | "region";
const SORT_KEYS: readonly SortKey[] = ["level", "name", "firm", "region"];

export type RatingFilter = Rating | typeof UNRATED;
export const RATING_FILTER_OPTIONS: readonly RatingFilter[] = [...RATINGS, UNRATED];

export interface Filters {
  text: string;
  ratings: RatingFilter[];
  bands: Band[];
  minLevel: number;
  regions: Region[];
  confidences: Confidence[];
  types: InvestorType[];
  emailStatuses: EmailStatus[];
  withLinkedin: boolean;
  sort: SortKey;
}

export type ListFilterKey = "ratings" | "bands" | "regions" | "confidences" | "types" | "emailStatuses";

export const EMPTY_FILTERS: Filters = {
  text: "",
  ratings: [],
  bands: [],
  minLevel: 0,
  regions: [],
  confidences: [],
  types: [],
  emailStatuses: [],
  withLinkedin: false,
  sort: "level",
};

/** The app opens on the two bands that matter for outreach. */
export const DEFAULT_FILTERS: Filters = { ...EMPTY_FILTERS, bands: ["undisputed", "high_potential"] };

/** List filters and their URL parameter. Values are validated against the enum on the way in. */
const LIST_FILTERS: { key: ListFilterKey; param: string; options: readonly string[] }[] = [
  { key: "ratings", param: "rating", options: RATING_FILTER_OPTIONS },
  { key: "bands", param: "band", options: BandSchema.options },
  { key: "regions", param: "region", options: RegionSchema.options },
  { key: "confidences", param: "confidence", options: ConfidenceSchema.options },
  { key: "types", param: "type", options: InvestorTypeSchema.options },
  { key: "emailStatuses", param: "email", options: EmailStatusSchema.options },
];

export function filtersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) return DEFAULT_FILTERS;
  const filters: Filters = { ...EMPTY_FILTERS, text: params.get("q") ?? "", withLinkedin: params.get("li") === "1" };
  const sort = params.get("sort");
  if (SORT_KEYS.includes(sort as SortKey)) filters.sort = sort as SortKey;
  const min = Number(params.get("min"));
  if (Number.isFinite(min) && min > 0) filters.minLevel = Math.min(100, Math.max(0, min));
  for (const { key, param, options } of LIST_FILTERS) {
    const value = params.get(param);
    if (value) (filters as unknown as Record<ListFilterKey, string[]>)[key] = value.split("|").filter((v) => options.includes(v));
  }
  return filters;
}

export function filtersToUrl(filters: Filters): void {
  const params = new URLSearchParams();
  if (filters.text) params.set("q", filters.text);
  for (const { key, param } of LIST_FILTERS) {
    const values = filters[key] as string[];
    if (values.length) params.set(param, values.join("|"));
  }
  if (filters.minLevel > 0) params.set("min", String(filters.minLevel));
  if (filters.withLinkedin) params.set("li", "1");
  if (filters.sort !== "level") params.set("sort", filters.sort);
  const query = params.toString();
  window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export const ratingOf = (investor: Investor): RatingFilter => investor.rating ?? UNRATED;

export function applyFilters(investors: Investor[], filters: Filters): Investor[] {
  const terms = normalize(filters.text.trim()).split(/\s+/).filter(Boolean);
  const matching = investors.filter((investor) => {
    if (filters.ratings.length && !filters.ratings.includes(ratingOf(investor))) return false;
    if (filters.bands.length && !filters.bands.includes(investor.band)) return false;
    if (investor.level < filters.minLevel) return false;
    if (filters.regions.length && !filters.regions.includes(investor.region)) return false;
    if (filters.confidences.length && !filters.confidences.includes(investor.confidence)) return false;
    if (filters.types.length && !filters.types.includes(investor.investorType)) return false;
    if (filters.emailStatuses.length && !filters.emailStatuses.includes(investor.emailStatus)) return false;
    if (filters.withLinkedin && !investor.linkedin) return false;
    if (terms.length) {
      const haystack = normalize([investor.name, investor.firm, investor.role, investor.baseCity, investor.stageAndTicket[0] ?? "", investor.audit.reason].join(" · "));
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });
  const byName = (a: Investor, b: Investor) => a.name.localeCompare(b.name);
  const comparators: Record<SortKey, (a: Investor, b: Investor) => number> = {
    level: (a, b) => b.level - a.level || byName(a, b),
    name: byName,
    firm: (a, b) => a.firm.localeCompare(b.firm) || byName(a, b),
    region: (a, b) => REGION_LABELS[a.region].localeCompare(REGION_LABELS[b.region]) || b.level - a.level || byName(a, b),
  };
  return matching.sort(comparators[filters.sort]);
}
