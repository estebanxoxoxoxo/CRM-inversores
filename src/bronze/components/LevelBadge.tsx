import { BAND_CLASS, BAND_LABELS } from "../lib/labels";
import { SCORE_TOTAL_MAX, type Band } from "../types/investor";

/** The investor's level, coloured by band. Shown in both sections. */
export function LevelBadge({ level, band, large = false }: { level: number; band: Band; large?: boolean }) {
  return (
    <span className={`level ${BAND_CLASS[band]} ${large ? "level-large" : ""}`} title={`Nivel ${level} de ${SCORE_TOTAL_MAX} · ${BAND_LABELS[band]}`}>
      {level}
    </span>
  );
}
