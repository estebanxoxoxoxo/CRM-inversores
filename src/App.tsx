import { useCallback, useEffect, useMemo, useState } from "react";
import DetalleInversor from "./components/DetalleInversor";
import PanelFiltros from "./components/Filtros";
import ListaInversores from "./components/ListaInversores";
import { ErrorDatos, cargarIndice } from "./lib/datos";
import { aplicarFiltros, filtrosAUrl, filtrosDesdeUrl, type Filtros } from "./lib/filtros";
import type { Indice } from "./types/inversor";

export default function App() {
  const [indice, setIndice] = useState<Indice | null>(null);
  const [error, setError] = useState<ErrorDatos | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosDesdeUrl());
  const [seleccionado, setSeleccionado] = useState<string | null>(() => new URLSearchParams(window.location.hash.slice(1)).get("id"));

  useEffect(() => {
    cargarIndice()
      .then(setIndice)
      .catch((e: unknown) => setError(e instanceof ErrorDatos ? e : new ErrorDatos(e instanceof Error ? e.message : String(e), "")));
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
              <strong>{visibles.length}</strong> de {indice.total} perfiles · índice del {indice.generado} · Firestore
            </>
          ) : error ? (
            <span className="error">{error.message}</span>
          ) : (
            "Cargando desde Firestore…"
          )}
        </p>
      </header>
      {error && (
        <div className="aviso-error">
          <strong>{error.message}</strong>
          {error.ayuda && <p>{error.ayuda}</p>}
        </div>
      )}
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
