/**
 * The evaluation of one investor: the document the agent pushes into the `gold` collection, one per investor,
 * with the investor's id as the document id. Being in the collection means one thing only, that the investor was
 * re-analyzed under the four aspects.
 *
 * Four aspects carry the analysis: `stage` and `deepTech` apply to everyone; `spanish` and `hispanicFounders` are
 * asked wherever the country does not speak Spanish — the United States and anywhere else outside
 * SPANISH_SPEAKING_REGIONS — and go in null in Spain, Mexico and any other Spanish-speaking country, where the
 * language is a given. No profile passes or fails as a whole: Bronce is the only filter, and the four aspects are
 * business analysis over what it already let through, so an aspect answered with a documented "no" is information
 * like any other. Every evaluation carries between FACTS_MIN and FACTS_MAX related facts, always, and
 * `validateEvaluation` refuses a document with fewer. The facts are raw material, not prose: dry data about the
 * investor that the client drops into the cold emails he writes himself.
 *
 * `region`, `name` and `evaluatedAt` are owned by the server: it copies them from `investors/{investorId}` and from
 * the clock, ignoring whatever the agent sent. That is what makes the two region-dependent aspects impossible to
 * dodge by declaring a different region.
 *
 * This file is embedded verbatim in the prompt (see src/gold/prompt-builder/inputs/type-source.ts), so what the agent
 * reads is always what the endpoint validates.
 */
import { z } from "zod";

export const COLLECTION = "gold";
export const INVESTORS_COLLECTION = "investors";
/**
 * Regions where the country's language is Spanish, so the two language aspects are not asked and go in null. In every
 * other region — the United States and any country that does not speak Spanish — the four aspects are required.
 */
export const SPANISH_SPEAKING_REGIONS: readonly string[] = ["spain", "mexico", "spanish_speaking"];

/** Whether this investor has to answer the two language aspects. */
export const asksLanguageAspects = (region: string): boolean => !SPANISH_SPEAKING_REGIONS.includes(region);
/** Maximum number of evaluations accepted by one call to the endpoint. */
export const MAX_PER_REQUEST = 100;
/** Investors asked for in one prompt, taken from the head of the unevaluated remainder. */
export const BATCH_SIZE = 25;
/** Gold documents shown as examples in the prompt, most recent first. */
export const EXAMPLES_COUNT = 100;
export const REASON_MAX = 400; // characters: one terse paragraph
export const FACT_MAX = 300; // characters: one dry fact, nothing around it
export const FACTS_MIN = 3;
export const FACTS_MAX = 10;

export const AspectSchema = z.object({
  passes: z.boolean(),
  /** One terse paragraph: the exact URL and the literal phrase or datum that proves it. */
  reason: z.string().min(1).max(REASON_MAX),
  /** At least one exact URL when the aspect passes. */
  sources: z.array(z.url()),
});

export const RelatedFactSchema = z.object({
  /** The fact, dry, exactly as it could be dropped into an email: no framing, no justification, no mention of the research. */
  fact: z.string().min(1).max(FACT_MAX),
  /** Where the fact can be checked: at least one URL. */
  sources: z.array(z.url()).min(1),
});

export const EvaluationSchema = z.object({
  investorId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  /** Copied from investors by the server; the agent's value is ignored. */
  region: z.string(),
  aspects: z.object({
    stage: AspectSchema,
    deepTech: AspectSchema,
    /** Required outside a Spanish-speaking country (see SPANISH_SPEAKING_REGIONS); null inside one. */
    spanish: AspectSchema.nullable(),
    /** Required outside a Spanish-speaking country (see SPANISH_SPEAKING_REGIONS); null inside one. */
    hispanicFounders: AspectSchema.nullable(),
  }),
  /**
   * Between FACTS_MIN and FACTS_MAX in every evaluation, always: they are what the layer is for, and no aspect gates
   * them. Defaulted so the documents written before the facts existed still parse.
   */
  relatedFacts: z.array(RelatedFactSchema).max(FACTS_MAX).default([]),
  /** ISO timestamp, set by the server. */
  evaluatedAt: z.string(),
});

export type Aspect = z.infer<typeof AspectSchema>;
export type RelatedFact = z.infer<typeof RelatedFactSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;

/** The aspects asked of every investor. */
export const GLOBAL_ASPECTS = ["stage", "deepTech"] as const;

/** The aspects asked of United States investors only. */
export const REGION_ASPECTS = ["spanish", "hispanicFounders"] as const;

/**
 * Validates one submitted evaluation and returns the document to store. The server's fields (`region`, `name`,
 * `evaluatedAt`) are forced before parsing, then the rules the schema cannot express are checked. Throws with a
 * readable message; the endpoint turns it into an `invalid` entry.
 */
export function validateEvaluation(raw: unknown, investor: { region: string; name: string }, now: string): Evaluation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("each evaluation must be an object");
  const evaluation = EvaluationSchema.parse({ ...(raw as Record<string, unknown>), region: investor.region, name: investor.name, evaluatedAt: now });

  // The language aspects are asked wherever the country does not speak Spanish, and there they are asked of everyone.
  const asks = asksLanguageAspects(investor.region);
  for (const key of REGION_ASPECTS) {
    const value = evaluation.aspects[key];
    if (asks && value === null) throw new Error(`${key} is required for investors in region "${investor.region}", which is not a Spanish-speaking country`);
    if (!asks && value !== null) throw new Error(`${key} must be null for investors in region "${investor.region}", a Spanish-speaking country`);
  }

  for (const [aspect, value] of Object.entries(evaluation.aspects)) {
    if (value && value.passes && !value.sources.length) throw new Error(`aspect ${aspect} passes but carries no sources`);
  }

  // Unconditional: the aspects analyse, they do not filter, so nothing they say can excuse an evaluation from its facts.
  if (evaluation.relatedFacts.length < FACTS_MIN) throw new Error(`an evaluation needs at least ${FACTS_MIN} related facts`);

  return evaluation;
}

export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
  return e instanceof Error ? e.message : String(e);
}
