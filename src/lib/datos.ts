/**
 * Capa de datos. Fuente primaria: Firestore (`meta/indice` para el listado, `inversores/{id}` para el detalle).
 * Si Firestore no está configurado o rechaza la lectura (reglas), cae a los JSON locales de /data.
 * Se puede forzar con VITE_FUENTE_DATOS=local | firestore.
 */
import { doc, getDoc } from "firebase/firestore";
import { IndiceSchema, InversorSchema, resumenDe, type Indice, type Inversor } from "../types/inversor";
import { configFirebaseDisponible, firestore } from "./firebase";

export type Fuente = "firestore" | "local";

const modulosLocales = import.meta.glob<{ default: unknown }>("../../data/perfiles/*.json");
const indiceLocal = import.meta.glob<{ default: unknown }>("../../data/indice.json");

let fuenteActual: Fuente | null = null;
const oyentes = new Set<(f: Fuente) => void>();
export function suscribirFuente(cb: (f: Fuente) => void): () => void {
  oyentes.add(cb);
  if (fuenteActual) cb(fuenteActual);
  return () => oyentes.delete(cb);
}
function fijarFuente(f: Fuente) {
  if (fuenteActual !== f) {
    fuenteActual = f;
    oyentes.forEach((cb) => cb(f));
  }
}

const preferencia = (import.meta.env.VITE_FUENTE_DATOS as Fuente | undefined) ?? (configFirebaseDisponible() ? "firestore" : "local");

async function indiceLocalCargar(): Promise<Indice> {
  const cargador = Object.values(indiceLocal)[0];
  if (!cargador) throw new Error("No existe data/indice.json; ejecutá `npm run importar`.");
  return IndiceSchema.parse((await cargador()).default);
}

async function perfilLocalCargar(id: string): Promise<Inversor> {
  const ruta = Object.keys(modulosLocales).find((k) => k.endsWith(`/${id}.json`));
  if (!ruta) throw new Error(`No existe data/perfiles/${id}.json`);
  return InversorSchema.parse((await modulosLocales[ruta]()).default);
}

export async function cargarIndice(): Promise<Indice> {
  if (preferencia === "firestore") {
    try {
      const snap = await getDoc(doc(firestore(), "meta", "indice"));
      if (snap.exists()) {
        fijarFuente("firestore");
        return IndiceSchema.parse(snap.data());
      }
      console.warn("meta/indice no existe en Firestore; usando datos locales.");
    } catch (e) {
      console.warn("Firestore no disponible para lectura; usando datos locales.", e);
    }
  }
  fijarFuente("local");
  return indiceLocalCargar();
}

const cachePerfiles = new Map<string, Promise<Inversor>>();
export function cargarPerfil(id: string): Promise<Inversor> {
  let p = cachePerfiles.get(id);
  if (!p) {
    p = (async () => {
      if (fuenteActual === "firestore") {
        try {
          const snap = await getDoc(doc(firestore(), "inversores", id));
          if (snap.exists()) return InversorSchema.parse(snap.data());
        } catch (e) {
          console.warn(`inversores/${id} no legible en Firestore; usando local.`, e);
        }
      }
      return perfilLocalCargar(id);
    })();
    cachePerfiles.set(id, p);
    p.catch(() => cachePerfiles.delete(id));
  }
  return p;
}

/** Índice completo a partir de los perfiles locales (por si el índice guardado quedara desfasado). */
export async function reconstruirIndiceLocal(): Promise<Indice> {
  const perfiles = await Promise.all(Object.values(modulosLocales).map(async (c) => InversorSchema.parse((await c()).default)));
  return { generado: new Date().toISOString().slice(0, 10), total: perfiles.length, perfiles: perfiles.map(resumenDe) };
}
