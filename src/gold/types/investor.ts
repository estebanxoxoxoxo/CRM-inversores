/**
 * Permissive reader for the `investors` collection, which belongs to the CRM.
 *
 * This project never writes an investor and does not need the canonical type: the prompt carries each document
 * whole, and the script itself only relies on `id`, `name`, `level` and `region`. Every field falls back instead of
 * throwing, and unknown keys are kept, so a field the CRM adds, renames or drops can never break the console script
 * mid-run.
 */
import { z } from "zod";
import { US_REGION } from "./gold";

/** Region codes used by the CRM. Kept as documentation: here `region` is read as a plain string. */
export const REGIONS = [US_REGION, "spain", "mexico", "out_of_region"] as const;

const text = z.string().catch("");
const list = z.array(z.string()).catch(() => []);
const level = z.number().catch(0);

export const InvestorDigestSchema = z
  .object({
    id: z.string(),
    name: text,
    firm: text,
    role: text,
    baseCity: text,
    region: text,
    level,
    band: text,
    linkedin: text,
    personalWebsite: text,
    email: text,
    stageAndTicket: list,
    investmentThesis: list,
    fitSignals: list,
    risksOrAlerts: list,
    sources: list,
  })
  .loose();

export type InvestorDigest = z.infer<typeof InvestorDigestSchema>;

/** The document id wins over any `id` stored inside the document: it is the key the endpoint writes against. */
export const parseInvestorDigest = (id: string, data: unknown): InvestorDigest =>
  InvestorDigestSchema.parse({ ...(data && typeof data === "object" ? data : {}), id });
