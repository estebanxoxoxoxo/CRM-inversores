/**
 * Backs up the whole `investors` collection to the Firebase Storage bucket as one JSON archive under
 * `backups/investors/<timestamp>.json`, then downloads it again and checks it matches what was read.
 * Same code as the app's backup button (src/lib/backup.ts).
 *
 *   npm run backup            create and verify a backup
 *   npm run backup -- --list  list the backups in the bucket
 */
import { terminate } from "firebase/firestore";
import { createBackup, listBackups } from "../src/lib/backup";
import { connect, explainError } from "./lib/firestore";

const db = connect();
(async () => {
  if (process.argv.includes("--list")) {
    const backups = await listBackups();
    if (!backups.length) console.log("No backups in the bucket yet.");
    for (const backup of backups) console.log(`${backup.name}  ${Math.round(backup.size / 1024)} KB  ${backup.count ?? "?"} documents  ${backup.createdAt}`);
  } else {
    const info = await createBackup(db);
    console.log(`Uploaded and verified ${info.count} documents: ${info.path} (${Math.round(info.size / 1024)} KB).`);
  }
  // Let the process end on its own: process.exit() while sockets close trips a libuv assertion on Windows.
  await terminate(db);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
