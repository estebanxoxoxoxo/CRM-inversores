/**
 * Backups of the `investors` collection in the Firebase Storage bucket: one JSON archive per backup under
 * `backups/investors/<timestamp>.json`, holding every stored document. Shared by the app (backup button) and the
 * scripts (`npm run backup`, `npm run restore`). Uses the default Firebase app, which must be initialised first.
 */
import { collection, getDocs, type Firestore } from "firebase/firestore";
import { getBytes, getMetadata, getStorage, listAll, ref, uploadBytes, type FullMetadata } from "firebase/storage";
import { COLLECTION } from "../types/investor.js";
import { sortKeys } from "./json.js";

const BACKUP_FOLDER = `backups/${COLLECTION}`;

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

/** What the app and the listing show about a backup in the bucket. */
export interface BackupInfo {
  name: string;
  path: string;
  /** ISO timestamp of the upload. */
  createdAt: string;
  /** Bytes. */
  size: number;
  /** Documents in the archive, when the metadata carries it. */
  count: number | null;
}

const backupName = (createdAt: string): string => `${createdAt.replace(/[:.]/g, "-").slice(0, 19)}.json`;

/** Canonical JSON of the archive: keys sorted so two backups of the same data are byte-identical. */
const serialize = (archive: BackupArchive): string => JSON.stringify(sortKeys(archive), null, 2) + "\n";

function buildArchive(documents: BackupDocument[], createdAt: string): BackupArchive {
  const sorted = [...documents].sort((a, b) => a.id.localeCompare(b.id));
  return { collection: COLLECTION, createdAt, count: sorted.length, documents: sorted };
}

function infoOf(metadata: FullMetadata): BackupInfo {
  const count = Number(metadata.customMetadata?.count);
  return { name: metadata.name, path: metadata.fullPath, createdAt: metadata.timeCreated, size: metadata.size, count: Number.isFinite(count) ? count : null };
}

export async function uploadBackup(archive: BackupArchive): Promise<BackupInfo> {
  const target = ref(getStorage(), `${BACKUP_FOLDER}/${backupName(archive.createdAt)}`);
  const bytes = new TextEncoder().encode(serialize(archive));
  await uploadBytes(target, bytes, { contentType: "application/json", customMetadata: { collection: archive.collection, count: String(archive.count) } });
  return infoOf(await getMetadata(target));
}

export async function downloadBackup(name: string): Promise<BackupArchive> {
  const path = name.includes("/") ? name : `${BACKUP_FOLDER}/${name}`;
  const bytes = await getBytes(ref(getStorage(), path));
  const archive = JSON.parse(new TextDecoder().decode(bytes)) as BackupArchive;
  if (archive.collection !== COLLECTION || !Array.isArray(archive.documents)) throw new Error(`${path} is not a backup of ${COLLECTION}`);
  if (archive.documents.length !== archive.count) throw new Error(`${path} declares ${archive.count} documents but holds ${archive.documents.length}`);
  return archive;
}

/** Every backup in the bucket, oldest first (names are timestamps). */
export async function listBackups(): Promise<BackupInfo[]> {
  const { items } = await listAll(ref(getStorage(), BACKUP_FOLDER));
  const metadata = await Promise.all(items.map((item) => getMetadata(item)));
  return metadata.map(infoOf).sort((a, b) => a.name.localeCompare(b.name));
}

/** The most recent backup, or null when the bucket holds none. Reads metadata of that one file only. */
export async function latestBackup(): Promise<BackupInfo | null> {
  const { items } = await listAll(ref(getStorage(), BACKUP_FOLDER));
  if (!items.length) return null;
  const latest = items.reduce((best, item) => (item.name > best.name ? item : best));
  return infoOf(await getMetadata(latest));
}

/**
 * Reads the whole collection as stored, uploads it as one archive, downloads it again and checks it is byte-identical.
 * Throws when the collection is empty or the verification fails.
 */
export async function createBackup(db: Firestore): Promise<BackupInfo> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  if (snapshot.empty) throw new Error(`${COLLECTION} is empty; nothing to back up`);
  const documents: BackupDocument[] = snapshot.docs.map((document) => ({ id: document.id, data: document.data() as Record<string, unknown> }));
  const archive = buildArchive(documents, new Date().toISOString());
  const info = await uploadBackup(archive);
  const restored = await downloadBackup(info.path);
  if (serialize(restored) !== serialize(archive)) throw new Error(`verification failed: ${info.path} differs from the data read from Firestore`);
  return info;
}
