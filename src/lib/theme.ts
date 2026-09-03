/** Colour theme: follows the system until the user picks one; the choice is stored per browser and stamped on <html>. */
export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The stored choice, or null when the system decides. */
export function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

/** The theme actually in effect: the stored choice, else the system preference. */
export function resolveTheme(): Theme {
  return storedTheme() ?? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");
}

/** Stamps the theme on the document (or nothing, so prefers-color-scheme decides) and persists it. */
export function applyTheme(theme: Theme | null): void {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: the choice lasts for the session */
  }
}

/** Calls back when the system preference changes. Returns the unsubscribe function. */
export function onSystemThemeChange(listener: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
