/**
 * Canonical investor profile.
 *
 * Single source of truth: the Firestore collection `investors`, one document per investor holding the full profile
 * including its audit. The zod schema validates at runtime (scripts and app) and the TypeScript type is inferred
 * from it.
 *
 * - `audit` is the research agent's judgement, not the team's: reason and the five per-dimension score inputs,
 *   written by whoever produced the profile (the research agent through the ingest endpoint, or a person editing by
 *   hand). Derived values (`score.raw`, `score.caps`, `score.total`, and `level`, `band`, `priority` at the root)
 *   are recomputed by `deriveInvestor()` on every write (scripts) and every read (app). They are never edited.
 * - `audit.status` says whether that audit is complete, not whether a person agreed with it. "reviewed" means the
 *   audit block holds a reason and the five scores, which `deriveInvestor()` enforces; "pending" means it does not
 *   and the profile is still a draft. An agent audit that is complete ships as "reviewed".
 * - `level` is 0-100: the weighted average of the five 0-10 scores (`SCORE_WEIGHTS`), capped by `CAP_RULES`.
 *   `band` derives from it (`BAND_THRESHOLDS`) and is "unaudited" while `audit.status` is "pending". `priority`
 *   A/B/C derives from the level.
 * - `confidence` rates the sources, not the fit.
 * - `rating` is the team's verdict on the profile and the only human gate: set from the app, it stays null however
 *   complete the audit is. Agent audit and human verdict are two different axes; do not read one as the other. The
 *   person-level `ratingNote*` fields (`RATING_NOTE_FIELDS`) are the structured note written from the app. Four
 *   institution-level fields that once sat here (fund size, ticket, VC page, notes) moved to the list and stay only
 *   as legacy columns. The three qualification dimensions (`RATING_DIMENSIONS`) are set from the same dialog but do
 *   not belong to the rating: clearing the rating leaves them as they were.
 * - `connectionAsked` is the team's connection state with the investor, set from the app: `false` (no action yet),
 *   `"requested"` or `"accepted"`. The ingest endpoint always stores it as `false`.
 * - Enum values are stable English codes. Spanish labels for the UI live in `src/lib/labels.ts`.
 * - Free-text content (name, theses, research) is written in Spanish because that is what the UI shows.
 */
import { z } from "zod";

export const COLLECTION = "investors";
/** Maximum number of investors accepted by one call to the ingest endpoint. */
export const INGEST_MAX_PER_REQUEST = 20;

export const BANDS = ["undisputed", "high_potential", "reserve", "discarded", "unaudited"] as const;
export const BandSchema = z.enum(BANDS);
export const BAND_THRESHOLDS = { undisputed: 78, high_potential: 60, reserve: 45 } as const;

export const AuditStatusSchema = z.enum(["reviewed", "pending"]);
export const PrioritySchema = z.enum(["A", "B", "C"]);
export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
/**
 * Where the investor is based. `spanish_speaking` is any other country whose language is Spanish (Argentina, Chile,
 * Uruguay, Colombia…); `out_of_region` is a country that does not speak it. The line matters beyond the label: the
 * gold evaluation asks the language aspects only where the language is not a given.
 */
export const RegionSchema = z.enum(["us_hispanic", "spain", "mexico", "spanish_speaking", "out_of_region"]);
export const InvestorTypeSchema = z.enum(["institutional_vc", "business_angel", "operator_fund", "corporate_vc", "accelerator"]);
export const EmailStatusSchema = z.enum(["public_verified", "public_sourced", "firm_general_mailbox", "inferred_pattern", "not_found"]);
export const CapSchema = z.enum(["thesis_below_6", "thesis_below_10", "no_check_writer", "requires_traction"]);

