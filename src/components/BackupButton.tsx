import { useEffect, useState } from "react";
import { useBackup } from "../context/backup";

const formatDate = (iso: string): string => new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short", hour12: false });

/** "Hacer backup" with the date of the latest backup in the bucket. */
export default function BackupButton() {
  const { status, latest, running, error, create } = useBackup();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 6000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const run = async () => {
    if (await create()) setConfirmation("Backup verificado.");
  };

  const summary = error
    ? error
    : confirmation
      ? `${confirmation} Último backup: ${latest ? formatDate(latest.createdAt) : "ninguno"}.`
      : status === "loading"
        ? "Consultando el último backup…"
        : latest
          ? `Último backup: ${formatDate(latest.createdAt)}${latest.count !== null ? ` (${latest.count} perfiles)` : ""}.`
          : "Sin backups en el bucket.";

  return (
    <>
      <span className={`small ${error ? "error" : "muted"}`} title={latest ? `${latest.path} · ${Math.round(latest.size / 1024)} KB` : undefined}>
        {running ? "Creando y verificando el backup…" : summary}
      </span>
      <button type="button" className="secondary" disabled={running || status === "loading"} onClick={run} title="Copia completa de la base al bucket de Storage, verificada">
        Hacer backup
      </button>
    </>
  );
}
