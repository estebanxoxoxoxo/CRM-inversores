import { useCallback, useEffect, useMemo, useState } from "react";
import BackupButton from "./components/BackupButton";
import EvaluateMoreButton from "./gold/components/EvaluateMoreButton";
import FiltersPanel from "./bronze/components/InvestorFilters";
import FindMoreButton from "./bronze/components/FindMoreButton";
import GoldDetail from "./gold/components/GoldDetail";
import GoldFiltersPanel from "./gold/components/GoldFilters";
import GoldList from "./gold/components/GoldList";
import GoldBadge from "./gold/components/GoldBadge";
import InvestorDetail from "./bronze/components/InvestorDetail";
import InvestorList from "./bronze/components/InvestorList";
import ManageListsButton from "./lists/components/ManageListsButton";
import SectionSwitch from "./components/SectionSwitch";
import ThemeSwitch from "./components/ThemeSwitch";
import { useGold } from "./gold/context/gold";
import { useInvestors } from "./bronze/context/investors";
import { useLists } from "./lists/context/lists";
import { SectionContext, navigationFromHash, navigationToHash, type Navigation, type Section } from "./context/section";
import { applyFilters, filtersFromUrl, filtersToUrl, type Filters } from "./bronze/lib/filters";
import { EMPTY_GOLD_FILTERS, applyGoldFilters, joinGold, type GoldFilters } from "./gold/lib/filters";
import ListRatingDialog from "./lists/components/ListRatingDialog";
import { childLists, listMembers, ratingByInvestor } from "./lists/lib/lists";
import { LIST_PARENTS, LIST_PARENT_LABELS, type List } from "./lists/types/list";
import { RATING_DIMENSION_LABELS, RATING_DIMENSION_OPTIONS, RATING_LABELS, RATING_LEVEL_LABELS } from "./bronze/lib/labels";
import { RATING_DIMENSIONS } from "./bronze/types/investor";
import type { DataError, InvalidDocument } from "./lib/data";

