import { useRef, useState } from "react";
import { useLists } from "../context/lists";
import { assignToList, childLists, listOfInvestor } from "../lib/lists";
import { LIST_PARENTS, LIST_PARENT_LABELS } from "../types/list";
import type { Investor } from "../../bronze/types/investor";

/** "Asignar a lista" button with a dialog: a single choice (radios) grouped by parent, plus "Ninguna", written the moment it is picked. */
export default function AssignListsDialog({ investor }: { investor: Investor }) {
  const { lists } = useLists();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = listOfInvestor(lists, investor.id);

  const open = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const choose = async (listId: string | null) => {
    setSaving(true);
    setError(null);
    try {
      await assignToList(lists, investor.id, listId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="secondary" onClick={open} title="Asignar el perfil a una lista">
        {current ? `Lista: ${current.name}` : "Asignar a lista"}
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="assign-lists-title">
        <h3 id="assign-lists-title">Lista de {investor.name}</h3>
        {lists.length ? (
          <>
            <p className="muted small">Un perfil pertenece a una sola lista. La elección se guarda al tocarla.</p>
            <div className="group">
              <label className="option">
                <input type="radio" name="assign-list" checked={!current} disabled={saving} onChange={() => choose(null)} />
                <span className="option-label">Ninguna</span>
              </label>
            </div>
            {LIST_PARENTS.map((parent) => {
              const children = childLists(lists, parent);
              if (!children.length) return null;
              return (
                <fieldset key={parent} className="group">
                  <legend>{LIST_PARENT_LABELS[parent]}</legend>
                  {children.map((list) => (
                    <label key={list.id} className="option">
                      <input type="radio" name="assign-list" checked={current?.id === list.id} disabled={saving} onChange={() => choose(list.id)} />
                      <span className="option-label">{list.name}</span>
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </>
        ) : (
          <p className="muted small">Todavía no hay listas: crealas desde 'Gestionar listas' en la cabecera.</p>
        )}
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="link-button" disabled={saving} onClick={() => dialogRef.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
