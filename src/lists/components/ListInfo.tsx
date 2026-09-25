import ListInfoDialog from "./ListInfoDialog";
import { SourcesLink } from "../../components/SourcesLink";
import { LIST_INFO_LABELS, LIST_INFO_ORDER, type List, type ListInfoKey } from "../types/list";

/**
 * The institution's business information, in `LIST_INFO_ORDER`: fund size, ticket, page, location, Deep (with a link
 * icon to its sources), Spanish, capacity to invest and notes. Only the pieces with content print; the "Editar" button
 * opens the dialog either way.
 */
export default function ListInfo({ list }: { list: List }) {
  const rows = LIST_INFO_ORDER.map((key) => {
    if (key === "deep") {
      const text = list.deep.text?.trim() ?? "";
      return text || list.deep.sources.length ? { key, text, sources: list.deep.sources } : null;
    }
    const text = list[key]?.trim() ?? "";
    return text ? { key, text, sources: [] as string[] } : null;
  }).filter((row): row is { key: ListInfoKey; text: string; sources: string[] } => row !== null);

  return (
    <section className="list-info">
      <div className="list-info-head">
        <h4>Datos del fondo</h4>
        <ListInfoDialog list={list} />
      </div>
      {rows.length ? (
        <dl className="list-info-fields">
          {rows.map((row) => (
            <div key={row.key} className={`list-info-field${row.key === "notes" ? " list-info-notes" : ""}`}>
              <dt>{LIST_INFO_LABELS[row.key]}</dt>
              <dd>
                {row.text || <span className="muted">Sin texto</span>}
                {row.key === "deep" && <SourcesLink sources={row.sources} title={LIST_INFO_LABELS.deep} />}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted small">Sin datos todavía. Cargalos con "Editar".</p>
      )}
    </section>
  );
}
