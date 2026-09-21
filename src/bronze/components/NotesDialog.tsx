import { useEffect, useRef, useState } from "react";
import { setNotes } from "../lib/investors";
import { RATING_NOTE_LABELS } from "../lib/labels";
import { RATING_NOTE_FIELDS, type Investor, type RatingNoteField } from "../types/investor";

/** The document's structured note as form state: every field is a string, empty where the document has nothing. */
const noteFieldsOf = (investor: Investor): Record<RatingNoteField, string> =>
  Object.fromEntries(RATING_NOTE_FIELDS.map((field) => [field, investor[field] ?? ""])) as Record<RatingNoteField, string>;

/**
 * "Notas" button with a dialog for the nine structured note fields of a profile. One "Guardar" writes only the notes:
 * the qualification (rating and dimensions) now lives on the list, so this dialog never touches it.
 */
export default function NotesDialog({ investor }: { investor: Investor }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<RatingNoteField, string>>(() => noteFieldsOf(investor));

  // Another window may edit the same profile while this dialog is closed; the fields follow the document. The
  // serialised note is the dependency, so what is being typed only gets overwritten when the stored values change.
  const stored = JSON.stringify(noteFieldsOf(investor));
  useEffect(() => setFields(JSON.parse(stored) as Record<RatingNoteField, string>), [stored]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await setNotes(investor.id, fields);
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
        Notas
      </button>
      <dialog ref={dialogRef} className="dialog rating-dialog" aria-labelledby="notes-title">
        <h3 id="notes-title">Notas de {investor.name}</h3>
        <p className="muted small">La nota se ve arriba de todo en la ficha, en Bronce y en Gold, una línea por campo con contenido. La calificación va en la lista, no acá.</p>
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
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="primary" disabled={saving} onClick={save}>
            Guardar
          </button>
          <button type="button" className="link-button" disabled={saving} onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
