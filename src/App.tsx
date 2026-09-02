import { useCallback, useEffect, useMemo, useState } from "react";
import DetalleInversor from "./components/DetalleInversor";
import PanelFiltros from "./components/Filtros";
import ListaInversores from "./components/ListaInversores";
import { cargarIndice, suscribirFuente, type Fuente } from "./lib/datos";
import { aplicarFiltros, filtrosAUrl, filtrosDesdeUrl, type Filtros } from "./lib/filtros";
import type { Indice } from "./types/inversor";

export default function App() {
  const [indice, setIndice] = useState<Indice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fuente, setFuente] = useState<Fuente | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosDesdeUrl());
  const [seleccionado, setSeleccionado] = useState<string | null>(() => new URLSearchParams(window.location.hash.slice(1)).get("id"));

  useEffect(() => suscribirFuente(setFuente), []);
  useEffect(() => {
    cargarIndice()
      .then(setIndice)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(() => filtrosAUrl(filtros), [filtros]);
  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${seleccionado ? `#id=${seleccionado}` : ""}`);
  }, [seleccionado]);

  const visibles = useMemo(() => (indice ? aplicarFiltros(indice.perfiles, filtros) : []), [indice, filtros]);
  const cerrar = useCallback(() => setSeleccionado(null), []);

  return (
    <div className="app">
      <header className="cabecera">
        <h1>CRM inversores</h1>
        <p className="cabecera-info">
          {indice ? (
            <>
              <strong>{visibles.length}</strong> de {indice.total} perfiles · índice del {indice.generado}
            </>
          ) : error ? (
            <span className="error">{error}</span>
          ) : (
            "Cargando…"
          )}
          {fuente && (
            <span className={`fuente fuente-${fuente}`} title={fuente === "local" ? "Leyendo los JSON de /data (Firestore no disponible o no configurado)" : "Leyendo de Firestore"}>
              {fuente === "firestore" ? "Firestore" : "datos locales"}
            </span>
          )}
        </p>
      </header>
      <div className="cuerpo">
        <PanelFiltros filtros={filtros} onChange={setFiltros} perfiles={indice?.perfiles ?? []} />
        <main className="resultados">
          <ListaInversores perfiles={visibles} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
        </main>
        <DetalleInversor id={seleccionado} onCerrar={cerrar} />
      </div>
    </div>
  );
}
