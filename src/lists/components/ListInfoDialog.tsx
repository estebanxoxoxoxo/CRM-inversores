import { useEffect, useRef, useState } from "react";
import { setListInfo } from "../lib/lists";
import { LIST_INFO_FIELDS, LIST_INFO_LABELS, type List, type ListInfoField } from "../types/list";

/** The list's business information as form state: every field is a string, empty where the document has nothing. */
const infoFieldsOf = (list: List): Record<ListInfoField, string> =>
  Object.fromEntries(LIST_INFO_FIELDS.map((field) => [field, list[field] ?? ""])) as Record<ListInfoField, string>;

/**
 * "Editar" button with a dialog for the institution's business information: fund size, ticket, page and free notes.
 * One "Guardar" writes only those fields, never the qualification or the members.
 */
export default function ListInfoDialog({ list }: { list: List }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<ListInfoField, string>>(() => infoFieldsOf(list));

  // Another window may edit the same list while this dialog is closed; the fields follow the document. The serialised
  // info is the dependency, so what is being typed only gets overwritten when the stored values change.
  const stored = JSON.stringify(infoFieldsOf(list));
  useEffect(() => setFields(JSON.parse(stored) as Record<ListInfoField, string>), [stored]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await setListInfo(list.id, fields);
      dialogRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="link-button" onClick={() => dialogRef.current?.showModal()}>
        Editar
      </button>
      <dialog ref={dialogRef} className="dialog rating-dialog" aria-labelledby="list-info-title">
        <h3 id="list-info-title">Datos de {list.name}</h3>
        <p className="muted small">Son de la lista (la institución), no de los perfiles. Se ven debajo de la calificación, arriba de los perfiles.</p>
        <div className="rating-note-grid">
          {LIST_INFO_FIELDS.map((field) => (
            <label key={field} className="rating-note-row">
              <span>{LIST_INFO_LABELS[field]}</span>
              {field === "notes" ? (
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
