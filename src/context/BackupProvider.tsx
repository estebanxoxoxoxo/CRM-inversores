import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiRequest, authorizedInit, ingestToken } from "../lib/api";
import { BACKUP_COLLECTIONS, type BackupCollection, type BackupInfo } from "../lib/backup";
import { BackupContext, INITIAL_COLLECTION_BACKUP, type BackupState, type CollectionBackup } from "./backup";

function explain(e: unknown): string {
  if (e instanceof ApiError && e.status === 401) return "el token no coincide con VITE_INGEST_TOKEN del servidor.";
  const message = e instanceof Error ? e.message : String(e);
  if (/storage\/unauthorized|storage\/unauthenticated/i.test(message)) return "las reglas de Storage no permiten acceder a backups/**.";
  if (/storage\/unknown/i.test(message)) return "no se pudo acceder al bucket de Storage; comprobá que Storage esté activado.";
  if (/Failed to fetch|NetworkError/i.test(message)) return "no se pudo llegar a /api/backup.";
  return message;
}

const endpoint = (collection: BackupCollection): string => `/api/backup?collection=${collection}`;

/** Queries the latest backup of each collection once through /api/backup, and refreshes it after every backup created from the app. */
export default function BackupProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Record<BackupCollection, CollectionBackup>>({ investors: INITIAL_COLLECTION_BACKUP, gold: INITIAL_COLLECTION_BACKUP });

  const patch = useCallback((collection: BackupCollection, changes: Partial<CollectionBackup>) => {
    setCollections((current) => ({ ...current, [collection]: { ...current[collection], ...changes } }));
  }, []);

  useEffect(() => {
    let active = true;
    for (const collection of BACKUP_COLLECTIONS) {
      apiRequest<{ latest: BackupInfo | null }>(endpoint(collection))
        .then(({ latest }) => {
          if (active) patch(collection, { latest, status: "ready" });
        })
        .catch((e: unknown) => {
          if (active) patch(collection, { error: `No se pudo consultar el último backup: ${explain(e)}`, status: "error" });
        });
    }
    return () => {
      active = false;
    };
  }, [patch]);

  const create = useCallback(
    async (collection: BackupCollection) => {
      if (!ingestToken()) {
        patch(collection, { error: "No se puede hacer backup desde la app: definí VITE_INGEST_TOKEN." });
        return false;
      }
      patch(collection, { running: true, error: null });
      try {
        const { backup } = await apiRequest<{ backup: BackupInfo }>(endpoint(collection), authorizedInit({ method: "POST" }));
        patch(collection, { latest: backup, status: "ready", running: false });
        return true;
      } catch (e) {
        patch(collection, { error: `No se pudo crear el backup: ${explain(e)}`, running: false });
        return false;
      }
    },
    [patch],
  );

  const value = useMemo<BackupState>(() => ({ collections, create }), [collections, create]);
  return <BackupContext value={value}>{children}</BackupContext>;
}
