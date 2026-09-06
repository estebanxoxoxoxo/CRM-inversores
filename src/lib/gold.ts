/**
 * Data access for the `gold` collection: the app subscribes to every evaluation and receives changes live.
 * Documents that fail the gold schema are reported, not silently dropped, as with the investors.
 */
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { COLLECTION, EvaluationSchema, describeError, type Evaluation } from "../gold/types/gold";
import { getDb, isFirebaseConfigured } from "./firebase";
import { DataError, toDataError, type InvalidDocument } from "./investors";

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
    onError(new DataError("Falta la configuración de Firebase.", "Completá VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID y VITE_FIREBASE_APP_ID en .env (ver .env.example)."));
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
