import { useState } from "react";
import { copyText } from "../../lib/clipboard";
import { LIST_PARENT_LABELS, type List } from "../types/list";
import { Section } from "../../components/DetailParts";
import ListInfo from "./ListInfo";

/**
 * The "VC" pane of the Listas tab: the institution's side of the detail panel. Shows the list's business information
 * (Datos del fondo) and its related facts — merged from the members' gold evaluations, semantic duplicates removed —
 * which live on the list, not on the profiles.
 */
export default function ListVcPanel({ list }: { list: List }) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (index: number, text: string) => {
    if (await copyText(text)) {
      setCopied(index);
      setTimeout(() => setCopied((current) => (current === index ? null : current)), 1500);
    }
  };

  return (
    <section className="detail vc-panel">
      <header className="detail-header">
        <div className="detail-title">
          <h2>{list.name}</h2>
          <p className="detail-subtitle muted">{LIST_PARENT_LABELS[list.parent]}</p>
        </div>
      </header>

      <ListInfo list={list} />

      {list.facts.length ? (
        <Section title={`Hechos relevantes (${list.facts.length})`}>
          <ul className="facts">
            {list.facts.map((related, i) => (
              <li key={i} className="fact">
                <div className="fact-head">
                  <p className="fact-text">{related.fact}</p>
                  <button type="button" className="mini" onClick={() => copy(i, related.fact)}>
                    {copied === i ? "copiado" : "copiar"}
                  </button>
                </div>
                <ul className="aspect-sources">
                  {related.sources.map((source) => (
                    <li key={source}>
                      <a href={source} target="_blank" rel="noreferrer">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <Section title="Hechos relevantes">
          <p className="muted">Sin hechos todavía.</p>
        </Section>
      )}
    </section>
  );
}
