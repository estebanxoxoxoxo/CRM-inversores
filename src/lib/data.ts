/** Errors and reports shared by the Firestore subscriptions of both sections. */
import { describeError } from "../bronze/types/investor";

/** Error with a user-facing message and, when known, what to do about it. */
export class DataError extends Error {
  readonly help: string;
  constructor(message: string, help: string) {
    super(message);
    this.help = help;
  }
}

/** A stored document that does not satisfy its type: reported, never silently dropped. */
export interface InvalidDocument {
  id: string;
  error: string;
}

export function toDataError(e: unknown, collectionName: string): DataError {
  if (e instanceof DataError) return e;
  const message = describeError(e);
  if (/permission|PERMISSION_DENIED|insufficient/i.test(message)) {
    return new DataError(
      `Firestore rechazó la lectura de la colección ${collectionName}.`,
      `Las reglas de seguridad de Firestore no permiten leer desde el navegador. En Firebase Console > Firestore > Reglas, permití la lectura de ${collectionName}/{id}.`,
    );
  }
  if (/offline|unavailable|network/i.test(message)) {
    return new DataError("Sin conexión con Firestore.", "Comprobá la red y que el proyecto de Firebase del .env sea el correcto.");
  }
  return new DataError(`Error al leer Firestore: ${message}`, "");
}

export const MISSING_FIREBASE = new DataError("Falta la configuración de Firebase.", "Completá VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID y VITE_FIREBASE_APP_ID en .env (ver .env.example).");
