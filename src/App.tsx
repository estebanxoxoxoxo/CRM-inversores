import { useCallback, useEffect, useMemo, useState } from "react";
import BackupButton from "./components/BackupButton";
import FiltersPanel from "./components/Filters";
import FindMoreButton from "./components/FindMoreButton";
import InvestorDetail from "./components/InvestorDetail";
import InvestorList from "./components/InvestorList";
import ThemeSwitch from "./components/ThemeSwitch";
import { useInvestors } from "./context/investors";
import { applyFilters, filtersFromUrl, filtersToUrl, type Filters } from "./lib/filters";

function selectedIdFromHash(): string | null {
  return new URLSearchParams(window.location.hash.slice(1)).get("id");
}

export default function App() {
  const { status, investors, invalid, error } = useInvestors();
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl());
  const [selectedId, setSelectedId] = useState<string | null>(() => selectedIdFromHash());

  useEffect(() => filtersToUrl(filters), [filters]);
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${selectedId ? `#id=${selectedId}` : ""}`);
  }, [selectedId]);

  const visible = useMemo(() => applyFilters(investors, filters), [investors, filters]);
  const pending = useMemo(() => investors.filter((investor) => investor.audit.status === "pending").length, [investors]);
  const selected = useMemo(() => investors.find((investor) => investor.id === selectedId) ?? null, [investors, selectedId]);
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <div className="app">
      <header className="header">
        <h1>CRM inversores</h1>
        <p className="header-info">
          {status === "ready" ? (
            <>
              <strong>{visible.length}</strong> de {investors.length} perfiles · Firestore
            </>
          ) : status === "error" ? (
            <span className="error">{error?.message}</span>
          ) : (
            "Cargando desde Firestore…"
          )}
        </p>
        {pending > 0 && (
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
      <div className="layout">
        <FiltersPanel filters={filters} onChange={setFilters} investors={investors} />
        <main className="results">
          {status === "loading" ? <p className="empty">Cargando desde Firestore…</p> : <InvestorList investors={visible} selectedId={selectedId} onSelect={setSelectedId} />}
        </main>
        <InvestorDetail investor={selected} selectedId={status === "ready" ? selectedId : null} onClose={close} />
      </div>
    </div>
  );
}
