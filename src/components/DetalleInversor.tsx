import { useEffect, useState, type ReactNode } from "react";
import { cargarPerfil } from "../lib/datos";
import type { Inversor } from "../types/inversor";
import { Etiqueta } from "./ListaInversores";

interface Props {
  id: string | null;
  onCerrar: () => void;
}

const URL_RE = /(https?:\/\/[^\s)\]]+)/g;

/** Convierte las URLs de un texto en enlaces. */
function ConEnlaces({ texto }: { texto: string }) {
  const partes = texto.split(URL_RE);
  return (
    <>
      {partes.map((t, i) =>
        /^https?:\/\//.test(t) ? (
          <a key={i} href={t.replace(/[).,;]+$/, "")} target="_blank" rel="noreferrer">
            {t}
          </a>
        ) : (
          <span key={i}>{t}</span>
        ),
      )}
    </>
  );
}

function Seccion({ titulo, children, abierta = true }: { titulo: string; children: ReactNode; abierta?: boolean }) {
  return (
    <details className="seccion" open={abierta}>
      <summary>{titulo}</summary>
      <div className="seccion-cuerpo">{children}</div>
    </details>
  );
}

function Lista({ items }: { items: string[] }) {
  if (!items.length) return <p className="tenue">Sin datos.</p>;
  return (
    <ul className="lista-simple">
      {items.map((it, i) => (
        <li key={i}>
          <ConEnlaces texto={it} />
        </li>
      ))}
    </ul>
  );
}

function Parrafos({ texto }: { texto: string }) {
  return (
    <>
      {texto
        .split(/\n\s*\n|\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>
            <ConEnlaces texto={p} />
          </p>
        ))}
    </>
  );
}

export default function DetalleInversor({ id, onCerrar }: Props) {
  const [perfil, setPerfil] = useState<Inversor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setPerfil(null);
    setError(null);
    setCopiado(false);
    if (!id) return;
    let vigente = true;
    cargarPerfil(id)
      .then((p) => vigente && setPerfil(p))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      vigente = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  if (!id) return <section className="detalle detalle-vacio">Elegí un inversor de la lista para ver la ficha completa.</section>;
  if (error) return <section className="detalle">Error al cargar el perfil: {error}</section>;
  if (!perfil) return <section className="detalle">Cargando…</section>;
  const p = perfil;

  const copiarEmail = async () => {
    try {
      await navigator.clipboard.writeText(p.email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <section className="detalle">
      <header className="detalle-cabecera">
        <div>
          <h2>{p.nombre}</h2>
          <p className="detalle-sub">
            {p.rol} · <strong>{p.firma}</strong> · {p.ciudad_base}
          </p>
          <p className="detalle-etiquetas">
            <Etiqueta clase={`nivel-${p.nivel}`}>{p.nivel_etiqueta}</Etiqueta>
            <Etiqueta clase={`prio-${p.prioridad}`}>Prioridad {p.prioridad}</Etiqueta>
            <Etiqueta clase={`conf-${p.confianza}`}>Confianza {p.confianza}</Etiqueta>
            <Etiqueta clase="neutra">{p.region}</Etiqueta>
            <Etiqueta clase="neutra" title={p.tipo_inversor_detalle}>
              {p.tipo_inversor}
            </Etiqueta>
          </p>
        </div>
        <button type="button" className="cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
      </header>

      <div className="contacto">
        {p.linkedin ? (
          <a href={p.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        ) : (
          <span className="tenue">Sin LinkedIn público</span>
        )}
        {p.linkedin_nota && <span className="tenue"> ({p.linkedin_nota})</span>}
        <span className="separador">·</span>
        {p.email ? (
          <>
            <a href={`mailto:${p.email}`}>{p.email}</a>
            <button type="button" className="mini" onClick={copiarEmail}>
              {copiado ? "copiado" : "copiar"}
            </button>
            <span className="tenue"> {p.email_estado}</span>
          </>
        ) : (
          <span className="tenue">Email no encontrado</span>
        )}
      </div>
      {p.email_fuente && (
        <p className="tenue pequeno">
          Fuente del email: <ConEnlaces texto={p.email_fuente} />
        </p>
      )}

      <Seccion titulo="Motivo del nivel (auditoría)">
        <p>{p.auditoria.motivo}</p>
        <p className="tenue pequeno">
          Agente: prioridad {p.auditoria.prioridad_agente}, confianza {p.auditoria.confianza_agente} → final: prioridad {p.auditoria.prioridad_final},
          confianza {p.auditoria.confianza_final}. Auditado el {p.auditoria.fecha}.
        </p>
      </Seccion>
      <Seccion titulo="Por qué es interesante">
        <Parrafos texto={p.por_que_es_interesante} />
      </Seccion>
      <Seccion titulo="Etapa y ticket">
        <Parrafos texto={p.etapa_y_ticket} />
      </Seccion>
      <Seccion titulo="Cómo llegar">
        <Lista items={p.como_llegar} />
      </Seccion>
      <Seccion titulo="Riesgos y alertas">
        <Lista items={p.riesgos_o_alertas} />
      </Seccion>
      <Seccion titulo="Tesis de inversión">
        <Parrafos texto={p.tesis_de_inversion} />
      </Seccion>
      <Seccion titulo="Inversiones relevantes">
        <Lista items={p.inversiones_relevantes} />
      </Seccion>
      <Seccion titulo="Señales de encaje">
        <Lista items={p.senales_de_encaje} />
      </Seccion>
      <Seccion titulo="Antecedentes" abierta={false}>
        <Parrafos texto={p.antecedentes} />
      </Seccion>
      <Seccion titulo="Investigación larga" abierta={false}>
        <Parrafos texto={p.investigacion_larga} />
      </Seccion>
      <Seccion titulo="Otros perfiles" abierta={false}>
        <Parrafos texto={p.otros_perfiles} />
      </Seccion>
      <Seccion titulo={`Fuentes (${p.fuentes.length})`} abierta={false}>
        <Lista items={p.fuentes} />
      </Seccion>
    </section>
  );
}