/**
 * The team's verdict, set by a person from the app. `null` means no human has judged the profile yet, whatever its
 * audit says. This is the human gate; `audit.status` is not. Five levels, best to worst: "excellent" (Excelente, gold),
 * "approved" (Bueno, green), "doubtful" (Dudoso, blue), "filler" (Relleno, grey), "rejected" (Desaprobado, red). The
 * order here drives the order of the buttons and filters. The stored codes are stable: "excellent" was added later, so
 * older documents only ever carry the other four.
 */
export const RATINGS = ["excellent", "approved", "doubtful", "filler", "rejected"] as const;
export const RatingSchema = z.enum(RATINGS);
export type Rating = z.infer<typeof RatingSchema>;

/**
 * The person-level fields of the structured note, in the order the dialog asks for them and the detail prints them.
 * The institution-level fields (fund size, ticket, VC page) moved to the list (`LIST_INFO_FIELDS` in
 * `src/lists/types/list.ts`) and are no longer part of this array; their columns stay in the schema below as
 * tolerated legacy. `ratingNoteNotes` is the person's own free note: the list's `notes` was seeded by copying it,
 * but they are independent properties and never sync.
 */
export const RATING_NOTE_FIELDS = [
  "ratingNoteRole",
  "ratingNoteVc",
  "ratingNoteLinkedin",
  "ratingNoteEmail",
  "ratingNoteLocation",
  "ratingNoteNotes",
] as const;
export type RatingNoteField = (typeof RATING_NOTE_FIELDS)[number];

/**
 * Note fields hidden (never erased) for a profile that belongs to a VC list: they describe the institution — its name
 * and its location, which the list itself carries — not the person. Profiles in angel lists and profiles without a
 * list keep showing them.
 */
export const VC_LIST_HIDDEN_NOTE_FIELDS: readonly RatingNoteField[] = ["ratingNoteVc", "ratingNoteLocation"];

/** Level of a qualification dimension, from lowest to highest. A `null` document value shows as `none` in the UI. */
export const RATING_LEVELS = ["none", "low", "medium", "high", "max"] as const;
export const RatingLevelSchema = z.enum(RATING_LEVELS);
export type RatingLevel = z.infer<typeof RatingLevelSchema>;

/** The qualification dimensions, in the order the dialog asks for them. */
export const RATING_DIMENSIONS = ["ratingLanguageAccess", "ratingProductFit", "ratingGeoCapacity"] as const;
export type RatingDimension = (typeof RATING_DIMENSIONS)[number];

/** Connection state with the investor, set from the app. `false` means no connection action yet. */
export const CONNECTION_STATES = ["requested", "accepted"] as const;
export const ConnectionStateSchema = z.enum(CONNECTION_STATES);
export type ConnectionState = z.infer<typeof ConnectionStateSchema>;
export const ConnectionAskedSchema = z.union([z.literal(false), ConnectionStateSchema]);
export type ConnectionAsked = z.infer<typeof ConnectionAskedSchema>;

/** Every dimension is scored 0-10 (one decimal allowed); the level is their weighted average on a 0-100 scale. */
export const SCORE_MAX = 10;
export const SCORE_TOTAL_MAX = 100;
/** Weight of each dimension in the level, in percent. They add up to 100. */
export const SCORE_WEIGHTS = { thesis: 26, stage: 21, decision: 21, spanish: 16, access: 16 } as const;
export type ScoreDimension = keyof typeof SCORE_WEIGHTS;
export const SCORE_DIMENSIONS = Object.keys(SCORE_WEIGHTS) as ScoreDimension[];

const ScoreValueSchema = z
  .number()
  .min(0)
  .max(SCORE_MAX)
  .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-6, "at most one decimal");

/** Hand-edited score inputs: the five rubric dimensions, 0-10 each. */
export const ScoreInputSchema = z.object({
  thesis: ScoreValueSchema,
  stage: ScoreValueSchema,
  decision: ScoreValueSchema,
  spanish: ScoreValueSchema,
  access: ScoreValueSchema,
});
export type ScoreInput = z.infer<typeof ScoreInputSchema>;

