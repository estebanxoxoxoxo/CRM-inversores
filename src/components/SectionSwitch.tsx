import { useInvestors } from "../bronze/context/investors";
import { useSection, type Section } from "../context/section";
import { useGold } from "../gold/context/gold";
import { useLists } from "../lists/context/lists";

const ORDER: readonly Section[] = ["bronze", "gold", "lists"];
const SECTION_LABELS: Record<Section, string> = { bronze: "Bronce", gold: "Gold", lists: "Listas" };

/** Bronce / Gold / Listas pill in the header: the investors list, the evaluations made over it and the team's groupings, with their counts. */
export default function SectionSwitch() {
  const { section, go } = useSection();
  const { investors } = useInvestors();
  const { evaluations } = useGold();
  const { lists } = useLists();
  const counts: Record<Section, number> = { bronze: investors.length, gold: evaluations.length, lists: lists.length };

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
