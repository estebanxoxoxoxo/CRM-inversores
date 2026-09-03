/**
 * Restores Firestore from a backup in the Storage bucket (see `npm run backup`).
 *
 *   npm run restore -- <name>.json           writes every document of backups/investors/<name>.json
 *   npm run restore -- <name>.json --prune   also deletes documents of `investors` that are not in the backup
 *
 * Every document is validated first; nothing is written if any fails. Documents keep their stored `updatedAt`.
 */
import { collection, doc, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { downloadBackup, type BackupDocument } from "../src/lib/backup";
import { connect, explainError } from "./lib/firestore";

const prune = process.argv.includes("--prune");
const name = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
if (!name) {
  console.error("Usage: npm run restore -- <name>.json [--prune]   (npm run backup -- --list shows the names)");
  process.exit(1);
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
    console.log(`Pruned ${stale.length} document(s) not present in the backup.`);
  }
}

const db = connect();
(async () => {
  const archive = await downloadBackup(name);
  console.log(`Backup ${name}: ${archive.count} documents created ${archive.createdAt}.`);
  await write(db, validate(archive.documents));
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
