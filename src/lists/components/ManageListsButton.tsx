import { useRef, useState, type FormEvent } from "react";
import { useInvestors } from "../../bronze/context/investors";
import { useLists } from "../context/lists";
import { createList, deleteList, listMembers } from "../lib/lists";
import { NAME_MAX } from "../types/list";

/** "Gestionar listas" button with a dialog to create and delete lists. It is in the header of every section. */
export default function ManageListsButton() {
  const { lists } = useLists();
  const { investors } = useInvestors();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setName("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createList(name);
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteList(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="secondary" onClick={open} title="Crear y borrar las listas de perfiles">
        Gestionar listas
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="manage-lists-title">
        <h3 id="manage-lists-title">Listas</h3>
        <p className="muted small">Agrupan perfiles a mano, sin tocar el perfil: uno puede estar en todas las listas que haga falta. Se asignan desde la ficha, con "Asignar a lista".</p>
        <form className="list-create" onSubmit={create}>
          <input type="text" value={name} maxLength={NAME_MAX} disabled={saving} placeholder="Nombre de la lista nueva" onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="primary" disabled={saving || !name.trim()}>
            Crear
          </button>
        </form>
        {lists.length ? (
          <ul className="list-rows">
            {lists.map((list) => (
              <li key={list.id} className="list-row">
                <span className="list-row-name">{list.name}</span>
                <span className="option-count">{listMembers(list, investors).length}</span>
                <button type="button" className="link-button" disabled={saving} onClick={() => remove(list.id)} title={`Borrar la lista ${list.name}: los perfiles no se tocan`}>
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Todavía no hay listas.</p>
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
