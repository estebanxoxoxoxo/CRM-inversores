/**
 * Vercel function: /api/backup?collection=<investors|gold>   (investors when omitted)
 *
 *   GET   latest backup of that collection in the Storage bucket: { collection, latest: BackupInfo | null }
 *   POST  creates and verifies a backup of it (same code as `npm run backup`): { collection, backup: BackupInfo }.
 *         Requires `Authorization: Bearer <VITE_INGEST_TOKEN>`.
 *
 * Runs on the server so the verification download is not subject to the bucket's browser CORS configuration.
 */
import { isAuthorized, tokenConfigured } from "../server/auth.js";
import { getDb, isFirebaseConfigured } from "../server/firestore.js";
import { BACKUP_COLLECTIONS, createBackup, isBackupCollection, latestBackup, type BackupCollection } from "../src/lib/backup.js";
import { describeError } from "../src/bronze/types/investor.js";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

/** The collection asked for, or null when the query names an unknown one. */
function collectionOf(request: Request): BackupCollection | null {
  const value = new URL(request.url).searchParams.get("collection") ?? BACKUP_COLLECTIONS[0];
  return isBackupCollection(value) ? value : null;
}

const unknownCollection = (): Response => json({ error: `collection must be one of: ${BACKUP_COLLECTIONS.join(", ")}` }, 400);

export async function GET(request: Request): Promise<Response> {
  const name = collectionOf(request);
  if (!name) return unknownCollection();
  if (!isFirebaseConfigured()) return json({ error: "Firebase is not configured on the server" }, 500);
  try {
    getDb();
    return json({ collection: name, latest: await latestBackup(name) });
  } catch (e) {
    return json({ error: describeError(e) }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const name = collectionOf(request);
  if (!name) return unknownCollection();
  if (!tokenConfigured()) return json({ error: "VITE_INGEST_TOKEN is not configured on the server" }, 500);
  if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
  if (!isFirebaseConfigured()) return json({ error: "Firebase is not configured on the server" }, 500);
  try {
    return json({ collection: name, backup: await createBackup(getDb(), name) });
  } catch (e) {
    return json({ error: describeError(e) }, 500);
  }
}
