/**
 * A list: one institution the team groups profiles under, one document per list in the `lists` collection, with the
 * slug of the name as the document id. Every list belongs to one of two fixed parent categories (`LIST_PARENTS`):
 * "vcs" (a VC firm) or "angels" (an angel investor, effectively one profile per list). The parents are hardcoded
 * constants, never Firestore documents: they are not created, renamed or deleted.
 *
 * The team's qualification lives here, on the list, not on the profile: the institution is what gets judged. A `rating`
 * (approved / doubtful / rejected / filler) plus the three qualification dimensions are set from the Listas tab, and
 * the profiles the list holds inherit its rating for their card border.
 *
 * A profile belongs to at most one list (single membership), and membership lives here, in `memberIds`, never in the
 * investor's document: this feature never writes to `investors`. The consequence is that an id can go dangling when a
 * profile leaves the base, so every reader filters the ids against the live investors before showing or counting them.
 */
import { z } from "zod";
import { normalize } from "../../lib/text";
import { RatingLevelSchema, RatingSchema } from "../../bronze/types/investor";

export const COLLECTION = "lists";
/** Characters of the name: enough for a descriptive label, short enough to fit the rows that show it. */
export const NAME_MAX = 60;

/** The two fixed parent categories a list belongs to. Hardcoded constants, never Firestore documents. */
export const LIST_PARENTS = ["vcs", "angels"] as const;
export type ListParent = (typeof LIST_PARENTS)[number];
/** Spanish UI labels for the parent codes. */
export const LIST_PARENT_LABELS: Record<ListParent, string> = { vcs: "VCs", angels: "Inversores ángeles" };

/**
 * The institution's business information, moved here from the profile because it describes the institution, not the
 * person: fund size, typical ticket, page and free notes. Free text, in the order the block shows them. Shown under
 * the qualification, before the members.
 */
export const LIST_INFO_FIELDS = ["fundSize", "ticket", "website", "notes"] as const;
export type ListInfoField = (typeof LIST_INFO_FIELDS)[number];
/** Spanish UI labels for the info fields. */
export const LIST_INFO_LABELS: Record<ListInfoField, string> = {
  fundSize: "Tamaño del fondo",
  ticket: "Ticket",
  website: "Página del VC",
  notes: "Notas",
};

export const ListSchema = z.object({
  name: z.string().min(1).max(NAME_MAX),
  /** ISO timestamp, set when the list is created. */
  createdAt: z.string(),
  /** The parent category. A legacy document written before the hierarchy has no parent, so it falls back to "vcs". */
  parent: z.enum(LIST_PARENTS).catch("vcs"),
  /** Ids of the investors in the list; defaulted so a document written without the field still parses. */
  memberIds: z.array(z.string()).default([]),
  /** The team's verdict on the institution (approved / doubtful / rejected / filler); null until someone qualifies it. */
  rating: RatingSchema.nullable().default(null),
  /**
   * The three human qualification dimensions, one level each, set from the same dialog as the rating. Independent of
   * `rating`: clearing the rating does not clear them, they survive it.
   */
  ratingLanguageAccess: RatingLevelSchema.nullable().default(null),
  ratingProductFit: RatingLevelSchema.nullable().default(null),
  ratingGeoCapacity: RatingLevelSchema.nullable().default(null),
  /**
   * The institution's business information (`LIST_INFO_FIELDS`), one flat field each, set from the Listas tab. Free
   * text, null until filled. They describe the institution, so they live on the list, not on the member profiles.
   */
  fundSize: z.string().nullable().default(null),
  ticket: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});

/** One list as the app reads it: the stored document plus the id of the document it was read from. */
export type List = z.infer<typeof ListSchema> & { id: string };

/**
 * The document id of a list. Mirrors the slug the ingest builds for investor ids (`src/bronze/server/ingest.ts`),
 * rewritten here over the shared `normalize` because the app never imports server code. Two names that slug the same
 * are the same list, which is what makes the duplicate check in `createList` work.
 */
export const slugify = (name: string): string =>
  normalize(name.trim())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
  return e instanceof Error ? e.message : String(e);
}
