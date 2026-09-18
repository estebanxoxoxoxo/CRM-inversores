/**
 * The note written with the rating, at the top of the detail. Shared by both sections: it is the same note about the
 * same investor, so it has to read the same wherever the profile is open. The structured fields come first, in the
 * order the dialog asks for them; the legacy free-text note shows only while a profile has no structured fields
 * yet, so a migrated note is never displayed twice.
 */
import { RATING_NOTE_LABELS } from "../bronze/lib/labels";
import { RATING_NOTE_FIELDS, type Investor } from "../bronze/types/investor";

export const RATING_NOTE_LABEL = "Motivo de la calificación:";

export function RatingNote({ investor }: { investor: Investor | null }) {
  if (!investor) return null;
  const lines: string[] = [];
  for (const field of RATING_NOTE_FIELDS) {
    const value = investor[field]?.trim();
    if (value) lines.push(`${RATING_NOTE_LABELS[field]}: ${value}`);
  }
  const legacy = investor.ratingNote?.trim();
  if (legacy && !lines.length) lines.push(legacy);
  if (!lines.length) return null;
  return (
    <p className="rating-note">
      <span className="rating-note-label">{RATING_NOTE_LABEL}</span>
      {`\n${lines.join("\n")}`}
    </p>
  );
}
