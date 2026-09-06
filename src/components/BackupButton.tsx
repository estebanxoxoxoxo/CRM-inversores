import { useEffect, useState } from "react";
import { useBackup } from "../context/backup";
import type { BackupCollection } from "../lib/backup";

const formatDate = (iso: string): string => new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short", hour12: false });

/** What one document of each collection is called in the summary. */
const UNITS: Record<BackupCollection, string> = { investors: "perfiles", gold: "evaluaciones" };

/** "Hacer backup" of one collection, with the date of its latest backup in the bucket. */
export default function BackupButton({ collection }: { collection: BackupCollection }) {
  const { status, latest, running, error, create } = useBackup(collection);
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
          ? `Último backup: ${formatDate(latest.createdAt)}${latest.count !== null ? ` (${latest.count} ${UNITS[collection]})` : ""}.`
          : `Sin backups de ${collection} en el bucket.`;

  return (
    <>
      <span className={`small ${error ? "error" : "muted"}`} title={latest ? `${latest.path} · ${Math.round(latest.size / 1024)} KB` : undefined}>
        {running ? "Creando y verificando el backup…" : summary}
      </span>
      <button type="button" className="secondary" disabled={running || status === "loading"} onClick={run} title={`Copia completa de la colección ${collection} al bucket de Storage, verificada`}>
        Hacer backup
      </button>
    </>
  );
}
