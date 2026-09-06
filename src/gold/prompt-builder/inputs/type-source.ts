/** Input: the source code of the gold type, read from the file itself (Vite `?raw`) so the prompt can never drift from it. */
import typeSource from "../../types/gold.ts?raw";

export const TYPE_SOURCE = typeSource.trim();
