import { useEffect, useState } from "react";
import { applyTheme, onSystemThemeChange, resolveTheme, type Theme } from "../lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

/** Sun / moon pill. Until the user picks, it follows the system and highlights the icon in effect. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());

  useEffect(() => onSystemThemeChange(() => setTheme(resolveTheme())), []);

  const choose = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="theme-pill" role="group" aria-label="Tema">
      <button type="button" className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} aria-label="Tema claro" title="Tema claro" onClick={() => choose("light")}>
        <SunIcon />
      </button>
      <button type="button" className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} aria-label="Tema oscuro" title="Tema oscuro" onClick={() => choose("dark")}>
        <MoonIcon />
      </button>
    </div>
  );
}
