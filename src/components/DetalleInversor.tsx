import { useEffect, useState, type ReactNode } from "react";
import { cargarPerfil } from "../lib/datos";
import type { Inversor, Puntuacion } from "../types/inversor";
import { Etiqueta, Nivel, claseBanda } from "./ListaInversores";

interface Props {
  id: string | null;
  onCerrar: () => void;
}

const URL_RE = /(https?:\/\/[^\s)\]]+)/g;

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

const DIMENSIONES: { clave: keyof Puntuacion; etiqueta: string; max: number }[] = [
  { clave: "tesis", etiqueta: "Tesis y encaje", max: 25 },
  { clave: "etapa", etiqueta: "Etapa y pre-tracción", max: 20 },
  { clave: "decision", etiqueta: "Decisión y capital", max: 20 },
  { clave: "espanol", etiqueta: "Español y cercanía", max: 15 },
  { clave: "acceso", etiqueta: "Acceso y actividad", max: 15 },
];

function Desglose({ p }: { p: Puntuacion }) {
  return (
    <div className="desglose">
      {DIMENSIONES.map((d) => (
        <div key={d.clave} className="dim">
          <span className="dim-etiqueta">{d.etiqueta}</span>
          <span className="dim-barra">
            <span className="dim-relleno" style={{ width: `${(100 * Number(p[d.clave])) / d.max}%` }} />
          </span>
          <span className="dim-valor">
            {String(p[d.clave])}/{d.max}
          </span>
        </div>
      ))}
      <div className="dim dim-otros" title="Otros aspectos: puntos que se suman o restan (-15 a +5) por circunstancias concretas que las cinco dimensiones no miden: conflicto de cartera con un competidor, filtros legales o geográficos, redundancia con otro contacto del mismo fondo, estado del fondo, o bonus por un deal directamente comparable.">
        <span className="dim-etiqueta">Otros aspectos</span>
        <span className="dim-barra dim-otros-texto">{p.otros_aspectos_motivo || "Ninguno."}</span>
        <span className="dim-valor">{p.otros_aspectos > 0 ? `+${p.otros_aspectos}` : p.otros_aspectos}</span>
      </div>
      {p.topes.length > 0 && <p className="tenue pequeno">Bruto {p.bruto}. Topes aplicados: {p.topes.join("; ")}.</p>}
    </div>
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
        <Nivel nivel={p.nivel} banda={p.banda} grande />
        <div className="detalle-titulo">
          <h2>{p.nombre}</h2>
          <p className="detalle-sub">
            {p.rol} · <strong>{p.firma}</strong> · {p.ciudad_base}
          </p>
          <p className="detalle-etiquetas">
            <Etiqueta clase={claseBanda(p.banda)}>{p.banda}</Etiqueta>
            <Etiqueta clase={`conf-${p.confianza}`}>Fuentes: {p.confianza}</Etiqueta>
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

      <Seccion titulo={`Nivel ${p.nivel}: motivo y desglose`}>
        <p>{p.auditoria.motivo}</p>
        <Desglose p={p.auditoria.puntuacion} />
      </Seccion>
      <Seccion titulo="Por qué es interesante">
        <Lista items={p.por_que_es_interesante} />
      </Seccion>
      <Seccion titulo="Tesis de inversión">
        <Lista items={p.tesis_de_inversion} />
      </Seccion>
      <Seccion titulo="Etapa y ticket">
        <Lista items={p.etapa_y_ticket} />
      </Seccion>
      <Seccion titulo="Cómo llegar">
        <Lista items={p.como_llegar} />
      </Seccion>
      <Seccion titulo="Riesgos y alertas">
        <Lista items={p.riesgos_o_alertas} />
      </Seccion>
      <Seccion titulo="Inversiones relevantes" abierta={false}>
        <Lista items={p.inversiones_relevantes} />
      </Seccion>
      <Seccion titulo="Señales de encaje" abierta={false}>
        <Lista items={p.senales_de_encaje} />
      </Seccion>
      <Seccion titulo="Antecedentes" abierta={false}>
        <Parrafos texto={p.antecedentes} />
      </Seccion>
      <Seccion titulo="Investigación larga" abierta={false}>
        <Parrafos texto={p.investigacion_larga} />
      </Seccion>
      <Seccion titulo={`Fuentes (${p.fuentes.length})`} abierta={false}>
        <Lista items={p.fuentes} />
      </Seccion>
      <Seccion titulo="Auditoría anterior (v1)" abierta={false}>
        <p className="tenue pequeno">
          Nivel v1: {p.auditoria.nivel_v1} · prioridad del agente {p.auditoria.prioridad_agente}, v1 {p.auditoria.prioridad_v1} · confianza del agente{" "}
          {p.auditoria.confianza_agente}. Auditado el {p.auditoria.fecha}.
        </p>
        <p className="tenue">{p.auditoria.motivo_v1}</p>
      </Seccion>
      <Seccion titulo="Fuente de vías de contacto" abierta={false}>
        <h4 className="sub">Email</h4>
        <Lista items={p.fuente_vias_de_contacto.email} />
        <h4 className="sub">LinkedIn</h4>
        <Lista items={p.fuente_vias_de_contacto.linkedin.length ? p.fuente_vias_de_contacto.linkedin : [p.linkedin ? "Perfil localizado y enlazado arriba." : "Sin LinkedIn público localizado."]} />
        <h4 className="sub">Otras vías y perfiles</h4>
        <Lista items={p.fuente_vias_de_contacto.otras} />
      </Seccion>
    </section>
  );
}
