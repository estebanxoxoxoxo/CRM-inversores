/**
 * Vercel function: POST /api/investors
 *
 * Receives investor profiles produced by the research prompt, validates them against the canonical type, rejects
 * duplicates and writes the new ones to Firestore with the audit pending. Requires `Authorization: Bearer
 * <VITE_INGEST_TOKEN>`. Add `?dryRun=1` to validate without writing.
 */
import { timingSafeEqual } from "node:crypto";
import { getDb, isFirebaseConfigured } from "../server/firestore";
import { IngestError, MAX_PER_REQUEST, ingestInvestors } from "../server/ingest";
import { describeError } from "../src/types/investor";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

function isAuthorized(request: Request): boolean {
  const expected = process.env.VITE_INGEST_TOKEN ?? "";
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!expected || !presented) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function GET(): Response {
  return json({
    usage: 'POST { "investors": [ ... ] } with header "Authorization: Bearer <token>"; add ?dryRun=1 to validate without writing.',
    maxPerRequest: MAX_PER_REQUEST,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.VITE_INGEST_TOKEN) return json({ error: "VITE_INGEST_TOKEN is not configured on the server" }, 500);
  if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
  if (!isFirebaseConfigured()) return json({ error: "Firebase is not configured on the server" }, 500);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  try {
    return json(await ingestInvestors(getDb(), body, dryRun));
  } catch (e) {
    if (e instanceof IngestError) return json({ error: e.message }, e.status);
    return json({ error: describeError(e) }, 500);
  }
}
