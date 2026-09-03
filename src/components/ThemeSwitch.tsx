import { useState } from "react";
import { THEMES, applyTheme, readTheme, type Theme } from "../lib/theme";

const LABELS: Record<Theme, string> = { system: "Sistema", light: "Claro", dark: "Oscuro" };

/** Three-way theme switch: system / light / dark. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const choose = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };
  return (
    <div className="theme-switch" role="group" aria-label="Tema">
      {THEMES.map((option) => (
        <button key={option} type="button" aria-pressed={theme === option} onClick={() => choose(option)} title={`Tema: ${LABELS[option].toLowerCase()}`}>
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