/** Full score: inputs plus what `computeScore` derives. */
export const ScoreSchema = ScoreInputSchema.extend({
  raw: z.number().int(),
  caps: z.array(CapSchema),
  total: z.number().int().min(0).max(100),
});
export type Score = z.infer<typeof ScoreSchema>;
export type Cap = z.infer<typeof CapSchema>;

/** Cap conditions on the 0-10 scale, and the maximum level each one imposes. */
export const CAP_RULES = {
  thesis_below_6: { dimension: "thesis", below: 2.4, max: 45 },
  thesis_below_10: { dimension: "thesis", below: 4, max: 55 },
  no_check_writer: { dimension: "decision", atMost: 4, max: 69 },
  requires_traction: { dimension: "stage", atMost: 3.5, max: 64 },
} as const;

export function computeScore(input: ScoreInput): Score {
  const weighted = SCORE_DIMENSIONS.reduce((sum, dimension) => sum + SCORE_WEIGHTS[dimension] * input[dimension], 0);
  const raw = Math.round(weighted / SCORE_MAX);
  const caps: Cap[] = [];
  let total = raw;
  const cap = (applies: boolean, max: number, code: Cap) => {
    if (applies && total > max) {
      total = max;
      caps.push(code);
    }
  };
  cap(input.thesis < CAP_RULES.thesis_below_6.below, CAP_RULES.thesis_below_6.max, "thesis_below_6");
  cap(input.thesis < CAP_RULES.thesis_below_10.below, CAP_RULES.thesis_below_10.max, "thesis_below_10");
  cap(input.decision <= CAP_RULES.no_check_writer.atMost, CAP_RULES.no_check_writer.max, "no_check_writer");
  cap(input.stage <= CAP_RULES.requires_traction.atMost, CAP_RULES.requires_traction.max, "requires_traction");
  total = Math.max(0, Math.min(SCORE_TOTAL_MAX, total));
  return { ...input, raw, caps, total };
}

export function bandOf(level: number, status: AuditStatus): Band {
  if (status !== "reviewed") return "unaudited";
  if (level >= BAND_THRESHOLDS.undisputed) return "undisputed";
  if (level >= BAND_THRESHOLDS.high_potential) return "high_potential";
  if (level >= BAND_THRESHOLDS.reserve) return "reserve";
  return "discarded";
}

export function priorityOf(level: number, status: AuditStatus): Priority {
  if (status !== "reviewed") return "C";
  if (level >= BAND_THRESHOLDS.undisputed) return "A";
  if (level >= BAND_THRESHOLDS.high_potential) return "B";
  return "C";
}

export const AuditSchema = z.object({
  status: AuditStatusSchema,
  /** Date (YYYY-MM-DD) the audit was written, by an agent or by hand. Not the date of a human sign-off. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Why the profile has its level: fit and reservations, in absolute terms. */
  reason: z.string(),
  score: ScoreSchema,
});

/** Where each contact channel came from: short notes (text or URL) per channel. */
export const ContactSourcesSchema = z.object({
  email: z.array(z.string()),
  linkedin: z.array(z.string()),
  other: z.array(z.string()),
});

