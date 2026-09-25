import { useEffect, useRef, useState } from "react";
import { setListInfo } from "../lib/lists";
import { LIST_INFO_FIELDS, LIST_INFO_LABELS, LIST_INFO_ORDER, isSourceUrl, type List, type ListInfoField } from "../types/list";

interface InfoForm {
  fields: Record<ListInfoField, string>;
  deepText: string;
  deepSources: string[];
}

/** The list's business information as form state: every text is a string, empty where the document has nothing. */
const formOf = (list: List): InfoForm => ({
  fields: Object.fromEntries(LIST_INFO_FIELDS.map((field) => [field, list[field] ?? ""])) as Record<ListInfoField, string>,
  deepText: list.deep.text ?? "",
  deepSources: [...list.deep.sources],
});

/**
 * "Editar" button with a dialog for the institution's business information. "Deep" also takes one or more sources
 * (http(s) URLs), added and removed row by row. One "Guardar" writes only this information, never the qualification
 * or the members.
 */
export default function ListInfoDialog({ list }: { list: List }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InfoForm>(() => formOf(list));

  // Another window may edit the same list while this dialog is closed; the form follows the document. The serialised
  // information is the dependency, so what is being typed only gets overwritten when the stored values change.
  const stored = JSON.stringify(formOf(list));
  useEffect(() => setForm(JSON.parse(stored) as InfoForm), [stored]);

  const setField = (field: ListInfoField, value: string) => setForm((current) => ({ ...current, fields: { ...current.fields, [field]: value } }));
  const setSource = (index: number, value: string) => setForm((current) => ({ ...current, deepSources: current.deepSources.map((source, i) => (i === index ? value : source)) }));
  const addSource = () => setForm((current) => ({ ...current, deepSources: [...current.deepSources, ""] }));
  const removeSource = (index: number) => setForm((current) => ({ ...current, deepSources: current.deepSources.filter((_, i) => i !== index) }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await setListInfo(list.id, form.fields, { text: form.deepText, sources: form.deepSources });
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
      <dialog ref={dialogRef} className="dialog rating-dialog" aria-labelledby={`list-info-title-${list.id}`}>
        <h3 id={`list-info-title-${list.id}`}>Datos de {list.name}</h3>
        <p className="muted small">Son de la lista (la institución), no de los perfiles. Se ven en la pestaña VC.</p>
        <div className="rating-note-grid">
          {LIST_INFO_ORDER.map((key) =>
            key === "deep" ? (
              <div key={key} className="rating-note-row">
                <span>{LIST_INFO_LABELS.deep}</span>
                <div className="deep-editor">
                  <input type="text" value={form.deepText} disabled={saving} onChange={(e) => setForm((current) => ({ ...current, deepText: e.target.value }))} />
                  {form.deepSources.map((source, index) => (
                    <div key={index} className="source-row">
                      <input
                        type="url"
                        placeholder="https://…"
                        aria-label={`Fuente ${index + 1} de Deep`}
                        aria-invalid={source.trim() !== "" && !isSourceUrl(source.trim())}
                        value={source}
                        disabled={saving}
                        onChange={(e) => setSource(index, e.target.value)}
                      />
                      <button type="button" className="mini" disabled={saving} onClick={() => removeSource(index)} aria-label={`Quitar la fuente ${index + 1}`}>
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="link-button add-source" disabled={saving} onClick={addSource}>
                    + Agregar fuente
                  </button>
                </div>
              </div>
            ) : (
              <label key={key} className="rating-note-row">
                <span>{LIST_INFO_LABELS[key]}</span>
                {key === "notes" ? (
                  <textarea rows={3} value={form.fields[key]} disabled={saving} onChange={(e) => setField(key, e.target.value)} />
                ) : (
                  <input type="text" value={form.fields[key]} disabled={saving} onChange={(e) => setField(key, e.target.value)} />
                )}
              </label>
            ),
          )}
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
