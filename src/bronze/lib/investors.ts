/**
 * Data access: the app subscribes to the whole `investors` collection and receives every change live.
 * Derived values are recomputed on read. Documents that fail validation are reported, not silently dropped.
 */
import { collection, doc, onSnapshot, updateDoc, type Unsubscribe } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type ConnectionAsked, type Investor, type Rating } from "../types/investor";
import { DataError, MISSING_FIREBASE, toDataError, type InvalidDocument } from "../../lib/data";
import { getDb, isFirebaseConfigured } from "../../lib/firebase";

export interface InvestorsSnapshot {
  investors: Investor[];
  invalid: InvalidDocument[];
}

/** Writes the team's rating (or clears it with null). The subscription reflects the change. */
export async function setRating(id: string, rating: Rating | null): Promise<void> {
  try {
    await updateDoc(doc(getDb(), COLLECTION, id), { rating, updatedAt: new Date().toISOString() });
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo guardar la calificación de ${id}.`, error.help || error.message);
  }
}

/** Writes the connection state (false, "requested" or "accepted"). The subscription reflects the change. */
export async function setConnection(id: string, connectionAsked: ConnectionAsked): Promise<void> {
  try {
    await updateDoc(doc(getDb(), COLLECTION, id), { connectionAsked, updatedAt: new Date().toISOString() });
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo guardar la conexión de ${id}.`, error.help || error.message);
  }
}

/**
 * Subscribes to the collection. `onChange` fires with the full, validated, level-sorted list on the first read and
 * on every later change; `onError` fires if the subscription fails. Returns the unsubscribe function.
 */
export function subscribeToInvestors(onChange: (snapshot: InvestorsSnapshot) => void, onError: (error: DataError) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(MISSING_FIREBASE);
    return () => {};
  }
  return onSnapshot(
    collection(getDb(), COLLECTION),
    (snapshot) => {
      const investors: Investor[] = [];
      const invalid: InvalidDocument[] = [];
      for (const doc of snapshot.docs) {
        try {
          investors.push(deriveInvestor({ ...doc.data(), id: doc.id }));
        } catch (e) {
          invalid.push({ id: doc.id, error: describeError(e) });
        }
      }
      investors.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
      onChange({ investors, invalid });
    },
    (e) => onError(toDataError(e, COLLECTION)),
  );
}
