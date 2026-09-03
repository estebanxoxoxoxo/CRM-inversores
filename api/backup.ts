/**
 * Vercel function: /api/backup
 *
 *   GET   latest backup in the Storage bucket: { latest: BackupInfo | null }
 *   POST  creates and verifies a backup (same code as `npm run backup`): { backup: BackupInfo }.
 *         Requires `Authorization: Bearer <VITE_INGEST_TOKEN>`.
 *
 * Runs on the server so the verification download is not subject to the bucket's browser CORS configuration.
 */
import { isAuthorized, tokenConfigured } from "../server/auth";
import { getDb, isFirebaseConfigured } from "../server/firestore";
import { createBackup, latestBackup } from "../src/lib/backup";
import { describeError } from "../src/types/investor";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

export async function GET(): Promise<Response> {
  if (!isFirebaseConfigured()) return json({ error: "Firebase is not configured on the server" }, 500);
  try {
    getDb();
    return json({ latest: await latestBackup() });
  } catch (e) {
    return json({ error: describeError(e) }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!tokenConfigured()) return json({ error: "VITE_INGEST_TOKEN is not configured on the server" }, 500);
  if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
  if (!isFirebaseConfigured()) return json({ error: "Firebase is not configured on the server" }, 500);
  try {
    return json({ backup: await createBackup(getDb()) });
  } catch (e) {
    return json({ error: describeError(e) }, 500);
  }
}
