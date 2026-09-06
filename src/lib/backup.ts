/**
 * Backups of a Firestore collection in the Firebase Storage bucket: one JSON archive per backup under
 * `backups/<collection>/<timestamp>.json`, holding every stored document. Two collections can be backed up,
 * `investors` and `gold`. Shared by the app (backup button), the API (`api/backup.ts`) and the scripts
 * (`npm run backup`, `npm run restore`). Uses the default Firebase app, which must be initialised first.
 */
import { collection, getDocs, type Firestore } from "firebase/firestore";
import { getBytes, getMetadata, getStorage, listAll, ref, uploadBytes, type FullMetadata } from "firebase/storage";
import { COLLECTION as GOLD_COLLECTION } from "../gold/types/gold.js";
import { COLLECTION as INVESTORS_COLLECTION } from "../bronze/types/investor.js";
import { sortKeys } from "./json.js";

/** Collections that can be backed up. The first is the default of the API and the scripts. */
export const BACKUP_COLLECTIONS = [INVESTORS_COLLECTION, GOLD_COLLECTION] as const;
export type BackupCollection = (typeof BACKUP_COLLECTIONS)[number];
export const isBackupCollection = (value: string): value is BackupCollection => (BACKUP_COLLECTIONS as readonly string[]).includes(value);

const folderOf = (name: BackupCollection): string => `backups/${name}`;

export interface BackupDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface BackupArchive {
  collection: BackupCollection;
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

function buildArchive(name: BackupCollection, documents: BackupDocument[], createdAt: string): BackupArchive {
  const sorted = [...documents].sort((a, b) => a.id.localeCompare(b.id));
  return { collection: name, createdAt, count: sorted.length, documents: sorted };
}

function infoOf(metadata: FullMetadata): BackupInfo {
  const count = Number(metadata.customMetadata?.count);
  return { name: metadata.name, path: metadata.fullPath, createdAt: metadata.timeCreated, size: metadata.size, count: Number.isFinite(count) ? count : null };
}

export async function uploadBackup(archive: BackupArchive): Promise<BackupInfo> {
  const target = ref(getStorage(), `${folderOf(archive.collection)}/${backupName(archive.createdAt)}`);
  const bytes = new TextEncoder().encode(serialize(archive));
  await uploadBytes(target, bytes, { contentType: "application/json", customMetadata: { collection: archive.collection, count: String(archive.count) } });
  return infoOf(await getMetadata(target));
}

/** Downloads one archive of the collection by file name (or full path) and checks it is what it claims to be. */
export async function downloadBackup(name: BackupCollection, file: string): Promise<BackupArchive> {
  const path = file.includes("/") ? file : `${folderOf(name)}/${file}`;
  const bytes = await getBytes(ref(getStorage(), path));
  const archive = JSON.parse(new TextDecoder().decode(bytes)) as BackupArchive;
  if (archive.collection !== name || !Array.isArray(archive.documents)) throw new Error(`${path} is not a backup of ${name}`);
  if (archive.documents.length !== archive.count) throw new Error(`${path} declares ${archive.count} documents but holds ${archive.documents.length}`);
  return archive;
}

/** Every backup of the collection in the bucket, oldest first (names are timestamps). */
export async function listBackups(name: BackupCollection): Promise<BackupInfo[]> {
  const { items } = await listAll(ref(getStorage(), folderOf(name)));
  const metadata = await Promise.all(items.map((item) => getMetadata(item)));
  return metadata.map(infoOf).sort((a, b) => a.name.localeCompare(b.name));
}

/** The most recent backup of the collection, or null when the bucket holds none. Reads metadata of that one file only. */
export async function latestBackup(name: BackupCollection): Promise<BackupInfo | null> {
  const { items } = await listAll(ref(getStorage(), folderOf(name)));
  if (!items.length) return null;
  const latest = items.reduce((best, item) => (item.name > best.name ? item : best));
  return infoOf(await getMetadata(latest));
}

/**
 * Reads the whole collection as stored, uploads it as one archive, downloads it again and checks it is byte-identical.
 * Throws when the collection is empty or the verification fails.
 */
export async function createBackup(db: Firestore, name: BackupCollection): Promise<BackupInfo> {
  const snapshot = await getDocs(collection(db, name));
  if (snapshot.empty) throw new Error(`${name} is empty; nothing to back up`);
  const documents: BackupDocument[] = snapshot.docs.map((document) => ({ id: document.id, data: document.data() as Record<string, unknown> }));
  const archive = buildArchive(name, documents, new Date().toISOString());
  const info = await uploadBackup(archive);
  const restored = await downloadBackup(name, info.path);
  if (serialize(restored) !== serialize(archive)) throw new Error(`verification failed: ${info.path} differs from the data read from Firestore`);
  return info;
}