export const InvestorSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be a slug"),
  name: z.string().min(1),
  level: z.number().int().min(0).max(100),
  band: BandSchema,
  priority: PrioritySchema,
  confidence: ConfidenceSchema,
  region: RegionSchema,
  firm: z.string(),
  role: z.string(),
  baseCity: z.string(),
  investorType: InvestorTypeSchema,
  investorTypeDetail: z.string(),
  stageAndTicket: z.array(z.string()),
  linkedin: z.union([z.url(), z.literal("")]),
  /** Site, blog or newsletter controlled by the person (never the firm's site). Empty when none was found. */
  personalWebsite: z.union([z.url(), z.literal("")]),
  email: z.union([z.email(), z.literal("")]),
  emailStatus: EmailStatusSchema,
  whyInteresting: z.array(z.string()),
  investmentThesis: z.array(z.string()),
  background: z.string(),
  relevantInvestments: z.array(z.string()),
  fitSignals: z.array(z.string()),
  risksOrAlerts: z.array(z.string()),
  howToReach: z.array(z.string()),
  deepResearch: z.string(),
  sources: z.array(z.string()),
  contactSources: ContactSourcesSchema,
  audit: AuditSchema,
  /** Manual team rating from the app (approved / doubtful / rejected / filler); null until someone rates it. */
  rating: RatingSchema.nullable().default(null),
  /**
   * The structured breakdown of the note, written by a person from the app; the ingest endpoint always stores them as
   * null. The person-level lines (`RATING_NOTE_FIELDS`) are what the dialog edits and the detail prints. The three
   * institution-level columns (`ratingNoteFundSize`, `ratingNoteTicket`, `ratingNoteVcWebsite`) moved to the list
   * (`LIST_INFO_FIELDS`): they are no longer edited or shown here and stay only as tolerated legacy so the stored
   * values are not lost. Do not add them back to `RATING_NOTE_FIELDS`.
   */
  ratingNoteRole: z.string().nullable().default(null),
  ratingNoteVc: z.string().nullable().default(null),
  ratingNoteFundSize: z.string().nullable().default(null),
  ratingNoteTicket: z.string().nullable().default(null),
  ratingNoteLinkedin: z.string().nullable().default(null),
  ratingNoteEmail: z.string().nullable().default(null),
  ratingNoteVcWebsite: z.string().nullable().default(null),
  ratingNoteLocation: z.string().nullable().default(null),
  ratingNoteNotes: z.string().nullable().default(null),
  /**
   * The human qualification dimensions (`RATING_DIMENSIONS`), one level each, set from the app. They are independent
   * of the legacy `rating`: clearing the rating does not clear them, they survive it. The ingest endpoint always
   * stores them as null.
   */
  ratingLanguageAccess: RatingLevelSchema.nullable().default(null),
  ratingProductFit: RatingLevelSchema.nullable().default(null),
  ratingGeoCapacity: RatingLevelSchema.nullable().default(null),
  /** Connection state set from the app: false (none), "requested" or "accepted". */
  connectionAsked: ConnectionAskedSchema.default(false),
  /** ISO timestamp of the last write. */
  updatedAt: z.string(),
});

export type Investor = z.infer<typeof InvestorSchema>;
export type Band = z.infer<typeof BandSchema>;
export type AuditStatus = z.infer<typeof AuditStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type InvestorType = z.infer<typeof InvestorTypeSchema>;
export type EmailStatus = z.infer<typeof EmailStatusSchema>;
export type Audit = z.infer<typeof AuditSchema>;
export type ContactSources = z.infer<typeof ContactSourcesSchema>;

/**
 * Validates a raw document and recomputes everything derived from the hand-edited inputs. Used by the scripts
 * before writing and by the app after reading, so stored derived values can never be stale.
 */
export function deriveInvestor(raw: unknown): Investor {
  const doc = (raw ?? {}) as Record<string, unknown>;
  const audit = (doc.audit ?? {}) as Record<string, unknown>;
  const status = AuditStatusSchema.parse(audit.status);
  const input = ScoreInputSchema.parse(audit.score ?? {});
  if (status === "reviewed") {
    if (!String(audit.reason ?? "").trim()) throw new Error("reviewed audit without a reason");
    for (const key of ["whyInteresting", "investmentThesis", "stageAndTicket"] as const) {
      const value = doc[key];
      if (!Array.isArray(value) || !value.length) throw new Error(`reviewed audit with empty ${key}`);
    }
  }
  const score = computeScore(input);
  return InvestorSchema.parse({
    ...doc,
    level: score.total,
    band: bandOf(score.total, status),
    priority: priorityOf(score.total, status),
    audit: { status, date: audit.date, reason: audit.reason ?? "", score },
  });
}

/** One-line description of a validation or runtime error. */
export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
  return e instanceof Error ? e.message : String(e);
}
