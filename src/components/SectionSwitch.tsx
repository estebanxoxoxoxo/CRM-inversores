import { useInvestors } from "../bronze/context/investors";
import { useSection, type Section } from "../context/section";
import { useGold } from "../gold/context/gold";

const ORDER: readonly Section[] = ["bronze", "gold"];
const SECTION_LABELS: Record<Section, string> = { bronze: "Bronce", gold: "Gold" };

/** Bronce / Gold pill in the header: the investors list and the evaluations made over it, with their counts. */
export default function SectionSwitch() {
  const { section, go } = useSection();
  const { investors } = useInvestors();
  const { evaluations } = useGold();
  const counts: Record<Section, number> = { bronze: investors.length, gold: evaluations.filter((evaluation) => evaluation.verdict === "gold").length };

  return (
    <div className="section-pill" role="group" aria-label="Sección">
      {ORDER.map((key) => (
        <button key={key} type="button" className={section === key ? "active" : ""} aria-pressed={section === key} onClick={() => go(key)}>
          {SECTION_LABELS[key]}
          <span className="section-count">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}
