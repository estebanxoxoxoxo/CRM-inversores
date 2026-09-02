/**
 * Maps the Spanish values used by the research JSON files (the external input of `npm run import`) to the English
 * codes of the investor type.
 */
import type { Confidence, EmailStatus, InvestorType, Region } from "../../src/types/investor";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const REGIONS: Record<string, Region> = {
  "ee.uu. (hispanohablante)": "us_hispanic",
  espana: "spain",
  mexico: "mexico",
  "fuera de region (excepcional)": "out_of_region",
};

const CONFIDENCES: Record<string, Confidence> = { alta: "high", media: "medium", baja: "low" };

const EMAIL_STATUSES: Record<string, EmailStatus> = {
  "publico verificado": "public_verified",
  "publico (ver fuente)": "public_sourced",
  "buzon general del fondo (publico)": "firm_general_mailbox",
  "patron inferido (no verificado)": "inferred_pattern",
  "no encontrado": "not_found",
};

function lookup<T>(table: Record<string, T>, value: unknown, what: string): T {
  const code = table[fold(String(value ?? ""))];
  if (!code) throw new Error(`${what} not recognised: ${String(value)}`);
  return code;
}

export const parseRegion = (value: unknown): Region => lookup(REGIONS, value, "region");
export const parseConfidence = (value: unknown): Confidence => lookup(CONFIDENCES, value, "confianza");
export const parseEmailStatus = (value: unknown): EmailStatus => lookup(EMAIL_STATUSES, value, "email_estado");

/** The research files describe the investor type in free text; the code is taken from how it starts. */
export function parseInvestorType(value: unknown): InvestorType {
  const text = fold(String(value ?? ""));
  if (text.startsWith("vc institucional")) return "institutional_vc";
  if (text.startsWith("business angel")) return "business_angel";
  if (text.startsWith("fondo operador") || text.includes("solo gp")) return "operator_fund";
  if (text.startsWith("corporate vc")) return "corporate_vc";
  if (text.startsWith("aceleradora")) return "accelerator";
  throw new Error(`tipo_inversor not recognised: ${String(value)}`);
}
