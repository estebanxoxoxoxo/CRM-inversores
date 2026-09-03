import type { ReactNode } from "react";
import { BAND_CLASS, BAND_LABELS } from "../lib/labels";
import { SCORE_TOTAL_MAX, type Band } from "../types/investor";

export function Badge({ className, children, title }: { className: string; children: ReactNode; title?: string }) {
  return (
    <span className={`badge ${className}`} title={title}>
      {children}
    </span>
  );
}

export function LevelBadge({ level, band, large = false }: { level: number; band: Band; large?: boolean }) {
  return (
    <span className={`level ${BAND_CLASS[band]} ${large ? "level-large" : ""}`} title={`Nivel ${level} de ${SCORE_TOTAL_MAX} · ${BAND_LABELS[band]}`}>
      {level}
    </span>
  );
}
