import {
  ASPECT_KEYS,
  DEFAULT_GOLD_FILTERS,
  EMPTY_GOLD_FILTERS,
  GOLD_REGIONS,
  VERDICTS,
  fails,
  isGoldSortKey,
  type GoldEntry,
  type GoldFilters,
  type GoldListFilterKey,
} from "../lib/filters";
import { REGION_LABELS } from "../../bronze/lib/labels";
import { ASPECT_LABELS, VERDICT_LABELS } from "../lib/labels";

interface Props {
  filters: GoldFilters;
  onChange: (filters: GoldFilters) => void;
  entries: GoldEntry[];
}

export default function GoldFiltersPanel({ filters, onChange, entries }: Props) {
  const toggle = (key: GoldListFilterKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const group = <V extends string>(title: string, key: GoldListFilterKey, options: readonly V[], matches: (entry: GoldEntry, value: V) => boolean, label: (value: V) => string) => (
    <fieldset className="group">
      <legend>{title}</legend>
      {options.map((value) => (
        <label key={value} className="option">
          <input type="checkbox" checked={(filters[key] as string[]).includes(value)} onChange={() => toggle(key, value)} />
          <span className="option-label">{label(value)}</span>
          <span className="option-count">{entries.filter((entry) => matches(entry, value)).length}</span>
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
          placeholder="Buscar nombre, firma, rol, motivo…"
          value={filters.text}
          onChange={(e) => onChange({ ...filters, text: e.target.value })}
        />
        <div className="filters-actions">
          <button type="button" className="link-button" onClick={() => onChange(DEFAULT_GOLD_FILTERS)}>
            Sólo gold
          </button>
          <button type="button" className="link-button" onClick={() => onChange(EMPTY_GOLD_FILTERS)}>
            Ver todo
          </button>
        </div>
      </div>
      {group("Veredicto", "verdicts", VERDICTS, (entry, value) => entry.evaluation.verdict === value, (v) => VERDICT_LABELS[v])}
      {group("Región", "regions", GOLD_REGIONS, (entry, value) => entry.evaluation.region === value, (v) => REGION_LABELS[v])}
      {group("Aspecto que no pasa", "failing", ASPECT_KEYS, (entry, value) => fails(entry.evaluation, value), (v) => ASPECT_LABELS[v])}
      <fieldset className="group">
        <legend>Otros</legend>
        <label className="option option-select">
          <span className="option-label">Orden</span>
          <select value={filters.sort} onChange={(e) => onChange({ ...filters, sort: isGoldSortKey(e.target.value) ? e.target.value : "level" })}>
            <option value="level">Nivel (mayor a menor)</option>
            <option value="name">Nombre</option>
            <option value="date">Evaluación (más reciente)</option>
          </select>
        </label>
      </fieldset>
    </aside>
  );
}
