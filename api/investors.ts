/**
 * Vercel function: POST /api/investors
 *
 * Receives investor profiles produced by the research prompt, validates them against the canonical type, rejects
 * duplicates and writes the new ones to Firestore with the agent's audit stored as "reviewed" and no team verdict
 * (`rating` null). Requires `Authorization: Bearer <VITE_INGEST_TOKEN>`. Add `?dryRun=1` to validate without writing.
 */
import { isAuthorized, tokenConfigured } from "../server/auth.js";
import { getDb, isFirebaseConfigured } from "../server/firestore.js";
import { IngestError, ingestInvestors } from "../src/bronze/server/ingest.js";
import { INGEST_MAX_PER_REQUEST, describeError } from "../src/bronze/types/investor.js";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

export function GET(): Response {
  return json({
    usage: 'POST { "investors": [ ... ] } with header "Authorization: Bearer <token>"; add ?dryRun=1 to validate without writing.',
    maxPerRequest: INGEST_MAX_PER_REQUEST,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!tokenConfigured()) return json({ error: "VITE_INGEST_TOKEN is not configured on the server" }, 500);
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
