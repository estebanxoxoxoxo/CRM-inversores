/**
 * Integrity check of the `investors` collection against the canonical type.
 *
 *   npm run integrity          validate every document and report problems; writes nothing
 *   npm run integrity -- --fix also rewrite the documents whose derived values or shape are stale
 *
 * A document is invalid when it does not satisfy the type (missing or malformed fields, values out of range, a
 * reviewed audit without reason or summaries). A document is stale when it is valid but what is stored differs from
 * the canonical form: derived values (level, band, priority, score totals and caps) that do not match the inputs, or
 * fields the type does not define. Exit code is 1 while anything is invalid or stale.
 */
import { collection, doc, getDocs, terminate, writeBatch, type Firestore } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";
import { sortKeys } from "../src/lib/json";

interface StaleDocument {
  id: string;
  canonical: Investor;
  differences: string[];
}

interface IntegrityReport {
  total: number;
  valid: number;
  invalid: { id: string; error: string }[];
  stale: StaleDocument[];
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Paths where `stored` and `canonical` differ, with both values for scalars. `updatedAt` is ignored. */
function differences(stored: unknown, canonical: unknown, path = ""): string[] {
  if (isObject(stored) && isObject(canonical)) {
    const keys = new Set([...Object.keys(stored), ...Object.keys(canonical)]);
    keys.delete("updatedAt");
    return [...keys].sort().flatMap((key) => {
      const child = path ? `${path}.${key}` : key;
      if (!(key in canonical)) return [`${child}: unknown field`];
      if (!(key in stored)) return [`${child}: missing`];
      return differences(stored[key], canonical[key], child);
    });
  }
  return JSON.stringify(sortKeys(stored)) === JSON.stringify(sortKeys(canonical)) ? [] : [`${path}: ${JSON.stringify(stored)} → ${JSON.stringify(canonical)}`];
}

async function checkIntegrity(db: Firestore): Promise<IntegrityReport> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const report: IntegrityReport = { total: snapshot.size, valid: 0, invalid: [], stale: [] };
  for (const document of snapshot.docs) {
    const stored = { ...document.data(), id: document.id } as Record<string, unknown>;
    try {
      const canonical = deriveInvestor(stored);
      report.valid++;
      const diff = differences(stored, canonical);
      if (diff.length) report.stale.push({ id: document.id, canonical, differences: diff });
    } catch (e) {
      report.invalid.push({ id: document.id, error: describeError(e) });
    }
  }
  return report;
}

/** Rewrites every stale document in its canonical form. Returns how many were written. */
async function fixStale(db: Firestore, stale: StaleDocument[]): Promise<number> {
  const now = new Date().toISOString();
  let batch = writeBatch(db);
  let batched = 0;
  for (const { id, canonical } of stale) {
    batch.set(doc(db, COLLECTION, id), { ...canonical, updatedAt: now });
    if (++batched >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      batched = 0;
    }
  }
  if (batched) await batch.commit();
  return stale.length;
}

const fix = process.argv.includes("--fix");
const db = connect();
(async () => {
  const report = await checkIntegrity(db);
  console.log(`Integrity of ${COLLECTION}: ${report.total} documents, ${report.valid} valid, ${report.invalid.length} invalid, ${report.stale.length} stale.`);
  for (const { id, error } of report.invalid) console.log(`  INVALID ${id}: ${error}`);
  for (const { id, differences: diff } of report.stale) console.log(`  STALE ${id}: ${diff.join("; ")}`);
  let unresolved = report.invalid.length + report.stale.length;
  if (fix && report.stale.length) {
    const written = await fixStale(db, report.stale);
    console.log(`Rewrote ${written} stale document(s) in canonical form.`);
    unresolved = report.invalid.length;
  } else if (report.stale.length) {
    console.log("Run with --fix to rewrite the stale documents.");
  }
  await terminate(db);
  process.exitCode = unresolved ? 1 : 0;
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
