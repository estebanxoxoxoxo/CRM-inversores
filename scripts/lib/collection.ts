/** `--collection <name>` on the command line of the backup and restore scripts. */
import { BACKUP_COLLECTIONS, isBackupCollection, type BackupCollection } from "../../src/lib/backup";

const FLAG = "--collection";

/** The collection named on the command line, or the default (`investors`) when the flag is absent. Exits on an unknown name. */
export function collectionArgument(argv: string[]): BackupCollection {
  const index = argv.indexOf(FLAG);
  if (index === -1) return BACKUP_COLLECTIONS[0];
  const value = argv[index + 1] ?? "";
  if (!isBackupCollection(value)) {
    console.error(`${FLAG} must be one of: ${BACKUP_COLLECTIONS.join(", ")}`);
    process.exit(1);
  }
  return value;
}

/** The arguments that are neither flags nor the value of `--collection`. */
export const positionalArguments = (argv: string[]): string[] => argv.filter((argument, index) => !argument.startsWith("--") && argv[index - 1] !== FLAG);
