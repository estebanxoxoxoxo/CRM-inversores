/**
 * The note written with the rating, at the top of the detail. Shared by both sections: it is the same note about the
 * same investor, so it has to read the same wherever the profile is open.
 */
export const RATING_NOTE_LABEL = "Motivo de la calificación:";

export function RatingNote({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <p className="rating-note">
      <span className="rating-note-label">{RATING_NOTE_LABEL}</span> {note}
    </p>
  );
}
