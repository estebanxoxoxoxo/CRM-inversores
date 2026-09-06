import { useSection } from "../../context/section";
import type { Evaluation } from "../types/gold";

/** Badge with the gold verdict of an investor that opens its evaluation. Rendered inside the Bronce detail panel. */
export default function GoldVerdictBadge({ evaluation }: { evaluation: Evaluation }) {
  const { go } = useSection();
  return (
    <button type="button" className={`badge badge-button verdict-${evaluation.verdict}`} onClick={() => go("gold", evaluation.investorId)} title="Ver la evaluación en la sección Gold">
      {evaluation.verdict === "gold" ? "Gold" : "Gold: rechazado"}
    </button>
  );
}
