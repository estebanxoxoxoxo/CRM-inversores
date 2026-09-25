/**
 * The note written with the rating, at the top of the detail. Shared by both sections: it is the same note about the
 * same investor, so it has to read the same wherever the profile is open. The structured fields come first, in the
 * order the dialog asks for them.
 */
import { RATING_NOTE_LABELS } from "../bronze/lib/labels";
import { RATING_NOTE_FIELDS, VC_LIST_HIDDEN_NOTE_FIELDS, type Investor } from "../bronze/types/investor";

export const RATING_NOTE_LABEL = "Motivo de la calificación:";

/** `hideVc` drops the institution's lines (`VC_LIST_HIDDEN_NOTE_FIELDS`): for a profile in a VC list, the VC name and
 * its location belong to the list, so here they would only repeat it. */
export function RatingNote({ investor, hideVc = false }: { investor: Investor | null; hideVc?: boolean }) {
  if (!investor) return null;
  const lines: string[] = [];
  for (const field of RATING_NOTE_FIELDS) {
    if (hideVc && VC_LIST_HIDDEN_NOTE_FIELDS.includes(field)) continue;
    const value = investor[field]?.trim();
    if (value) lines.push(`${RATING_NOTE_LABELS[field]}: ${value}`);
  }
  if (!lines.length) return null;
  return (
    <p className="rating-note">
      <span className="rating-note-label">{RATING_NOTE_LABEL}</span>
      {`\n${lines.join("\n")}`}
    </p>
  );
}
