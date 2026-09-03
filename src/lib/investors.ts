/**
 * Data access: the app subscribes to the whole `investors` collection and receives every change live.
 * Derived values are recomputed on read. Documents that fail validation are reported, not silently dropped.
 */
import { collection, doc, onSnapshot, updateDoc, type Unsubscribe } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor, type Rating } from "../types/investor";
import { getDb, isFirebaseConfigured } from "./firebase";

/** Error with a user-facing message and, when known, what to do about it. */
export class DataError extends Error {
  readonly help: string;
  constructor(message: string, help: string) {
    super(message);
    this.help = help;
  }
}

export interface InvalidDocument {
  id: string;
  error: string;
}

export interface InvestorsSnapshot {
  investors: Investor[];
  invalid: InvalidDocument[];
}

export function toDataError(e: unknown): DataError {
  if (e instanceof DataError) return e;
  const message = describeError(e);
  if (/permission|PERMISSION_DENIED|insufficient/i.test(message)) {
    return new DataError(
      "Firestore rechazó la lectura de la colección investors.",
      "Las reglas de seguridad de Firestore no permiten leer desde el navegador. En Firebase Console > Firestore > Reglas, permití la lectura de investors/{id}.",
    );
  }
  if (/offline|unavailable|network/i.test(message)) {
    return new DataError("Sin conexión con Firestore.", "Comprobá la red y que el proyecto de Firebase del .env sea el correcto.");
  }
  return new DataError(`Error al leer Firestore: ${message}`, "");
}

/** Writes the team's rating (or clears it with null). The subscription reflects the change. */
export async function setRating(id: string, rating: Rating | null): Promise<void> {
  try {
    await updateDoc(doc(getDb(), COLLECTION, id), { rating, updatedAt: new Date().toISOString() });
  } catch (e) {
    const error = toDataError(e);
    throw new DataError(`No se pudo guardar la calificación de ${id}.`, error.help || error.message);
  }
}

/**
 * Subscribes to the collection. `onChange` fires with the full, validated, level-sorted list on the first read and
 * on every later change; `onError` fires if the subscription fails. Returns the unsubscribe function.
 */
export function subscribeToInvestors(onChange: (snapshot: InvestorsSnapshot) => void, onError: (error: DataError) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(new DataError("Falta la configuración de Firebase.", "Completá VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID y VITE_FIREBASE_APP_ID en .env (ver .env.example)."));
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
    (e) => onError(toDataError(e)),
  );
}
