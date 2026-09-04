import { useRef, useState } from "react";
import { setConnection } from "../lib/investors";
import { CONNECTION_LABELS, CONNECTION_NONE_LABEL } from "../lib/labels";
import type { ConnectionAsked, Investor } from "../types/investor";

const OPTIONS: { value: "requested" | "accepted" | "none"; label: string; save: ConnectionAsked }[] = [
  { value: "requested", label: CONNECTION_LABELS.requested, save: "requested" },
  { value: "accepted", label: CONNECTION_LABELS.accepted, save: "accepted" },
  { value: "none", label: CONNECTION_NONE_LABEL, save: false },
];

/** "Conexión" button with a dialog to set the connection state asked to an investor. */
export default function ConnectionDialog({ investor }: { investor: Investor }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (connectionAsked: ConnectionAsked) => {
    setSaving(true);
    setError(null);
    try {
      await setConnection(investor.id, connectionAsked);
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
        {investor.connectionAsked ? CONNECTION_LABELS[investor.connectionAsked] : "Conexión"}
      </button>
      <dialog ref={dialogRef} className="dialog" aria-labelledby="connection-title">
        <h3 id="connection-title">Conexión con {investor.name}</h3>
        <p className="muted small">
          {investor.connectionAsked ? `Estado actual: ${CONNECTION_LABELS[investor.connectionAsked]}.` : "Sin conexión pedida todavía."} Se guarda en la base y se ve arriba de la tarjeta en el
          listado.
        </p>
        <div className="connection-options">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`connection-option connection-${option.value} ${investor.connectionAsked === option.save ? "current" : ""}`}
              disabled={saving}
              onClick={() => save(option.save)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="link-button" disabled={saving} onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
