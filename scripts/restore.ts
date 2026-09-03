/**
 * Restores Firestore from a backup: the snapshot committed in the repo (snapshot/investors/<id>.json) or an archive
 * in the Storage bucket (see `npm run backup`).
 *
 *   npm run restore                               from the snapshot in the repo
 *   npm run restore -- --backup <name>.json       from backups/investors/<name>.json in the bucket
 *   npm run restore -- [...] --prune              also delete documents of `investors` that are not in the source
 *
 * Every document is validated first; nothing is written if any fails. Documents keep their stored `updatedAt`.
 */
import fs from "node:fs";
import path from "node:path";
import { collection, doc, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { downloadBackup, type BackupDocument } from "./lib/backup";
import { connect, explainError } from "./lib/firestore";

const SNAPSHOT_DIR = path.resolve(import.meta.dirname, "..", "snapshot", COLLECTION);
const prune = process.argv.includes("--prune");
const backupIndex = process.argv.indexOf("--backup");
const backupName = backupIndex > -1 ? process.argv[backupIndex + 1] : "";
if (backupIndex > -1 && !backupName) {
  console.error("Usage: npm run restore -- --backup <name>.json");
  process.exit(1);
}

function readSnapshot(): BackupDocument[] {
  const files = fs.existsSync(SNAPSHOT_DIR) ? fs.readdirSync(SNAPSHOT_DIR).filter((file) => file.endsWith(".json")) : [];
  if (!files.length) {
    console.error(`No snapshot found in ${SNAPSHOT_DIR}. Run npm run snapshot first.`);
    process.exit(1);
  }
  return files.map((file) => ({ id: file.replace(/\.json$/, ""), data: JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), "utf8")) as Record<string, unknown> }));
}

function validate(documents: BackupDocument[]): Investor[] {
  const investors: Investor[] = [];
  const errors: string[] = [];
  for (const { id, data } of documents) {
    try {
      investors.push(deriveInvestor({ ...data, id }));
    } catch (e) {
      errors.push(`${id}: ${describeError(e)}`);
    }
  }
  if (errors.length) {
    console.error("Documents that fail validation; nothing written:");
    for (const error of errors) console.error(" -", error);
    process.exit(1);
  }
  return investors;
}

async function write(db: Firestore, investors: Investor[]): Promise<void> {
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
    console.log(`Pruned ${stale.length} document(s) not present in the source.`);
  }
}

const db = connect();
(async () => {
  let documents: BackupDocument[];
  if (backupName) {
    const archive = await downloadBackup(backupName);
    console.log(`Backup ${backupName}: ${archive.count} documents created ${archive.createdAt}.`);
    documents = archive.documents;
  } else {
    documents = readSnapshot();
    console.log(`Snapshot: ${documents.length} documents.`);
  }
  await write(db, validate(documents));
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
