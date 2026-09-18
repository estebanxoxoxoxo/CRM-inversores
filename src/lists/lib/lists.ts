/**
 * Data access: the app subscribes to the whole `lists` collection and receives every change live. Documents that fail
 * the list schema are reported, not silently dropped. The writes are the three the UI makes: create, delete and
 * membership; `investors` is never touched.
 */
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from "firebase/firestore";
import { DataError, MISSING_FIREBASE, toDataError, type InvalidDocument } from "../../lib/data";
import { getDb, isFirebaseConfigured } from "../../lib/firebase";
import { COLLECTION, ListSchema, NAME_MAX, describeError, slugify, type List } from "../types/list";
import type { Investor } from "../../bronze/types/investor";

export interface ListsSnapshot {
  lists: List[];
  invalid: InvalidDocument[];
}

/**
 * Subscribes to the collection. `onChange` fires with every valid list, by name, on the first read and on every later
 * change; `onError` fires if the subscription fails. Returns the unsubscribe function.
 */
export function subscribeToLists(onChange: (snapshot: ListsSnapshot) => void, onError: (error: DataError) => void): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(MISSING_FIREBASE);
    return () => {};
  }
  return onSnapshot(
    collection(getDb(), COLLECTION),
    (snapshot) => {
      const lists: List[] = [];
      const invalid: InvalidDocument[] = [];
      for (const doc of snapshot.docs) {
        const parsed = ListSchema.safeParse(doc.data());
        if (parsed.success) lists.push({ ...parsed.data, id: doc.id });
        else invalid.push({ id: doc.id, error: describeError(parsed.error) });
      }
      lists.sort((a, b) => a.name.localeCompare(b.name));
      onChange({ lists, invalid });
    },
    (e) => onError(toDataError(e, COLLECTION)),
  );
}

/**
 * Creates an empty list under the slug of its name and returns the id. Refuses an empty name, one that slugs to
 * nothing and one already taken: the slug is the id, so two lists cannot share it without one overwriting the other.
 */
export async function createList(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new DataError("La lista necesita un nombre.", "");
  if (trimmed.length > NAME_MAX) throw new DataError(`El nombre no puede pasar de ${NAME_MAX} caracteres.`, "");
  const id = slugify(trimmed);
  if (!id) throw new DataError("El nombre tiene que llevar al menos una letra o un número.", "");
  try {
    const ref = doc(getDb(), COLLECTION, id);
    if ((await getDoc(ref)).exists()) throw new DataError(`Ya existe una lista que se llama "${trimmed}".`, "");
    await setDoc(ref, { name: trimmed, createdAt: new Date().toISOString(), memberIds: [] });
  } catch (e) {
    if (e instanceof DataError) throw e;
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo crear la lista "${trimmed}".`, error.help || error.message);
  }
  return id;
}

/** Deletes the list. Its memberships go with it; the profiles it grouped are not touched. */
export async function deleteList(id: string): Promise<void> {
  try {
    await deleteDoc(doc(getDb(), COLLECTION, id));
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo borrar la lista ${id}.`, error.help || error.message);
  }
}

/** Puts one investor in the list or takes it out. Field-level array writes, so two windows never overwrite each other. */
export async function setMembership(listId: string, investorId: string, member: boolean): Promise<void> {
  try {
    await updateDoc(doc(getDb(), COLLECTION, listId), { memberIds: member ? arrayUnion(investorId) : arrayRemove(investorId) });
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(member ? `No se pudo agregar el perfil a la lista ${listId}.` : `No se pudo sacar el perfil de la lista ${listId}.`, error.help || error.message);
  }
}

/**
 * The members of a list that are still in `investors`, in the order they arrive from the subscription (level first,
 * then name). Ids of profiles that left the base are dropped: they stay in the document, they just do not count.
 */
export function listMembers(list: List, investors: Investor[]): Investor[] {
  const members = new Set(list.memberIds);
  return investors.filter((investor) => members.has(investor.id));
}
