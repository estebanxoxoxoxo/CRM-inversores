/** The prompt leaves the machine through the clipboard; a session without one (SSH, CI) gets a file instead. */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import clipboard from "clipboardy";

export const FALLBACK_FILE = "gold-prompt.md";

/** Returns null when the clipboard took it, or the path of the fallback file when it did not. */
export async function copy(text: string): Promise<string | null> {
  try {
    await clipboard.write(text);
    return null;
  } catch {
    const path = join(tmpdir(), FALLBACK_FILE);
    writeFileSync(path, text, "utf8");
    return path;
  }
}
