import { useSection } from "../../context/section";
import type { Evaluation } from "../types/gold";

/** Badge of an investor already evaluated that opens its evaluation. Being evaluated is the whole message. Rendered inside the Bronce detail panel. */
export default function GoldBadge({ evaluation }: { evaluation: Evaluation }) {
  const { go } = useSection();
  return (
    <button type="button" className="badge badge-button gold" onClick={() => go("gold", evaluation.investorId)} title="Ver la evaluación en la sección Gold">
      Gold
    </button>
  );
}
