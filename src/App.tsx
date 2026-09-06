import { useCallback, useEffect, useMemo, useState } from "react";
import BackupButton from "./components/BackupButton";
import FiltersPanel from "./components/Filters";
import FindMoreButton from "./components/FindMoreButton";
import GoldDetail from "./components/GoldDetail";
import GoldFiltersPanel from "./components/GoldFilters";
import GoldList from "./components/GoldList";
import InvestorDetail from "./components/InvestorDetail";
import InvestorList from "./components/InvestorList";
import SectionSwitch from "./components/SectionSwitch";
import ThemeSwitch from "./components/ThemeSwitch";
import { useGold } from "./context/gold";
import { useInvestors } from "./context/investors";
import { SectionContext, navigationFromHash, navigationToHash, type Navigation, type Section } from "./context/section";
import { applyFilters, filtersFromUrl, filtersToUrl, type Filters } from "./lib/filters";
import { DEFAULT_GOLD_FILTERS, applyGoldFilters, joinGold, type GoldFilters } from "./lib/gold-filters";
import type { DataError } from "./lib/investors";
import type { InvalidDocument } from "./lib/investors";

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

export default function App() {
  const investorsState = useInvestors();
  const goldState = useGold();
  const [navigation, setNavigation] = useState<Navigation>(() => navigationFromHash());
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl());
  const [goldFilters, setGoldFilters] = useState<GoldFilters>(DEFAULT_GOLD_FILTERS);

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

  const visible = useMemo(() => applyFilters(investors, filters), [investors, filters]);
  const pending = useMemo(() => investors.filter((investor) => investor.audit.status === "pending").length, [investors]);
  const selected = useMemo(() => investors.find((investor) => investor.id === selectedId) ?? null, [investors, selectedId]);

  const entries = useMemo(() => joinGold(goldState.evaluations, investors), [goldState.evaluations, investors]);
  const visibleGold = useMemo(() => applyGoldFilters(entries, goldFilters), [entries, goldFilters]);
  const goldCount = useMemo(() => goldState.evaluations.filter((evaluation) => evaluation.verdict === "gold").length, [goldState.evaluations]);
  const selectedEntry = useMemo(() => entries.find((entry) => entry.evaluation.investorId === selectedId) ?? null, [entries, selectedId]);

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
    ) : goldState.status === "ready" ? (
      <>
        <strong>{visibleGold.length}</strong> de {goldState.evaluations.length} evaluaciones · {goldCount} gold, {goldState.evaluations.length - goldCount} rechazadas
      </>
    ) : goldState.status === "error" ? (
      <span className="error">{goldState.error?.message}</span>
    ) : (
      "Cargando evaluaciones…"
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
            <BackupButton />
            <FindMoreButton />
            <ThemeSwitch />
          </div>
        </header>
        <DataNotices error={error} invalid={invalid} />
        {section === "gold" && <DataNotices error={goldState.error} invalid={goldState.invalid} />}
        {section === "bronze" ? (
          <div className="layout">
            <FiltersPanel filters={filters} onChange={setFilters} investors={investors} />
            <main className="results">
              {status === "loading" ? <p className="empty">Cargando desde Firestore…</p> : <InvestorList investors={visible} selectedId={selectedId} onSelect={select} />}
            </main>
            <InvestorDetail investor={selected} selectedId={status === "ready" ? selectedId : null} onClose={close} />
          </div>
        ) : (
          <div className="layout">
            <GoldFiltersPanel filters={goldFilters} onChange={setGoldFilters} entries={entries} />
            <main className="results">
              {goldState.status === "loading" ? <p className="empty">Cargando evaluaciones…</p> : <GoldList entries={visibleGold} selectedId={selectedId} onSelect={select} />}
            </main>
            <GoldDetail entry={selectedEntry} selectedId={goldState.status === "ready" ? selectedId : null} onClose={close} />
          </div>
        )}
      </div>
    </SectionContext>
  );
}
