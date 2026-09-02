/**
 * Restores Firestore from the snapshot committed in the repo (snapshot/investors/<id>.json).
 *
 *   npm run restore            validates every file, then writes investors/<id> for each of them
 *   npm run restore -- --prune same, and also deletes documents of `investors` that are not in the snapshot
 *
 * Nothing is written if any file fails validation. Documents keep the `updatedAt` stored in the snapshot.
 */
import fs from "node:fs";
import path from "node:path";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";

const SNAPSHOT_DIR = path.resolve(import.meta.dirname, "..", "snapshot", COLLECTION);
const prune = process.argv.includes("--prune");

const files = fs.existsSync(SNAPSHOT_DIR) ? fs.readdirSync(SNAPSHOT_DIR).filter((file) => file.endsWith(".json")) : [];
if (!files.length) {
  console.error(`No snapshot found in ${SNAPSHOT_DIR}. Run npm run snapshot first.`);
  process.exit(1);
}

const investors: Investor[] = [];
const errors: string[] = [];
for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), "utf8")) as Record<string, unknown>;
    investors.push(deriveInvestor({ ...data, id: file.replace(/\.json$/, "") }));
  } catch (e) {
    errors.push(`${file}: ${describeError(e)}`);
  }
}
if (errors.length) {
  console.error("Snapshot files that fail validation; nothing written:");
  for (const error of errors) console.error(" -", error);
  process.exit(1);
}

const db = connect();
(async () => {
  let batch = writeBatch(db);
  let batched = 0;
  const flush = async () => {
    if (batched) await batch.commit();
    batch = writeBatch(db);
    batched = 0;
  };
  for (const investor of investors) {
    batch.set(doc(db, COLLECTION, investor.id), investor);
    if (++batched >= 400) await flush();
  }
  await flush();
  console.log(`Restored ${investors.length} documents into ${COLLECTION}.`);

  if (prune) {
    const ids = new Set(investors.map((investor) => investor.id));
    const stale = (await getDocs(collection(db, COLLECTION))).docs.filter((document) => !ids.has(document.id));
    for (const document of stale) {
      batch.delete(document.ref);
      if (++batched >= 400) await flush();
    }
    await flush();
    console.log(`Pruned ${stale.length} document(s) not present in the snapshot.`);
  }
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
