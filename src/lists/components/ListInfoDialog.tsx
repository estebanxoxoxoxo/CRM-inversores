import { useEffect, useRef, useState } from "react";
import { setListInfo } from "../lib/lists";
import { LIST_INFO_FIELDS, LIST_INFO_LABELS, LIST_INFO_ORDER, isHttpUrl, type List, type ListInfoField } from "../types/list";

/** Fields that take the full width of the dialog, one under the other. */
const WIDE_FIELDS: readonly ListInfoField[] = ["deep", "spanish", "capacity", "notes"];
/** Fields written as a paragraph: a three-line text area instead of a single line. */
const TEXTAREA_FIELDS: readonly ListInfoField[] = ["deep", "notes"];

interface InfoForm {
  fields: Record<ListInfoField, string>;
  investments: { description: string; url: string }[];
}

/** The list's business information as form state: every text is a string, empty where the document has nothing. */
const formOf = (list: List): InfoForm => ({
  fields: Object.fromEntries(LIST_INFO_FIELDS.map((field) => [field, list[field] ?? ""])) as Record<ListInfoField, string>,
  investments: list.investments.map((investment) => ({ description: investment.description, url: investment.url ?? "" })),
});

/**
 * "Editar" button with a dialog for the institution's business information. The investments are a list: each one a
 * description and an optional URL, added and removed row by row. One "Guardar" writes only this information, never
 * the qualification or the members.
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
  const setInvestment = (index: number, patch: Partial<{ description: string; url: string }>) =>
    setForm((current) => ({ ...current, investments: current.investments.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
  const addInvestment = () => setForm((current) => ({ ...current, investments: [...current.investments, { description: "", url: "" }] }));
  const removeInvestment = (index: number) => setForm((current) => ({ ...current, investments: current.investments.filter((_, i) => i !== index) }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await setListInfo(list.id, form.fields, form.investments);
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
            key === "investments" ? (
              // A full-width block: the title, one card per investment (description and URL), then the add button.
              <div key={key} className="investments-editor">
                <span className="investments-title">{LIST_INFO_LABELS.investments}</span>
                {form.investments.map((row, index) => (
                  <div key={index} className="investment-item">
                    <textarea
                      rows={2}
                      placeholder="Descripción de la inversión"
                      aria-label={`Descripción de la inversión ${index + 1}`}
                      value={row.description}
                      disabled={saving}
                      onChange={(e) => setInvestment(index, { description: e.target.value })}
                    />
                    <div className="investment-url-row">
                      <input
                        type="url"
                        placeholder="https://…  (opcional)"
                        aria-label={`URL de la inversión ${index + 1}`}
                        aria-invalid={row.url.trim() !== "" && !isHttpUrl(row.url.trim())}
                        value={row.url}
                        disabled={saving}
                        onChange={(e) => setInvestment(index, { url: e.target.value })}
                      />
                      <button type="button" className="mini" disabled={saving} onClick={() => removeInvestment(index)} aria-label={`Quitar la inversión ${index + 1}`}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="link-button add-investment" disabled={saving} onClick={addInvestment}>
                  + Agregar inversión
                </button>
              </div>
            ) : (
              <label key={key} className={`rating-note-row${WIDE_FIELDS.includes(key) ? " wide-field" : ""}`}>
                <span>{LIST_INFO_LABELS[key]}</span>
                {TEXTAREA_FIELDS.includes(key) ? (
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
