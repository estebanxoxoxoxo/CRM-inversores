import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiRequest, authorizedInit, ingestToken } from "../lib/api";
import type { BackupInfo } from "../lib/backup";
import { BackupContext, type BackupState } from "./backup";

function explain(e: unknown): string {
  if (e instanceof ApiError && e.status === 401) return "el token no coincide con VITE_INGEST_TOKEN del servidor.";
  const message = e instanceof Error ? e.message : String(e);
  if (/storage\/unauthorized|storage\/unauthenticated/i.test(message)) return "las reglas de Storage no permiten acceder a backups/**.";
  if (/storage\/unknown/i.test(message)) return "no se pudo acceder al bucket de Storage; comprobá que Storage esté activado.";
  if (/Failed to fetch|NetworkError/i.test(message)) return "no se pudo llegar a /api/backup.";
  return message;
}

/** Queries the latest backup once through /api/backup, and refreshes it after every backup created from the app. */
export default function BackupProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackupState["status"]>("loading");
  const [latest, setLatest] = useState<BackupInfo | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ latest: BackupInfo | null }>("/api/backup")
      .then(({ latest: info }) => {
        if (!active) return;
        setLatest(info);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(`No se pudo consultar el último backup: ${explain(e)}`);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const create = useCallback(async () => {
    if (!ingestToken()) {
      setError("No se puede hacer backup desde la app: definí VITE_INGEST_TOKEN.");
      return false;
    }
    setRunning(true);
    setError(null);
    try {
      const { backup } = await apiRequest<{ backup: BackupInfo }>("/api/backup", authorizedInit({ method: "POST" }));
      setLatest(backup);
      setStatus("ready");
      return true;
    } catch (e) {
      setError(`No se pudo crear el backup: ${explain(e)}`);
      return false;
    } finally {
      setRunning(false);
    }
  }, []);

  const value = useMemo<BackupState>(() => ({ status, latest, running, error, create }), [status, latest, running, error, create]);
  return <BackupContext value={value}>{children}</BackupContext>;
}
