/**
 * Database maintenance (Firestore is the single source of truth):
 *  1. Reads every document of `investors`.
 *  2. Validates it against the type and recomputes the derived values (score.raw/caps/total, level, band, priority).
 *  3. Writes back only the documents that changed.
 *
 * Usage: npm run recalculate   (idempotent; exits with code 1 if any document fails validation)
 */
import { collection, doc, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";
import { sortKeys } from "./lib/json";

export interface RecalculateResult {
  investors: Investor[];
  rewritten: number;
  errors: string[];
}

export async function recalculateAll(db: Firestore): Promise<RecalculateResult> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const investors: Investor[] = [];
  const errors: string[] = [];
  const now = new Date().toISOString();
  let rewritten = 0;
  let batch = writeBatch(db);
  let batched = 0;
  for (const document of snapshot.docs) {
    const stored = { ...document.data(), id: document.id } as Record<string, unknown>;
    try {
      const investor = deriveInvestor(stored);
      investors.push(investor);
      const { updatedAt: _stored, ...storedRest } = stored;
      const { updatedAt: _derived, ...derivedRest } = investor;
      void _stored;
      void _derived;
      if (JSON.stringify(sortKeys(storedRest)) !== JSON.stringify(sortKeys(derivedRest))) {
        batch.set(doc(db, COLLECTION, investor.id), { ...investor, updatedAt: now });
        rewritten++;
        if (++batched >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          batched = 0;
        }
      }
    } catch (e) {
      errors.push(`${document.id}: ${describeError(e)}`);
    }
  }
  if (batched) await batch.commit();
  investors.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  return { investors, rewritten, errors };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/recalculate.ts")) {
  const db = connect();
  recalculateAll(db)
    .then(({ investors, rewritten, errors }) => {
      const byBand = investors.reduce<Record<string, number>>((acc, investor) => ((acc[investor.band] = (acc[investor.band] ?? 0) + 1), acc), {});
      console.log(`Validated ${investors.length} investors; ${rewritten} rewritten.`);
      console.log("Bands:", byBand);
      if (errors.length) {
        console.error("\nDOCUMENTS THAT FAIL VALIDATION (left untouched):");
        for (const error of errors) console.error(" -", error);
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((e: unknown) => {
      console.error("ERROR:", explainError(e));
      process.exit(1);
    });
}
