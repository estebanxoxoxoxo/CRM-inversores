import { createContext, useContext } from "react";
import type { BackupInfo } from "../lib/backup";

export interface BackupState {
  /** Whether the initial query for the latest backup has finished. */
  status: "loading" | "ready" | "error";
  latest: BackupInfo | null;
  /** A backup is being created right now. */
  running: boolean;
  /** Last error, from the initial query or from a backup attempt. */
  error: string | null;
  /** Creates and verifies a backup; resolves to true when `latest` has been updated, false on error. */
  create: () => Promise<boolean>;
}

const INITIAL_BACKUP_STATE: BackupState = { status: "loading", latest: null, running: false, error: null, create: async () => false };

export const BackupContext = createContext<BackupState>(INITIAL_BACKUP_STATE);

export function useBackup(): BackupState {
  return useContext(BackupContext);
}
