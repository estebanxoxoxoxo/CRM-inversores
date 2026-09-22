import ListInfoDialog from "./ListInfoDialog";
import { LIST_INFO_FIELDS, LIST_INFO_LABELS, type List } from "../types/list";

/**
 * The institution's business information, shown under the qualification and above the members: fund size, ticket, page
 * and notes. Only the fields with content print; the "Editar" button opens the dialog either way.
 */
export default function ListInfo({ list }: { list: List }) {
  const rows = LIST_INFO_FIELDS.map((field) => ({ field, label: LIST_INFO_LABELS[field], value: list[field]?.trim() })).filter(
    (row): row is { field: (typeof LIST_INFO_FIELDS)[number]; label: string; value: string } => Boolean(row.value),
  );
  return (
    <section className="list-info">
      <div className="list-info-head">
        <h4>Datos del fondo</h4>
        <ListInfoDialog list={list} />
      </div>
      {rows.length ? (
        <dl className="list-info-fields">
          {rows.map((row) => (
            <div key={row.field} className={`list-info-field${row.field === "notes" ? " list-info-notes" : ""}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted small">Sin datos todavía. Cargalos con "Editar".</p>
      )}
    </section>
  );
}
