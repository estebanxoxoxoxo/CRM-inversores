/**
 * Ingestion of investor profiles submitted by the research prompt (POST /api/investors).
 *
 * Every submission is normalised (id from the name, audit forced to "reviewed", derived fields recomputed), validated
 * against the canonical type and checked for duplicates against the whole collection by id, name, LinkedIn and
 * email. Valid, new profiles are written in one batch; nothing existing is ever overwritten.
 *
 * The audit that arrives here is the research agent's: its five scores and its reason. Storing it as "reviewed" only
 * states that the audit block is complete, and `deriveInvestor()` enforces exactly that (a reviewed audit needs a
 * reason and non-empty `whyInteresting`, `investmentThesis` and `stageAndTicket`), so an incomplete agent audit is
 * rejected rather than written. The team's verdict is a separate axis and lives in `rating`, which this endpoint
 * always stores as null: a profile can be fully audited by an agent and still have no human judgement on it.
 */
import { collection, doc, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { COLLECTION, INGEST_MAX_PER_REQUEST, deriveInvestor, describeError, type Investor } from "../src/types/investor";

export class IngestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface IngestResult {
  dryRun: boolean;
  created: { id: string; name: string }[];
  rejected: { id: string; name: string; reason: string }[];
}

type Doc = Record<string, unknown>;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slugify = (s: string) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const normaliseLinkedin = (url: string) =>
  fold(url)
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");

/** Accepts `{ investors: [...] }`, a bare array or a single object. */
function parsePayload(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const investors = (body as Doc).investors;
    if (Array.isArray(investors)) return investors;
    if (investors === undefined) return [body];
  }
  throw new IngestError(400, 'Body must be { "investors": [ ... ] }');
}

/** Fills what the server owns, drops derived values and validates. Throws with a readable message. */
function prepareSubmission(raw: unknown, now: string): Investor {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("each investor must be an object");
  const submitted = raw as Doc;
  const audit = (submitted.audit && typeof submitted.audit === "object" ? submitted.audit : {}) as Doc;
  const score = (audit.score && typeof audit.score === "object" ? audit.score : {}) as Doc;
  const contactSources = (submitted.contactSources && typeof submitted.contactSources === "object" ? submitted.contactSources : {}) as Doc;
  const { level: _level, band: _band, priority: _priority, rating: _rating, updatedAt: _updatedAt, ...rest } = submitted;
  void _level;
  void _band;
  void _priority;
  void _rating;
  void _updatedAt;
  const { raw: _raw, caps: _caps, total: _total, ...scoreInput } = score;
  void _raw;
  void _caps;
  void _total;
  const name = typeof submitted.name === "string" ? submitted.name.trim() : "";
  return deriveInvestor({
    ...rest,
    id: typeof submitted.id === "string" && submitted.id.trim() ? submitted.id.trim() : slugify(name),
    name,
    investorTypeDetail: submitted.investorTypeDetail ?? "",
    personalWebsite: submitted.personalWebsite ?? "",
    contactSources: { email: contactSources.email ?? [], linkedin: contactSources.linkedin ?? [], other: contactSources.other ?? [] },
    audit: {
      status: "reviewed",
      date: typeof audit.date === "string" && audit.date ? audit.date : now.slice(0, 10),
      reason: audit.reason ?? "",
      score: { thesis: 0, stage: 0, decision: 0, spanish: 0, access: 0, ...scoreInput },
    },
    rating: null,
    updatedAt: now,
  });
}

interface Index {
  ids: Map<string, string>;
  names: Map<string, string>;
  linkedins: Map<string, string>;
  emails: Map<string, string>;
}

function indexOf(investors: { id: string; name: string; linkedin: string; email: string }[]): Index {
  const index: Index = { ids: new Map(), names: new Map(), linkedins: new Map(), emails: new Map() };
  for (const investor of investors) add(index, investor);
  return index;
}

function add(index: Index, investor: { id: string; name: string; linkedin: string; email: string }): void {
  index.ids.set(investor.id, investor.id);
  index.names.set(fold(investor.name), investor.id);
  if (investor.linkedin) index.linkedins.set(normaliseLinkedin(investor.linkedin), investor.id);
  if (investor.email) index.emails.set(investor.email.toLowerCase(), investor.id);
}

function duplicateOf(index: Index, investor: Investor): string | null {
  const byId = index.ids.get(investor.id);
  if (byId) return `same id as existing profile ${byId}`;
  const byName = index.names.get(fold(investor.name));
  if (byName) return `same name as existing profile ${byName}`;
  const byLinkedin = investor.linkedin ? index.linkedins.get(normaliseLinkedin(investor.linkedin)) : undefined;
  if (byLinkedin) return `same LinkedIn as existing profile ${byLinkedin}`;
  const byEmail = investor.email ? index.emails.get(investor.email.toLowerCase()) : undefined;
  if (byEmail) return `same email as existing profile ${byEmail}`;
  return null;
}

export async function ingestInvestors(db: Firestore, body: unknown, dryRun: boolean): Promise<IngestResult> {
  const items = parsePayload(body);
  if (!items.length) throw new IngestError(400, "No investors in the payload");
  if (items.length > INGEST_MAX_PER_REQUEST) throw new IngestError(400, `At most ${INGEST_MAX_PER_REQUEST} investors per request`);

  const existing = await getDocs(collection(db, COLLECTION));
  const index = indexOf(
    existing.docs.map((document) => {
      const data = document.data() as Doc;
      return { id: document.id, name: String(data.name ?? ""), linkedin: String(data.linkedin ?? ""), email: String(data.email ?? "") };
    }),
  );

  const now = new Date().toISOString();
  const result: IngestResult = { dryRun, created: [], rejected: [] };
  const batch = writeBatch(db);
  for (const item of items) {
    const submitted = (item && typeof item === "object" ? item : {}) as Doc;
    const label = { id: String(submitted.id ?? ""), name: String(submitted.name ?? "") };
    try {
      const investor = prepareSubmission(item, now);
      const duplicate = duplicateOf(index, investor);
      if (duplicate) {
        result.rejected.push({ id: investor.id, name: investor.name, reason: `duplicate: ${duplicate}` });
        continue;
      }
      add(index, investor);
      batch.set(doc(db, COLLECTION, investor.id), investor);
      result.created.push({ id: investor.id, name: investor.name });
    } catch (e) {
      result.rejected.push({ ...label, reason: describeError(e) });
    }
  }
  if (!dryRun && result.created.length) await batch.commit();
  return result;
}
