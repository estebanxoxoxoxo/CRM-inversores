/**
 * Ingestion of the evaluations produced by the prompt (POST /api/gold).
 *
 * One document per investor in `gold`, keyed by the investor's id. Every item is checked against the live database
 * before anything is written: the investor must exist in `investors` (the id is not something the agent may invent)
 * and must not have been evaluated yet, because an evaluation is never overwritten. `region` and `name` come from
 * that stored investor, so the fourth aspect cannot be dodged by sending a different region.
 *
 * `invalid` is not `rejected` on purpose: `rejected` is a verdict about an investor, and a rejected evaluation is a
 * perfectly good document that gets written. `invalid` means the submission itself was refused.
 */
import { doc, getDoc, writeBatch, type DocumentSnapshot, type Firestore } from "firebase/firestore";
import { COLLECTION, INVESTORS_COLLECTION, MAX_PER_REQUEST, describeError, validateEvaluation, type Verdict } from "../types/gold.js";

export class IngestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface IngestResult {
  dryRun: boolean;
  created: { investorId: string; verdict: Verdict }[];
  invalid: { investorId: string; reason: string }[];
}

type Doc = Record<string, unknown>;

/** Accepts `{ evaluations: [...] }`, a bare array or a single object. */
function parsePayload(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const evaluations = (body as Doc).evaluations;
    if (Array.isArray(evaluations)) return evaluations;
    if (evaluations === undefined) return [body];
  }
  throw new IngestError(400, 'Body must be { "evaluations": [ ... ] }');
}

const submittedId = (item: unknown): string => {
  const submitted = (item && typeof item === "object" ? item : {}) as Doc;
  return typeof submitted.investorId === "string" ? submitted.investorId.trim() : "";
};

export async function ingestEvaluations(db: Firestore, body: unknown, dryRun: boolean): Promise<IngestResult> {
  const items = parsePayload(body);
  if (!items.length) throw new IngestError(400, "No evaluations in the payload");
  if (items.length > MAX_PER_REQUEST) throw new IngestError(400, `At most ${MAX_PER_REQUEST} evaluations per request`);

  const now = new Date().toISOString();
  const result: IngestResult = { dryRun, created: [], invalid: [] };
  const batch = writeBatch(db);
  const seen = new Set<string>();
  const ids = items.map(submittedId);
  // One round trip for the whole request: two sequential reads per item would take a hundred items past Vercel's timeout.
  const snapshots = await Promise.all(ids.map((id) => (id ? Promise.all([getDoc(doc(db, INVESTORS_COLLECTION, id)), getDoc(doc(db, COLLECTION, id))]) : null)));
  for (const [index, item] of items.entries()) {
    const investorId = ids[index];
    try {
      if (!investorId) throw new Error("investorId is required");
      if (seen.has(investorId)) throw new Error("duplicate investorId in the same request");
      const [investor, evaluated] = snapshots[index] as [DocumentSnapshot, DocumentSnapshot];
      if (!investor.exists()) throw new Error("unknown investor");
      if (evaluated.exists()) throw new Error("already evaluated");
      const stored = investor.data() as Doc;
      const evaluation = validateEvaluation(item, { region: String(stored.region ?? ""), name: String(stored.name ?? "") }, now);
      seen.add(investorId);
      batch.set(doc(db, COLLECTION, investorId), evaluation);
      result.created.push({ investorId, verdict: evaluation.verdict });
    } catch (e) {
      result.invalid.push({ investorId, reason: describeError(e) });
    }
  }
  if (!dryRun && result.created.length) await batch.commit();
  return result;
}
