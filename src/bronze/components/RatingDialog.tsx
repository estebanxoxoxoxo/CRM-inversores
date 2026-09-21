import { useEffect, useRef, useState } from "react";
import { setRating } from "../lib/investors";
import { RATING_DIMENSION_LABELS, RATING_DIMENSION_OPTIONS, RATING_LABELS, RATING_LEVEL_LABELS, RATING_NOTE_LABELS } from "../lib/labels";
import { RATING_DIMENSIONS, RATING_NOTE_FIELDS, RATINGS, type Investor, type Rating, type RatingDimension, type RatingLevel, type RatingNoteField } from "../types/investor";

/** The document's structured note as form state: every field is a string, empty where the document has nothing. */
const noteFieldsOf = (investor: Investor): Record<RatingNoteField, string> =>
  Object.fromEntries(RATING_NOTE_FIELDS.map((field) => [field, investor[field] ?? ""])) as Record<RatingNoteField, string>;

/** The document's qualification dimensions as form state: a null document value shows as `none` ("Nulo/a"). */
const dimensionsOf = (investor: Investor): Record<RatingDimension, RatingLevel> =>
  Object.fromEntries(RATING_DIMENSIONS.map((dimension) => [dimension, investor[dimension] ?? "none"])) as Record<RatingDimension, RatingLevel>;

/**
 * "Calificar perfil" button with a dialog to set or clear the team's rating of an investor, with its structured note
 * and the three qualification dimensions, which one click saves together. Clearing the rating leaves the dimensions.
 */
/** A dimension's options, plus the current value when it is one the dimension no longer offers, so nothing stored is hidden. */
const optionsFor = (dimension: RatingDimension, current: RatingLevel): { value: RatingLevel; label: string }[] => {
  const options = RATING_DIMENSION_OPTIONS[dimension];
  return options.some((option) => option.value === current) ? options : [{ value: current, label: RATING_LEVEL_LABELS[current] }, ...options];
};

export default function RatingDialog({ investor }: { investor: Investor }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<RatingNoteField, string>>(() => noteFieldsOf(investor));
  const [dimensions, setDimensions] = useState<Record<RatingDimension, RatingLevel>>(() => dimensionsOf(investor));

  // Another window may rate the same investor while this dialog is closed; the fields follow the document. The
  // serialised note is the dependency, so what is being typed only gets overwritten when the stored values change.
  const stored = JSON.stringify(noteFieldsOf(investor));
  useEffect(() => setFields(JSON.parse(stored) as Record<RatingNoteField, string>), [stored]);

  const storedDimensions = JSON.stringify(dimensionsOf(investor));
  useEffect(() => setDimensions(JSON.parse(storedDimensions) as Record<RatingDimension, RatingLevel>), [storedDimensions]);

  const save = async (rating: Rating | null) => {
    setSaving(true);
    setError(null);
    try {
      await setRating(investor.id, rating, fields, dimensions);
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
      <dialog ref={dialogRef} className="dialog rating-dialog" aria-labelledby="rating-title">
        <h3 id="rating-title">Calificar a {investor.name}</h3>
        <p className="muted small">
          {investor.rating ? `Calificación actual: ${RATING_LABELS[investor.rating]}.` : "Sin calificación todavía."} La calificación se guarda en la base y se ve en el listado y en los filtros.
        </p>
        <div className="rating-note-grid">
          {RATING_NOTE_FIELDS.map((field) => (
            <label key={field} className="rating-note-row">
              <span>{RATING_NOTE_LABELS[field]}</span>
              {field === "ratingNoteNotes" ? (
                <textarea rows={3} value={fields[field]} disabled={saving} onChange={(e) => setFields((current) => ({ ...current, [field]: e.target.value }))} />
              ) : (
                <input type="text" value={fields[field]} disabled={saving} onChange={(e) => setFields((current) => ({ ...current, [field]: e.target.value }))} />
              )}
            </label>
          ))}
        </div>
        <div className="rating-level-list">
          {RATING_DIMENSIONS.map((dimension) => (
            <label key={dimension} className="rating-level-row">
              <span>{RATING_DIMENSION_LABELS[dimension]}</span>
              <select value={dimensions[dimension]} disabled={saving} onChange={(e) => setDimensions((current) => ({ ...current, [dimension]: e.target.value as RatingLevel }))}>
                {optionsFor(dimension, dimensions[dimension]).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="muted small">
          La nota se guarda con la calificación y se ve arriba de todo en la ficha, en Bronce y en Gold. Descalificar también la borra. Las tres dimensiones se
          guardan al mismo tiempo, pero Descalificar no las borra.
        </p>
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
