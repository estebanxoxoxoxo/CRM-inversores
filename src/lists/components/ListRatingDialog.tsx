import { useEffect, useRef, useState } from "react";
import { setListRating } from "../lib/lists";
import type { List } from "../types/list";
import { RATING_DIMENSION_LABELS, RATING_DIMENSION_OPTIONS, RATING_LABELS, RATING_LEVEL_LABELS } from "../../bronze/lib/labels";
import { RATING_DIMENSIONS, RATINGS, type Rating, type RatingDimension, type RatingLevel } from "../../bronze/types/investor";

/** The list's qualification dimensions as form state: a null document value shows as `none` ("Nulo/a"). */
const dimensionsOf = (list: List): Record<RatingDimension, RatingLevel> =>
  Object.fromEntries(RATING_DIMENSIONS.map((dimension) => [dimension, list[dimension] ?? "none"])) as Record<RatingDimension, RatingLevel>;

/** A dimension's options, plus the current value when it is one the dimension no longer offers, so nothing stored is hidden. */
const optionsFor = (dimension: RatingDimension, current: RatingLevel): { value: RatingLevel; label: string }[] => {
  const options = RATING_DIMENSION_OPTIONS[dimension];
  return options.some((option) => option.value === current) ? options : [{ value: current, label: RATING_LEVEL_LABELS[current] }, ...options];
};

/**
 * "Calificar" button with a dialog to set or clear the team's qualification of a LIST (an institution): the rating and
 * the three dimensions, which one click saves together. Clearing the rating leaves the dimensions, as on the profile.
 */
export default function ListRatingDialog({ list }: { list: List }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Record<RatingDimension, RatingLevel>>(() => dimensionsOf(list));

  // Another window may rate the same list while this dialog is closed; the selects follow the document. The serialised
  // value is the dependency, so what is being chosen only gets overwritten when the stored values change.
  const stored = JSON.stringify(dimensionsOf(list));
  useEffect(() => setDimensions(JSON.parse(stored) as Record<RatingDimension, RatingLevel>), [stored]);

  const save = async (rating: Rating | null) => {
    setSaving(true);
    setError(null);
    try {
      await setListRating(list.id, rating, dimensions);
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
        {list.rating ? `Calificación: ${RATING_LABELS[list.rating]}` : "Calificar"}
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="list-rating-title">
        <h3 id="list-rating-title">Calificar {list.name}</h3>
        <p className="muted small">
          {list.rating ? `Calificación actual: ${RATING_LABELS[list.rating]}.` : "Sin calificación todavía."} Es de la lista y pinta el borde de las tarjetas de sus perfiles.
        </p>
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
        <p className="muted small">Las tres dimensiones se guardan al mismo tiempo que la calificación, pero Descalificar no las borra.</p>
        <div className="rating-options">
          {RATINGS.map((rating) => (
            <button key={rating} type="button" className={`rating-option rating-${rating} ${list.rating === rating ? "current" : ""}`} disabled={saving} onClick={() => save(rating)}>
              {RATING_LABELS[rating]}
            </button>
          ))}
        </div>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          {list.rating && (
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
