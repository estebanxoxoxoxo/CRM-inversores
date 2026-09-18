/**
 * A list: a name and the investors the team put under it, one document per list in the `lists` collection, with the
 * slug of the name as the document id. Lists are the team's own groupings ("Inversores ángel", "VC A"), free-form and
 * written only from the app: nothing derives from them and no agent produces them.
 *
 * A profile belongs to as many lists as the team wants, and membership lives here, in `memberIds`, never in the
 * investor's document: this feature never writes to `investors`. The consequence is that an id can go dangling when a
 * profile leaves the base, so every reader filters the ids against the live investors before showing or counting them.
 */
import { z } from "zod";
import { normalize } from "../../lib/text";

export const COLLECTION = "lists";
/** Characters of the name: enough for a descriptive label, short enough to fit the rows that show it. */
export const NAME_MAX = 60;

export const ListSchema = z.object({
  name: z.string().min(1).max(NAME_MAX),
  /** ISO timestamp, set when the list is created. */
  createdAt: z.string(),
  /** Ids of the investors in the list; defaulted so a document written without the field still parses. */
  memberIds: z.array(z.string()).default([]),
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
