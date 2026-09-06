/** Input: the source code of the gold type, read from the file itself so the prompt can never drift from it. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const TYPE_FILE = join(import.meta.dirname, "..", "..", "types", "gold.ts");

export const readTypeSource = (): string => readFileSync(TYPE_FILE, "utf8").trim();
