/**
 * Data access: the app subscribes to the whole `gold` collection and receives every change live. Documents that fail
 * the gold schema are reported, not silently dropped. Also the helpers over those documents that the prompt needs.
 */
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { DataError, MISSING_FIREBASE, toDataError, type InvalidDocument } from "../../lib/data";
import { getDb, isFirebaseConfigured } from "../../lib/firebase";
import { COLLECTION, EvaluationSchema, describeError, type Evaluation } from "../types/gold";

export interface GoldSnapshot {
  evaluations: Evaluation[];
  invalid: InvalidDocument[];
}

/**
 * Subscribes to the collection. `onChange` fires with every valid evaluation, newest first, on the first read and
 * on every later change; `onError` fires if the subscription fails. Returns the unsubscribe function.
 */
export function subscribeToGold(onChange: (snapshot: GoldSnapshot) => void, onError: (error: DataError) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(MISSING_FIREBASE);
    return () => {};
  }
  return onSnapshot(
    collection(getDb(), COLLECTION),
    (snapshot) => {
      const evaluations: Evaluation[] = [];
      const invalid: InvalidDocument[] = [];
      for (const doc of snapshot.docs) {
        // The document id is the key the endpoint wrote against; it wins over whatever `investorId` the body carries.
        const parsed = EvaluationSchema.safeParse({ ...doc.data(), investorId: doc.id });
        if (parsed.success) evaluations.push(parsed.data);
        else invalid.push({ id: doc.id, error: describeError(parsed.error) });
      }
      evaluations.sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt) || a.name.localeCompare(b.name));
      onChange({ evaluations, invalid });
    },
    (e) => onError(toDataError(e, COLLECTION)),
  );
}

/** Ids to subtract from the investors, whatever the aspects said: an evaluated investor never comes back. */
export const evaluatedIds = (docs: Evaluation[]): Set<string> => new Set(docs.map((evaluation) => evaluation.investorId));

/**
 * The n most recent documents that carry their related facts: the quality bar shown to the agent. The facts are
 * demanded on purpose — the examples have to show the shape asked today, and a document written before this change
 * has none, so it would teach an empty array.
 */
export const latestWithFacts = (docs: Evaluation[], n: number): Evaluation[] =>
  docs
    .filter((evaluation) => evaluation.relatedFacts.length > 0)
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
    .slice(0, n);
