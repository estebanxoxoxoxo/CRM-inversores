import { RATING_DIMENSION_LABELS, RATING_DIMENSION_OPTIONS, RATING_LEVEL_LABELS } from "../../bronze/lib/labels";
import { RATING_DIMENSIONS } from "../../bronze/types/investor";
import type { List } from "../types/list";

/**
 * The list's qualification dimensions as stacked label rows, one per set dimension; renders nothing when none is set.
 * Shown in the VC pane of the Listas tab; they are edited from "Calificar" in the middle column.
 */
export default function ListDimensions({ list }: { list: List }) {
  const dimensions = RATING_DIMENSIONS.map((dimension) => {
    const value = list[dimension];
    if (!value || value === "none") return null;
    const option = RATING_DIMENSION_OPTIONS[dimension].find((o) => o.value === value);
    return { name: RATING_DIMENSION_LABELS[dimension], value: option ? option.label : RATING_LEVEL_LABELS[value] };
  }).filter((entry): entry is { name: string; value: string } => entry !== null);
  if (!dimensions.length) return null;
  return (
    <dl className="list-rating-dims">
      {dimensions.map((entry) => (
        <div key={entry.name} className="list-rating-dim">
          <dt>{entry.name}</dt>
          <dd>{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
