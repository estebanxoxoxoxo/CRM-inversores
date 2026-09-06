/**
 * Vercel function: POST /api/gold
 *
 * Receives the evaluations produced by the prompt, validates each one against the gold type and the business rules,
 * and writes one document per investor into the `gold` collection. Requires `Authorization: Bearer
 * <VITE_INGEST_TOKEN>`. Add `?dryRun=1` to validate without writing.
 */
import { isAuthorized, tokenConfigured } from "../server/auth.js";
import { getDb, isFirebaseConfigured } from "../server/firestore.js";
import { IngestError, ingestEvaluations } from "../src/gold/server/evaluations.js";
import { COLLECTION, MAX_PER_REQUEST, describeError } from "../src/gold/types/gold.js";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

export function GET(): Response {
  return json({
    usage: 'POST { "evaluations": [ ... ] } with header "Authorization: Bearer <token>"; add ?dryRun=1 to validate without writing.',
    maxPerRequest: MAX_PER_REQUEST,
    collection: COLLECTION,
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
    return json(await ingestEvaluations(getDb(), body, dryRun));
  } catch (e) {
    if (e instanceof IngestError) return json({ error: e.message }, e.status);
    return json({ error: describeError(e) }, 500);
  }
}
