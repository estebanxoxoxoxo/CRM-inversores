/**
 * Restores a collection from a backup in the Storage bucket (see `npm run backup`).
 *
 *   npm run restore -- <name>.json                       writes every document of backups/investors/<name>.json
 *   npm run restore -- <name>.json --collection gold     the same for backups/gold/<name>.json
 *   npm run restore -- <name>.json --prune               also deletes documents of the collection that are not in the backup
 *
 * Every document is validated first (investors against the canonical type, gold against the evaluation schema);
 * nothing is written if any fails. Documents keep their stored timestamps.
 */
import { collection, doc, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { EvaluationSchema, type Evaluation } from "../src/gold/types/gold";
import { downloadBackup, type BackupCollection, type BackupDocument } from "../src/lib/backup";
import { deriveInvestor, describeError, type Investor } from "../src/bronze/types/investor";
import { collectionArgument, positionalArguments } from "./lib/collection";
import { connect, explainError } from "./lib/firestore";

const args = process.argv.slice(2);
const prune = args.includes("--prune");
const name = collectionArgument(args);
const file = positionalArguments(args)[0];
if (!file) {
  console.error("Usage: npm run restore -- <name>.json [--collection gold] [--prune]   (npm run backup -- --list shows the names)");
  process.exit(1);
}

interface Restorable {
  id: string;
  data: Investor | Evaluation;
}

function validate(documents: BackupDocument[]): Restorable[] {
  const valid: Restorable[] = [];
  const errors: string[] = [];
  for (const { id, data } of documents) {
    try {
      valid.push({ id, data: name === "gold" ? EvaluationSchema.parse({ ...data, investorId: id }) : deriveInvestor({ ...data, id }) });
    } catch (e) {
      errors.push(`${id}: ${describeError(e)}`);
    }
  }
  if (errors.length) {
    console.error("Documents that fail validation; nothing written:");
    for (const error of errors) console.error(" -", error);
    process.exit(1);
  }
  return valid;
}

async function write(db: Firestore, target: BackupCollection, documents: Restorable[]): Promise<void> {
  let batch = writeBatch(db);
  let batched = 0;
  const flush = async () => {
    if (batched) await batch.commit();
    batch = writeBatch(db);
    batched = 0;
  };
  for (const { id, data } of documents) {
    batch.set(doc(db, target, id), data);
    if (++batched >= 400) await flush();
  }
  await flush();
  console.log(`Restored ${documents.length} documents into ${target}.`);

  if (prune) {
    const ids = new Set(documents.map((document) => document.id));
    const stale = (await getDocs(collection(db, target))).docs.filter((document) => !ids.has(document.id));
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
  const archive = await downloadBackup(name, file);
  console.log(`Backup ${file} of ${name}: ${archive.count} documents created ${archive.createdAt}.`);
  await write(db, name, validate(archive.documents));
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
