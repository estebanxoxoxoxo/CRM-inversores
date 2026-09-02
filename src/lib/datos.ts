/**
 * Capa de datos: Firestore únicamente.
 * - Listado: documento `meta/indice` (resumen de todos los perfiles).
 * - Ficha: documento `inversores/{id}`.
 * Firestore es la única fuente de verdad. Lo derivado (nivel, banda, prioridad, totales) se recalcula al leer.
 */
import { doc, getDoc } from "firebase/firestore";
import { IndiceSchema, derivar, derivarResumen, type Indice, type Inversor } from "../types/inversor";
import { configFirebaseDisponible, firestore } from "./firebase";

export class ErrorDatos extends Error {
  readonly ayuda: string;
  constructor(message: string, ayuda: string) {
    super(message);
    this.ayuda = ayuda;
  }
}

function traducir(e: unknown, contexto: string): ErrorDatos {
  const msg = e instanceof Error ? e.message : String(e);
  if (/permission|PERMISSION_DENIED|insufficient/i.test(msg)) {
    return new ErrorDatos(
      `Firestore rechazó la lectura de ${contexto}.`,
      "Las reglas de seguridad de Firestore no permiten leer desde el navegador. En Firebase Console > Firestore > Reglas, permití la lectura de meta/indice e inversores/{id} (por ejemplo `allow read: if true;` mientras la app sea de uso interno).",
    );
  }
  if (/offline|unavailable|network/i.test(msg)) {
    return new ErrorDatos(`Sin conexión con Firestore al leer ${contexto}.`, "Comprobá la red y que el proyecto de Firebase del .env sea el correcto.");
  }
  return new ErrorDatos(`Error al leer ${contexto}: ${msg}`, "");
}

export async function cargarIndice(): Promise<Indice> {
  if (!configFirebaseDisponible()) {
    throw new ErrorDatos("Falta la configuración de Firebase.", "Completá VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID y VITE_FIREBASE_APP_ID en .env (ver .env.example).");
  }
  let snap;
  try {
    snap = await getDoc(doc(firestore(), "meta", "indice"));
  } catch (e) {
    throw traducir(e, "meta/indice");
  }
  if (!snap.exists()) {
    throw new ErrorDatos("El índice meta/indice no existe en Firestore.", "Ejecutá `npm run subir` para cargar los perfiles y el índice.");
  }
  const indice = IndiceSchema.parse(snap.data());
  return { ...indice, perfiles: indice.perfiles.map(derivarResumen) };
}

const cachePerfiles = new Map<string, Promise<Inversor>>();

export function cargarPerfil(id: string): Promise<Inversor> {
  let p = cachePerfiles.get(id);
  if (!p) {
    p = (async () => {
      let snap;
      try {
        snap = await getDoc(doc(firestore(), "inversores", id));
      } catch (e) {
        throw traducir(e, `inversores/${id}`);
      }
      if (!snap.exists()) throw new ErrorDatos(`El perfil inversores/${id} no existe en Firestore.`, "Ejecutá `npm run subir` para sincronizar los perfiles.");
      return derivar({ ...snap.data(), id });
    })();
    cachePerfiles.set(id, p);
    p.catch(() => cachePerfiles.delete(id));
  }
  return p;
}
