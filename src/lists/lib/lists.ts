/**
 * Data access: the app subscribes to the whole `lists` collection and receives every change live. Documents that fail
 * the list schema are reported, not silently dropped. The writes are the four the UI makes: create, delete, membership
 * (assign to a single list) and the list's qualification; `investors` is never touched.
 */
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, writeBatch, type Unsubscribe } from "firebase/firestore";
import { DataError, MISSING_FIREBASE, toDataError, type InvalidDocument } from "../../lib/data";
import { getDb, isFirebaseConfigured } from "../../lib/firebase";
import { COLLECTION, LIST_INFO_FIELDS, ListSchema, NAME_MAX, describeError, slugify, type List, type ListInfoField, type ListParent } from "../types/list";
import { RATINGS, type Investor, type Rating, type RatingDimension, type RatingLevel } from "../../bronze/types/investor";

/** Panel order of the ratings: best (excellent) to worst (rejected), by their position in `RATINGS`. */
const RATING_ORDER: Record<Rating, number> = Object.fromEntries(RATINGS.map((rating, index) => [rating, index])) as Record<Rating, number>;
/** A list's rank for the panel: its rating's position, or last of all when it has no rating. */
const ratingRank = (list: List): number => (list.rating ? RATING_ORDER[list.rating] : RATINGS.length);

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
 * Creates an empty list under the slug of its name, in the given parent category, and returns the id. Refuses an empty
 * name, one that slugs to nothing and one already taken: the slug is the id, so two lists cannot share it without one
 * overwriting the other. The qualification starts null.
 */
export async function createList(name: string, parent: ListParent): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new DataError("La lista necesita un nombre.", "");
  if (trimmed.length > NAME_MAX) throw new DataError(`El nombre no puede pasar de ${NAME_MAX} caracteres.`, "");
  const id = slugify(trimmed);
  if (!id) throw new DataError("El nombre tiene que llevar al menos una letra o un número.", "");
  try {
    const ref = doc(getDb(), COLLECTION, id);
    if ((await getDoc(ref)).exists()) throw new DataError(`Ya existe una lista que se llama "${trimmed}".`, "");
    await setDoc(ref, { name: trimmed, createdAt: new Date().toISOString(), parent, memberIds: [], rating: null, ratingLanguageAccess: null, ratingProductFit: null, ratingGeoCapacity: null, fundSize: null, ticket: null, website: null, notes: null });
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

/**
 * Moves one investor into a single list, or out of every list. Single membership: the investor is removed from
 * whatever list currently holds it (found in `lists`) and, when `listId` is non-null, added to that one. The remove
 * and the add commit together in one batch, so no window ever sees the profile in two lists at once. Field-level array
 * writes, so two windows never overwrite each other.
 */
export async function assignToList(lists: List[], investorId: string, listId: string | null): Promise<void> {
  const current = listOfInvestor(lists, investorId);
  if ((current?.id ?? null) === listId) return; // already where it should be (also covers none → none)
  try {
    const batch = writeBatch(getDb());
    if (current) batch.update(doc(getDb(), COLLECTION, current.id), { memberIds: arrayRemove(investorId) });
    if (listId) batch.update(doc(getDb(), COLLECTION, listId), { memberIds: arrayUnion(investorId) });
    await batch.commit();
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError("No se pudo cambiar la lista del perfil.", error.help || error.message);
  }
}

/**
 * Writes the list's qualification: its rating (or null to withdraw it) and the three dimensions, which are written as
 * given whatever the rating is. The list has no note fields, and the rating does not gate the dimensions.
 */
export async function setListRating(listId: string, rating: Rating | null, dimensions: Record<RatingDimension, RatingLevel | null>): Promise<void> {
  try {
    await updateDoc(doc(getDb(), COLLECTION, listId), { rating, ...dimensions });
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo guardar la calificación de la lista ${listId}.`, error.help || error.message);
  }
}

/**
 * Writes the list's business information (`LIST_INFO_FIELDS`), each trimmed to null when empty. It touches nothing
 * else: this is the institution's fund size, ticket, page and notes, independent of the qualification.
 */
export async function setListInfo(listId: string, fields: Record<ListInfoField, string>): Promise<void> {
  try {
    const info = Object.fromEntries(LIST_INFO_FIELDS.map((field) => [field, fields[field].trim() || null]));
    await updateDoc(doc(getDb(), COLLECTION, listId), info);
  } catch (e) {
    const error = toDataError(e, COLLECTION);
    throw new DataError(`No se pudo guardar la información de la lista ${listId}.`, error.help || error.message);
  }
}

/** A parent's child lists, best-rated first (Excelente → Desaprobado), unrated last, ties broken by name. */
export function childLists(lists: List[], parent: ListParent): List[] {
  return lists.filter((list) => list.parent === parent).sort((a, b) => ratingRank(a) - ratingRank(b) || a.name.localeCompare(b.name));
}

/** The single list an investor belongs to, or null. Single membership means there is at most one. */
export function listOfInvestor(lists: List[], investorId: string): List | null {
  return lists.find((list) => list.memberIds.includes(investorId)) ?? null;
}

/**
 * The rating each investor inherits from its list: every list with a non-null rating maps its members to that rating.
 * Single membership means an investor appears under at most one list, so there is never a conflict.
 */
export function ratingByInvestor(lists: List[]): Map<string, Rating> {
  const map = new Map<string, Rating>();
  for (const list of lists) {
    if (!list.rating) continue;
    for (const id of list.memberIds) map.set(id, list.rating);
  }
  return map;
}

/**
 * The members of a list that are still in `investors`, in the order they arrive from the subscription (level first,
 * then name). Ids of profiles that left the base are dropped: they stay in the document, they just do not count.
 */
export function listMembers(list: List, investors: Investor[]): Investor[] {
  const members = new Set(list.memberIds);
  return investors.filter((investor) => members.has(investor.id));
}
