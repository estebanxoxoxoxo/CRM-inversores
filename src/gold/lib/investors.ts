/** Reading of the `investors` collection: the digests the prompt shows, in the order the batch is taken. */
import { collection, getDocs, type Firestore } from "firebase/firestore";
import { INVESTORS_COLLECTION } from "../types/gold";
import { parseInvestorDigest, type InvestorDigest } from "../types/investor";

/** Best first: the batch is the head of this order, so the highest levels get evaluated before the rest. */
export const byLevelThenName = (a: InvestorDigest, b: InvestorDigest): number => b.level - a.level || a.name.localeCompare(b.name, "es");

export async function readInvestors(db: Firestore): Promise<InvestorDigest[]> {
  const snapshot = await getDocs(collection(db, INVESTORS_COLLECTION));
  return snapshot.docs.map((document) => parseInvestorDigest(document.id, document.data())).sort(byLevelThenName);
}
