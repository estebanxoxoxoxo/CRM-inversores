/**
 * Backs up the whole `investors` collection to the Firebase Storage bucket as one JSON archive under
 * `backups/investors/<timestamp>.json`, then downloads it again and checks it matches what was read.
 *
 *   npm run backup            create and verify a backup
 *   npm run backup -- --list  list the backups in the bucket
 */
import { collection, getDocs, terminate } from "firebase/firestore";
import { COLLECTION } from "../src/types/investor";
import { buildArchive, downloadBackup, listBackups, serialize, uploadBackup, type BackupDocument } from "./lib/backup";
import { connect, explainError } from "./lib/firestore";

const db = connect();
(async () => {
  if (process.argv.includes("--list")) {
    const backups = await listBackups();
    if (!backups.length) console.log("No backups in the bucket yet.");
    for (const backup of backups) console.log(`${backup.name}  ${Math.round(backup.size / 1024)} KB  ${backup.customMetadata?.count ?? "?"} documents  ${backup.updated}`);
    await terminate(db);
    return;
  }

  const snapshot = await getDocs(collection(db, COLLECTION));
  if (snapshot.empty) {
    console.error(`${COLLECTION} is empty; nothing to back up.`);
    process.exit(1);
  }
  const documents: BackupDocument[] = snapshot.docs.map((document) => ({ id: document.id, data: document.data() as Record<string, unknown> }));
  const archive = buildArchive(documents, new Date().toISOString());
  const { path, metadata } = await uploadBackup(archive);
  console.log(`Uploaded ${archive.count} documents to gs://${metadata.bucket}/${path} (${Math.round(metadata.size / 1024)} KB).`);

  const restored = await downloadBackup(path);
  const expected = serialize(archive);
  const actual = serialize(restored);
  if (actual !== expected) {
    console.error("VERIFICATION FAILED: the downloaded backup differs from what was uploaded.");
    process.exit(1);
  }
  console.log(`Verified: downloaded ${restored.count} documents, byte-identical to the data read from Firestore.`);
  // Let the process end on its own: process.exit() while sockets close trips a libuv assertion on Windows.
  await terminate(db);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
