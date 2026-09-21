import { useRef, useState, type FormEvent } from "react";
import { useInvestors } from "../../bronze/context/investors";
import { useLists } from "../context/lists";
import { childLists, createList, deleteList, listMembers } from "../lib/lists";
import { LIST_PARENTS, LIST_PARENT_LABELS, NAME_MAX, type ListParent } from "../types/list";

/** "Gestionar listas" button with a dialog to create and delete lists. It is in the header of every section. */
export default function ManageListsButton() {
  const { lists } = useLists();
  const { investors } = useInvestors();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [parent, setParent] = useState<ListParent>("vcs");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setName("");
    setParent("vcs");
    setError(null);
    dialogRef.current?.showModal();
  };

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createList(name, parent);
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
        <p className="muted small">
          Cada lista es una institución (un VC o un ángel) y va bajo una de las dos categorías fijas. Un perfil pertenece a una sola lista, y se asigna desde la ficha con "Asignar a lista".
        </p>
        <form className="list-create" onSubmit={create}>
          <select value={parent} disabled={saving} onChange={(e) => setParent(e.target.value as ListParent)} aria-label="Categoría">
            {LIST_PARENTS.map((value) => (
              <option key={value} value={value}>
                {LIST_PARENT_LABELS[value]}
              </option>
            ))}
          </select>
          <input type="text" value={name} maxLength={NAME_MAX} disabled={saving} placeholder="Nombre de la lista nueva" onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="primary" disabled={saving || !name.trim()}>
            Crear
          </button>
        </form>
        {LIST_PARENTS.map((value) => {
          const children = childLists(lists, value);
          return (
            <div key={value} className="list-group">
              <h4 className="subheading">{LIST_PARENT_LABELS[value]}</h4>
              {children.length ? (
                <ul className="list-rows">
                  {children.map((list) => (
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
                <p className="muted small">Todavía no hay listas en esta categoría.</p>
              )}
            </div>
          );
        })}
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
