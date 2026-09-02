/**
 * Disaster-recovery snapshot, committed to the repo.
 *
 * Writes every document of `investors` to snapshot/investors/<id>.json (keys sorted, so git diffs stay readable)
 * and removes files of documents that no longer exist. The snapshot is not a source of truth: it is what
 * `npm run restore` puts back into Firestore if the database is damaged.
 *
 * Usage: npm run snapshot   (then commit the result)
 */
import fs from "node:fs";
import path from "node:path";
import { collection, getDocs } from "firebase/firestore";
import { COLLECTION } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";
import { sortKeys } from "./lib/json";

export const SNAPSHOT_DIR = path.resolve(import.meta.dirname, "..", "snapshot", COLLECTION);

const db = connect();
(async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  if (snapshot.empty) {
    console.error(`${COLLECTION} is empty; the existing snapshot is left untouched.`);
    process.exit(1);
  }
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const keep = new Set<string>();
  for (const document of snapshot.docs) {
    const file = `${document.id}.json`;
    keep.add(file);
    fs.writeFileSync(path.join(SNAPSHOT_DIR, file), JSON.stringify(sortKeys(document.data()), null, 2) + "\n", "utf8");
  }
  let removed = 0;
  for (const file of fs.readdirSync(SNAPSHOT_DIR)) {
    if (file.endsWith(".json") && !keep.has(file)) {
      fs.unlinkSync(path.join(SNAPSHOT_DIR, file));
      removed++;
    }
  }
  console.log(`Snapshot: ${snapshot.size} documents written to ${SNAPSHOT_DIR}${removed ? `, ${removed} stale file(s) removed` : ""}. Commit it.`);
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