function DataNotices({ error, invalid }: { error: DataError | null; invalid: InvalidDocument[] }) {
  return (
    <>
      {error && (
        <div className="error-notice">
          <strong>{error.message}</strong>
          {error.help && <p>{error.help}</p>}
        </div>
      )}
      {invalid.length > 0 && (
        <div className="error-notice">
          <strong>
            {invalid.length} {invalid.length === 1 ? "documento no valida y no se muestra" : "documentos no validan y no se muestran"}.
          </strong>
          {invalid.map((doc) => (
            <p key={doc.id}>
              {doc.id}: {doc.error}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

interface ListsPanelProps {
  lists: List[];
  /** Members of each list still in the base, by list id: the ids of profiles that left do not count. */
  counts: Map<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Left panel of the Listas section: the two fixed parents as headings, each with its child lists (name, how many of
 * its profiles are still in the base, and a dot in the list's rating colour). A muted line when a parent has no lists.
 */
function ListsPanel({ lists, counts, selectedId, onSelect }: ListsPanelProps) {
  return (
    <aside className="filters">
      {LIST_PARENTS.map((parent) => {
        const children = childLists(lists, parent);
        return (
          <fieldset key={parent} className="group">
            <legend>{LIST_PARENT_LABELS[parent]}</legend>
            {children.length ? (
              children.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  className={`option option-pick ${list.id === selectedId ? "current" : ""}`}
                  title={list.rating ? `Calificación: ${RATING_LABELS[list.rating]}` : "Sin calificar"}
                  onClick={() => onSelect(list.id)}
                >
                  <span className={`list-dot ${list.rating ? `rating-${list.rating}` : "rating-none"}`} aria-hidden="true" />
                  <span className="option-label">{list.name}</span>
                  <span className="option-count">{counts.get(list.id) ?? 0}</span>
                </button>
              ))
            ) : (
              <p className="muted small">Todavía no hay listas en esta categoría.</p>
            )}
          </fieldset>
        );
      })}
    </aside>
  );
}

/** One line summarising a list's qualification: its rating badge (or "Sin calificar") and the label of each set dimension. */
function ListRatingSummary({ list }: { list: List }) {
  const dimensions = RATING_DIMENSIONS.map((dimension) => {
    const value = list[dimension];
    if (!value || value === "none") return null;
    const option = RATING_DIMENSION_OPTIONS[dimension].find((o) => o.value === value);
    return { name: RATING_DIMENSION_LABELS[dimension], value: option ? option.label : RATING_LEVEL_LABELS[value] };
  }).filter((entry): entry is { name: string; value: string } => entry !== null);
  return (
    <div className="list-rating-summary">
      {list.rating ? <div className={`list-rating-value rating-${list.rating}`}>{RATING_LABELS[list.rating]}</div> : <div className="list-rating-value list-rating-unset">Sin calificar</div>}
      {dimensions.length > 0 && (
        <dl className="list-rating-dims">
          {dimensions.map((entry) => (
            <div key={entry.name} className="list-rating-dim">
              <dt>{entry.name}</dt>
              <dd>{entry.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function App() {
  const investorsState = useInvestors();
  const goldState = useGold();
  const listsState = useLists();
  const [navigation, setNavigation] = useState<Navigation>(() => navigationFromHash());
  // Which list is open: the section's own selection, next to the profile the hash carries and independent of it.
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listsView, setListsView] = useState<"gold" | "bronze">("gold");
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl());
  const [goldFilters, setGoldFilters] = useState<GoldFilters>(EMPTY_GOLD_FILTERS);

  useEffect(() => filtersToUrl(filters), [filters]);
  useEffect(() => navigationToHash(navigation), [navigation]);

  const go = useCallback((section: Section, selectedId?: string | null) => {
    setNavigation((current) => ({ section, selectedId: selectedId === undefined ? current.selectedId : selectedId }));
  }, []);
  const select = useCallback((selectedId: string) => setNavigation((current) => ({ ...current, selectedId })), []);
  const close = useCallback(() => setNavigation((current) => ({ ...current, selectedId: null })), []);
  const sectionState = useMemo(() => ({ ...navigation, go }), [navigation, go]);

  const { status, investors, invalid, error } = investorsState;
  const { section, selectedId } = navigation;

  // Each newly opened profile in the Listas tab starts on the Gold view (the default).
  useEffect(() => setListsView("gold"), [selectedId]);

  const visible = useMemo(() => applyFilters(investors, filters), [investors, filters]);
  const pending = useMemo(() => investors.filter((investor) => investor.audit.status === "pending").length, [investors]);
  const selected = useMemo(() => investors.find((investor) => investor.id === selectedId) ?? null, [investors, selectedId]);

  const entries = useMemo(() => joinGold(goldState.evaluations, investors), [goldState.evaluations, investors]);
  const visibleGold = useMemo(() => applyGoldFilters(entries, goldFilters), [entries, goldFilters]);
  const selectedEntry = useMemo(() => entries.find((entry) => entry.evaluation.investorId === selectedId) ?? null, [entries, selectedId]);

  const { lists } = listsState;
  // The rating each profile inherits from its list, for the card borders in every section.
  const listRating = useMemo(() => ratingByInvestor(listsState.lists), [listsState.lists]);
  const listCounts = useMemo(() => new Map(lists.map((list) => [list.id, listMembers(list, investors).length])), [lists, investors]);
  const selectedList = useMemo(() => lists.find((list) => list.id === selectedListId) ?? null, [lists, selectedListId]);
  const listProfiles = useMemo(() => (selectedList ? listMembers(selectedList, investors) : []), [selectedList, investors]);

  const info =
    section === "bronze" ? (
      status === "ready" ? (
        <>
          <strong>{visible.length}</strong> de {investors.length} perfiles · Firestore
        </>
      ) : status === "error" ? (
        <span className="error">{error?.message}</span>
      ) : (
        "Cargando desde Firestore…"
      )
    ) : section === "gold" ? (
      goldState.status === "ready" ? (
        <>
          <strong>{visibleGold.length}</strong> de {goldState.evaluations.length} evaluaciones
        </>
      ) : goldState.status === "error" ? (
        <span className="error">{goldState.error?.message}</span>
      ) : (
        "Cargando evaluaciones…"
      )
    ) : listsState.status === "ready" ? (
      selectedList ? (
        <>
          <strong>{listProfiles.length}</strong> {listProfiles.length === 1 ? "perfil" : "perfiles"} en {selectedList.name}
        </>
      ) : (
        <>
          <strong>{lists.length}</strong> {lists.length === 1 ? "lista" : "listas"}
        </>
      )
    ) : listsState.status === "error" ? (
      <span className="error">{listsState.error?.message}</span>
    ) : (
      "Cargando listas…"
    );

  return (
    <SectionContext value={sectionState}>
      <div className="app">
        <header className="header">
          <h1>CRM inversores</h1>
          <SectionSwitch />
          <p className="header-info">{info}</p>
          {section === "bronze" && pending > 0 && (
            <p className="header-pending" role="status">
              {pending === 1 ? "1 perfil sin auditar" : `${pending} perfiles sin auditar`}
            </p>
          )}
          <div className="header-actions">
            {section === "bronze" && (
              <>
                <BackupButton collection="investors" />
                <FindMoreButton />
              </>
            )}
            {section === "gold" && (
              <>
                <BackupButton collection="gold" />
                <EvaluateMoreButton />
              </>
            )}
            <ManageListsButton />
            <ThemeSwitch />
          </div>
        </header>
        <DataNotices error={error} invalid={invalid} />
        {section === "gold" && <DataNotices error={goldState.error} invalid={goldState.invalid} />}
        {section === "lists" && <DataNotices error={listsState.error} invalid={listsState.invalid} />}
        {section === "bronze" ? (
          <div className="layout">
            <FiltersPanel filters={filters} onChange={setFilters} investors={investors} />
            <main className="results">
              {status === "loading" ? (
                <p className="empty">Cargando desde Firestore…</p>
              ) : (
                <InvestorList investors={visible} selectedId={selectedId} onSelect={select} ratingByInvestor={listRating} />
              )}
            </main>
            <InvestorDetail
              investor={selected}
              selectedId={status === "ready" ? selectedId : null}
              onClose={close}
              goldBadge={selectedEntry ? <GoldBadge evaluation={selectedEntry.evaluation} /> : null}
            />
          </div>
        ) : section === "gold" ? (
          <div className="layout">
            <GoldFiltersPanel filters={goldFilters} onChange={setGoldFilters} entries={entries} />
            <main className="results">
              {goldState.status === "loading" ? (
                <p className="empty">Cargando evaluaciones…</p>
              ) : (
                <GoldList entries={visibleGold} selectedId={selectedId} onSelect={select} ratingByInvestor={listRating} />
              )}
            </main>
            <GoldDetail entry={selectedEntry} selectedId={goldState.status === "ready" ? selectedId : null} onClose={close} />
          </div>
        ) : (
          // Listas mirrors the other sections: the same full Bronce detail opens beside the members.
          <div className="layout">
            <ListsPanel lists={lists} counts={listCounts} selectedId={selectedListId} onSelect={setSelectedListId} />
            <main className="results">
              {listsState.status === "loading" ? (
                <p className="empty">Cargando listas…</p>
              ) : !lists.length ? (
                <p className="empty">Todavía no hay listas: creá la primera desde 'Gestionar listas' en la cabecera.</p>
              ) : !selectedList ? (
                <p className="empty">Elegí una lista.</p>
              ) : (
                <>
                  <div className="list-rating-bar">
                    <ListRatingDialog list={selectedList} />
                    <ListRatingSummary list={selectedList} />
                  </div>
                  {listProfiles.length ? (
                    <InvestorList investors={listProfiles} selectedId={selectedId} onSelect={select} ratingByInvestor={listRating} />
                  ) : (
                    <p className="empty">Esta lista todavía no tiene perfiles asignados.</p>
                  )}
                </>
              )}
            </main>
            {(() => {
              const listInvestor = selectedList ? (listProfiles.find((investor) => investor.id === selectedId) ?? null) : null;
              const listSelectedId = listsState.status === "ready" && selectedList ? selectedId : null;
              // The Listas detail defaults to Gold and toggles to Bronce in place, occupying the same panel.
              const toggle = (label: string, to: "gold" | "bronze") => (
                <button type="button" className="secondary" onClick={() => setListsView(to)}>
                  {label}
                </button>
              );
              return listsView === "gold" ? (
                <GoldDetail entry={selectedEntry} selectedId={listSelectedId} onClose={close} viewToggle={listSelectedId ? toggle("Ver en Bronce", "bronze") : null} />
              ) : (
                <InvestorDetail
                  investor={listInvestor}
                  selectedId={listSelectedId}
                  onClose={close}
                  goldBadge={selectedEntry ? <GoldBadge evaluation={selectedEntry.evaluation} /> : null}
                  viewToggle={listSelectedId ? toggle("Ver en Gold", "gold") : null}
                />
              );
            })()}
          </div>
        )}
      </div>
    </SectionContext>
  );
}
