import { createContext, useContext } from "react";
import type { BackupCollection, BackupInfo } from "../lib/backup";

/** Backup state of one collection. */
export interface CollectionBackup {
  /** Whether the initial query for the latest backup has finished. */
  status: "loading" | "ready" | "error";
  latest: BackupInfo | null;
  /** A backup is being created right now. */
  running: boolean;
  /** Last error, from the initial query or from a backup attempt. */
  error: string | null;
}

export const INITIAL_COLLECTION_BACKUP: CollectionBackup = { status: "loading", latest: null, running: false, error: null };

export interface BackupState {
  collections: Record<BackupCollection, CollectionBackup>;
  /** Creates and verifies a backup of the collection; resolves to true when its `latest` has been updated, false on error. */
  create: (collection: BackupCollection) => Promise<boolean>;
}

export const BackupContext = createContext<BackupState>({
  collections: { investors: INITIAL_COLLECTION_BACKUP, gold: INITIAL_COLLECTION_BACKUP },
  create: async () => false,
});

/** The backup state of one collection, with `create` bound to it. */
export function useBackup(collection: BackupCollection): CollectionBackup & { create: () => Promise<boolean> } {
  const { collections, create } = useContext(BackupContext);
  return { ...collections[collection], create: () => create(collection) };
}
