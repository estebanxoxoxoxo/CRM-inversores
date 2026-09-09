/**
 * The evaluation of one investor: the document the agent pushes into the `gold` collection, one per investor,
 * with the investor's id as the document id.
 *
 * Four aspects decide the verdict: `stage` and `deepTech` apply to everyone; `spanish` and `hispanicFounders` are
 * asked wherever the country does not speak Spanish — the United States and anywhere else outside
 * SPANISH_SPEAKING_REGIONS — and go in null in Spain, Mexico and any other Spanish-speaking country, where the
 * language is a given. The verdict is not a free judgement: it is the
 * conjunction of the aspects that apply, and `validateEvaluation` refuses a document where the two disagree, so no
 * evaluation can call an investor gold without evidence in every aspect that applies to it.
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
export const SUBJECT_MAX = 100;
export const BODY_MAX = 900;
export const BASED_ON_MAX = 200;
export const EMAILS_REQUIRED = 4;

export const VerdictSchema = z.enum(["gold", "rejected"]);

export const AspectSchema = z.object({
  passes: z.boolean(),
  /** One terse paragraph: the exact URL and the literal phrase or datum that proves it. */
  reason: z.string().min(1).max(REASON_MAX),
  /** At least one exact URL when the aspect passes. */
  sources: z.array(z.url()),
});

export const EmailSchema = z.object({
  subject: z.string().min(1).max(SUBJECT_MAX),
  body: z.string().min(1).max(BODY_MAX),
  /** The concrete evidence this email is built on (an article and its quoted phrase, a named investment, a talk). */
  basedOn: z.string().min(1).max(BASED_ON_MAX),
});

export const EvaluationSchema = z.object({
  investorId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  /** Copied from investors by the server; the agent's value is ignored. */
  region: z.string(),
  verdict: VerdictSchema,
  aspects: z.object({
    stage: AspectSchema,
    deepTech: AspectSchema,
    /** Required outside a Spanish-speaking country (see SPANISH_SPEAKING_REGIONS); null inside one. */
    spanish: AspectSchema.nullable(),
    /** Required outside a Spanish-speaking country (see SPANISH_SPEAKING_REGIONS); null inside one. */
    hispanicFounders: AspectSchema.nullable(),
  }),
  /** Exactly 4 when the verdict is gold; empty when rejected. */
  emails: z.array(EmailSchema),
  /** ISO timestamp, set by the server. */
  evaluatedAt: z.string(),
});

export type Verdict = z.infer<typeof VerdictSchema>;
export type Aspect = z.infer<typeof AspectSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Evaluation = z.infer<typeof EvaluationSchema>;

/** The aspects asked of every investor. */
export const GLOBAL_ASPECTS = ["stage", "deepTech"] as const;

/** The aspects asked of United States investors only. */
export const REGION_ASPECTS = ["spanish", "hispanicFounders"] as const;

/** True when every aspect that applies to this investor passes. The verdict must say exactly this and nothing else. */
export const passesEveryAspect = (aspects: Evaluation["aspects"]): boolean =>
  aspects.stage.passes && aspects.deepTech.passes && (aspects.spanish === null || aspects.spanish.passes) && (aspects.hispanicFounders === null || aspects.hispanicFounders.passes);

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

  if (passesEveryAspect(evaluation.aspects) !== (evaluation.verdict === "gold")) throw new Error("verdict does not match the aspects");
  if (evaluation.verdict === "gold" && evaluation.emails.length !== EMAILS_REQUIRED) throw new Error(`a gold evaluation needs exactly ${EMAILS_REQUIRED} emails`);
  if (evaluation.verdict === "rejected" && evaluation.emails.length) throw new Error("a rejected evaluation carries no emails");

  return evaluation;
}

export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
  return e instanceof Error ? e.message : String(e);
}
