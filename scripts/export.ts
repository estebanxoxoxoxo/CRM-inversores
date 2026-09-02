/**
 * Local backup of the database: dumps `investors/*` to backups/<timestamp>/ (folder ignored by git).
 * Not a source of truth; useful as a safety copy or to inspect data without the Firebase console.
 *
 * Usage: npm run export
 */
import fs from "node:fs";
import path from "node:path";
import { collection, getDocs } from "firebase/firestore";
import { COLLECTION } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";

const root = path.resolve(import.meta.dirname, "..");
const db = connect();
(async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const target = path.join(root, "backups", timestamp, COLLECTION);
  fs.mkdirSync(target, { recursive: true });
  const snapshot = await getDocs(collection(db, COLLECTION));
  for (const document of snapshot.docs) {
    fs.writeFileSync(path.join(target, `${document.id}.json`), JSON.stringify(document.data(), null, 2) + "\n", "utf8");
  }
  console.log(`Exported ${snapshot.size} documents to ${target}`);
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
