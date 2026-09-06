import { useGold } from "../context/gold";
import { useInvestors } from "../context/investors";
import { useSection, type Section } from "../context/section";
import { SECTION_LABELS } from "../lib/labels";

const ORDER: readonly Section[] = ["bronze", "gold"];

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
