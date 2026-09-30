import type { ReactNode } from "react";
import ListInfoDialog from "./ListInfoDialog";
import { UrlLink } from "../../components/UrlLink";
import { LIST_INFO_LABELS, LIST_INFO_ORDER, type List, type ListInfoKey } from "../types/list";

/** Fields whose value reads as a paragraph: they take the full row instead of sitting beside their label. */
const BLOCK_KEYS = new Set(["deep", "investments", "notes"]);

/**
 * The institution's business information, in `LIST_INFO_ORDER`: fund size, ticket, page, location, Deep, the
 * investments (each with a link icon to its URL), Spanish, capacity to invest and notes. Only the pieces with content
 * print; the "Editar" button opens the dialog either way.
 */
export default function ListInfo({ list }: { list: List }) {
  const rows = LIST_INFO_ORDER.flatMap((key): { key: ListInfoKey; content: ReactNode }[] => {
    if (key === "investments") return list.investments.length ? [{ key, content: <InvestmentList list={list} /> }] : [];
    const text = list[key]?.trim();
    return text ? [{ key, content: <>{text}</> }] : [];
  });

  return (
    <section className="list-info">
      <div className="list-info-head">
        <h4>Datos del fondo</h4>
        <ListInfoDialog list={list} />
      </div>
      {rows.length ? (
        <dl className="list-info-fields">
          {rows.map((row) => (
            <div key={row.key} className={`list-info-field${BLOCK_KEYS.has(row.key) ? " list-info-block" : ""}`}>
              <dt>{LIST_INFO_LABELS[row.key]}</dt>
              <dd>{row.content}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted small">Sin datos todavía. Cargalos con "Editar".</p>
      )}
    </section>
  );
}

/** One line per investment: its description and, when it has one, a link icon to its URL. */
function InvestmentList({ list }: { list: List }) {
  return (
    <ul className="investments-list">
      {list.investments.map((investment, i) => (
        <li key={i}>
          {investment.description}
          {investment.url && <UrlLink url={investment.url} label={`la inversión: ${investment.description}`} />}
        </li>
      ))}
    </ul>
  );
}
