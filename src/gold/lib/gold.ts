/** Reading of the `gold` collection: what is already evaluated (the exclusions) and what serves as an example. */
import { collection, getDocs, type Firestore } from "firebase/firestore";
import { COLLECTION, EvaluationSchema, type Evaluation } from "../types/gold";

/**
 * A document that does not parse is skipped instead of breaking the run: it is still in the collection, so the
 * endpoint keeps refusing to evaluate that investor again, and the batch only loses one exclusion line.
 */
export async function readGold(db: Firestore): Promise<Evaluation[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const evaluations: Evaluation[] = [];
  for (const document of snapshot.docs) {
    const parsed = EvaluationSchema.safeParse({ ...document.data(), investorId: document.id });
    if (parsed.success) evaluations.push(parsed.data);
  }
  return evaluations;
}

/** Ids to subtract from the investors, whatever the verdict was: an evaluated investor never comes back. */
export const evaluatedIds = (docs: Evaluation[]): Set<string> => new Set(docs.map((evaluation) => evaluation.investorId));

/** The n most recent documents with verdict gold: the quality bar shown to the agent. */
export const latestGold = (docs: Evaluation[], n: number): Evaluation[] =>
  docs
    .filter((evaluation) => evaluation.verdict === "gold")
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
    .slice(0, n);
