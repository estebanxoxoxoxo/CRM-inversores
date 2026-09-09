import { useEffect, useRef, useState } from "react";
import { setRating } from "../lib/investors";
import { RATING_LABELS } from "../lib/labels";
import { RATINGS, type Investor, type Rating } from "../types/investor";

/** "Calificar perfil" button with a dialog to set or clear the team's rating of an investor. */
export default function RatingDialog({ investor }: { investor: Investor }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(investor.ratingNote ?? "");

  // Another window may rate the same investor while this dialog is closed; the field follows the document.
  useEffect(() => setNote(investor.ratingNote ?? ""), [investor.ratingNote]);

  const save = async (rating: Rating | null) => {
    setSaving(true);
    setError(null);
    try {
      await setRating(investor.id, rating, note);
      dialogRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="secondary" onClick={() => dialogRef.current?.showModal()}>
        {investor.rating ? `Calificación: ${RATING_LABELS[investor.rating]}` : "Calificar perfil"}
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="rating-title">
        <h3 id="rating-title">Calificar a {investor.name}</h3>
        <p className="muted small">
          {investor.rating ? `Calificación actual: ${RATING_LABELS[investor.rating]}.` : "Sin calificación todavía."} La calificación se guarda en la base y se ve en el listado y en los filtros.
        </p>
        <label className="rating-note-field">
          Nota
          <textarea rows={3} value={note} disabled={saving} placeholder="Por qué esta calificación" onChange={(e) => setNote(e.target.value)} />
          <span className="muted small">Se guarda con la calificación y se ve arriba de todo en la ficha, en Bronce y en Gold. Descalificar también la borra.</span>
        </label>
        <div className="rating-options">
          {RATINGS.map((rating) => (
            <button key={rating} type="button" className={`rating-option rating-${rating} ${investor.rating === rating ? "current" : ""}`} disabled={saving} onClick={() => save(rating)}>
              {RATING_LABELS[rating]}
            </button>
          ))}
        </div>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          {investor.rating && (
            <button type="button" className="link-button" disabled={saving} onClick={() => save(null)}>
              Descalificar
            </button>
          )}
          <button type="button" className="link-button" disabled={saving} onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
