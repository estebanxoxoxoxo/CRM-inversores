import { useRef, useState } from "react";
import { useLists } from "../context/lists";
import { setMembership } from "../lib/lists";
import type { Investor } from "../../bronze/types/investor";

/** "Asignar a lista" button with a dialog: one checkbox per list, written the moment it is toggled. */
export default function AssignListsDialog({ investor }: { investor: Investor }) {
  const { lists } = useLists();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assigned = lists.filter((list) => list.memberIds.includes(investor.id)).length;

  const open = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const toggle = async (listId: string, member: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await setMembership(listId, investor.id, member);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="secondary" onClick={open} title="Asignar el perfil a las listas">
        {assigned ? `Listas: ${assigned}` : "Asignar a lista"}
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="assign-lists-title">
        <h3 id="assign-lists-title">Listas de {investor.name}</h3>
        {lists.length ? (
          <>
            <p className="muted small">Cada casilla se guarda al tocarla. El perfil puede estar en todas las listas que haga falta.</p>
            <div className="group">
              {lists.map((list) => {
                const member = list.memberIds.includes(investor.id);
                return (
                  <label key={list.id} className="option">
                    <input type="checkbox" checked={member} disabled={saving} onChange={() => toggle(list.id, !member)} />
                    <span className="option-label">{list.name}</span>
                  </label>
                );
              })}
            </div>
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
