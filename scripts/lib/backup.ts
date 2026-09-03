/**
 * Backups of the database in the Firebase Storage bucket: one JSON archive per backup under `backups/investors/`,
 * holding every document of the collection. Shared by `npm run backup` and `npm run restore -- --backup`.
 */
import { getBytes, getMetadata, getStorage, listAll, ref, uploadBytes, type FullMetadata } from "firebase/storage";
import { COLLECTION } from "../../src/types/investor";
import { sortKeys } from "./json";

export const BACKUP_FOLDER = `backups/${COLLECTION}`;

export interface BackupDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface BackupArchive {
  collection: string;
  createdAt: string;
  count: number;
  documents: BackupDocument[];
}

export const backupName = (createdAt: string): string => `${createdAt.replace(/[:.]/g, "-").slice(0, 19)}.json`;

/** Canonical JSON of the archive: keys sorted so two backups of the same data are byte-identical. */
export const serialize = (archive: BackupArchive): string => JSON.stringify(sortKeys(archive), null, 2) + "\n";

export function buildArchive(documents: BackupDocument[], createdAt: string): BackupArchive {
  const sorted = [...documents].sort((a, b) => a.id.localeCompare(b.id));
  return { collection: COLLECTION, createdAt, count: sorted.length, documents: sorted };
}

export async function uploadBackup(archive: BackupArchive): Promise<{ path: string; metadata: FullMetadata }> {
  const path = `${BACKUP_FOLDER}/${backupName(archive.createdAt)}`;
  const target = ref(getStorage(), path);
  const bytes = new TextEncoder().encode(serialize(archive));
  await uploadBytes(target, bytes, { contentType: "application/json", customMetadata: { collection: archive.collection, count: String(archive.count) } });
  return { path, metadata: await getMetadata(target) };
}

export async function downloadBackup(name: string): Promise<BackupArchive> {
  const path = name.includes("/") ? name : `${BACKUP_FOLDER}/${name}`;
  const bytes = await getBytes(ref(getStorage(), path));
  const archive = JSON.parse(new TextDecoder().decode(bytes)) as BackupArchive;
  if (archive.collection !== COLLECTION || !Array.isArray(archive.documents)) throw new Error(`${path} is not a backup of ${COLLECTION}`);
  if (archive.documents.length !== archive.count) throw new Error(`${path} declares ${archive.count} documents but holds ${archive.documents.length}`);
  return archive;
}

export async function listBackups(): Promise<FullMetadata[]> {
  const { items } = await listAll(ref(getStorage(), BACKUP_FOLDER));
  const metadata = await Promise.all(items.map((item) => getMetadata(item)));
  return metadata.sort((a, b) => a.name.localeCompare(b.name));
}
