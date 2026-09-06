/**
 * Backs up a whole collection (`investors` by default, or `gold`) to the Firebase Storage bucket as one JSON archive
 * under `backups/<collection>/<timestamp>.json`, then downloads it again and checks it matches what was read.
 * Same code as the app's backup button (src/lib/backup.ts).
 *
 *   npm run backup                                  create and verify a backup of investors
 *   npm run backup -- --collection gold             the same for gold
 *   npm run backup -- --list [--collection gold]    list the backups of that collection in the bucket
 */
import { terminate } from "firebase/firestore";
import { createBackup, listBackups } from "../src/lib/backup";
import { collectionArgument } from "./lib/collection";
import { connect, explainError } from "./lib/firestore";

const name = collectionArgument(process.argv.slice(2));
const db = connect();
(async () => {
  if (process.argv.includes("--list")) {
    const backups = await listBackups(name);
    if (!backups.length) console.log(`No backups of ${name} in the bucket yet.`);
    for (const backup of backups) console.log(`${backup.name}  ${Math.round(backup.size / 1024)} KB  ${backup.count ?? "?"} documents  ${backup.createdAt}`);
  } else {
    const info = await createBackup(db, name);
    console.log(`Uploaded and verified ${info.count} documents of ${name}: ${info.path} (${Math.round(info.size / 1024)} KB).`);
  }
  // Let the process end on its own: process.exit() while sockets close trips a libuv assertion on Windows.
  await terminate(db);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
