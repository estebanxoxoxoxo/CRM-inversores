import { DEFAULT_FILTERS, EMPTY_FILTERS, RATING_FILTER_OPTIONS, ratingOf, type Filters, type ListFilterKey, type RatingFilter, type SortKey } from "../lib/filters";
import { BAND_LABELS, BAND_RANGES, CONFIDENCE_LABELS, EMAIL_STATUS_LABELS, INVESTOR_TYPE_LABELS, RATING_LABELS, REGION_LABELS, UNRATED, UNRATED_LABEL } from "../lib/labels";
import { BANDS, ConfidenceSchema, EmailStatusSchema, InvestorTypeSchema, RegionSchema, SCORE_TOTAL_MAX, type Investor } from "../types/investor";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  investors: Investor[];
}

/** "Sin auditar" no es una banda por la que se filtre: los pendientes se avisan en la cabecera. */
const FILTERABLE_BANDS = BANDS.filter((band) => band !== "unaudited");

export default function FiltersPanel({ filters, onChange, investors }: Props) {
  const toggle = (key: ListFilterKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const group = <V extends string>(title: string, key: ListFilterKey, options: readonly V[], valueOf: (investor: Investor) => V, label: (value: V) => string) => (
    <fieldset className="group">
      <legend>{title}</legend>
      {options.map((value) => (
        <label key={value} className="option">
          <input type="checkbox" checked={(filters[key] as string[]).includes(value)} onChange={() => toggle(key, value)} />
          <span className="option-label">{label(value)}</span>
          <span className="option-count">{investors.filter((investor) => valueOf(investor) === value).length}</span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <aside className="filters">
      <div>
        <input
          type="search"
          className="search"
          placeholder="Buscar nombre, firma, rol, ciudad…"
          value={filters.text}
          onChange={(e) => onChange({ ...filters, text: e.target.value })}
        />
        <div className="filters-actions">
          <button type="button" className="link-button" onClick={() => onChange(DEFAULT_FILTERS)}>
            Indiscutibles y alto potencial
          </button>
          <button type="button" className="link-button" onClick={() => onChange(EMPTY_FILTERS)}>
            Ver todo
          </button>
        </div>
      </div>
      {group("Calificación", "ratings", RATING_FILTER_OPTIONS, ratingOf, (v: RatingFilter) => (v === UNRATED ? UNRATED_LABEL : RATING_LABELS[v]))}
      {group("Banda", "bands", FILTERABLE_BANDS, (i) => i.band, (v) => `${BAND_LABELS[v]} (${BAND_RANGES[v]})`)}
      <fieldset className="group">
        <legend>Nivel mínimo: {filters.minLevel}</legend>
        <input
          type="range"
          min={0}
          max={SCORE_TOTAL_MAX}
          step={1}
          value={filters.minLevel}
          onChange={(e) => onChange({ ...filters, minLevel: Number(e.target.value) })}
          className="range"
          aria-label="Nivel mínimo"
        />
      </fieldset>
      {group("Región", "regions", RegionSchema.options, (i) => i.region, (v) => REGION_LABELS[v])}
      {group("Tipo de inversor", "types", InvestorTypeSchema.options, (i) => i.investorType, (v) => INVESTOR_TYPE_LABELS[v])}
      {group("Confianza en las fuentes", "confidences", ConfidenceSchema.options, (i) => i.confidence, (v) => CONFIDENCE_LABELS[v])}
      {group("Email", "emailStatuses", EmailStatusSchema.options, (i) => i.emailStatus, (v) => EMAIL_STATUS_LABELS[v])}
      <fieldset className="group">
        <legend>Otros</legend>
        <label className="option">
          <input type="checkbox" checked={filters.withLinkedin} onChange={(e) => onChange({ ...filters, withLinkedin: e.target.checked })} />
          <span className="option-label">Sólo con LinkedIn</span>
          <span className="option-count">{investors.filter((investor) => investor.linkedin).length}</span>
        </label>
        <label className="option option-select">
          <span className="option-label">Orden</span>
          <select value={filters.sort} onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}>
            <option value="level">Nivel (mayor a menor)</option>
            <option value="name">Nombre</option>
            <option value="firm">Firma</option>
            <option value="region">Región</option>
          </select>
        </label>
      </fieldset>
    </aside>
  );
}
