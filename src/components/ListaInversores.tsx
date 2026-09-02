import type { ReactNode } from "react";
import type { InversorResumen } from "../types/inversor";

interface Props {
  perfiles: InversorResumen[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
}

export function Etiqueta({ clase, children, title }: { clase: string; children: ReactNode; title?: string }) {
  return (
    <span className={`etiqueta ${clase}`} title={title}>
      {children}
    </span>
  );
}

export function regionCorta(r: string): string {
  if (r.startsWith("EE.UU.")) return "EE. UU.";
  if (r.startsWith("Fuera")) return "Fuera de región";
  return r;
}

export default function ListaInversores({ perfiles, seleccionado, onSeleccionar }: Props) {
  if (!perfiles.length) return <p className="vacio">Ningún perfil coincide con los filtros.</p>;
  return (
    <ul className="lista">
      {perfiles.map((p) => (
        <li key={p.id}>
          <button type="button" className={`tarjeta ${seleccionado === p.id ? "activa" : ""}`} onClick={() => onSeleccionar(p.id)}>
            <div className="tarjeta-linea1">
              <Etiqueta clase={`nivel-${p.nivel}`} title={p.nivel_etiqueta}>
                {p.nivel === "r" ? "R" : p.nivel === "x" ? "X" : p.nivel}
              </Etiqueta>
              <span className="tarjeta-nombre">{p.nombre}</span>
              <Etiqueta clase={`prio-${p.prioridad}`} title={`Prioridad ${p.prioridad}`}>
                {p.prioridad}
              </Etiqueta>
              <Etiqueta clase={`conf-${p.confianza}`} title={`Confianza ${p.confianza}`}>
                {p.confianza}
              </Etiqueta>
            </div>
            <div className="tarjeta-linea2">
              <span className="tarjeta-firma">{p.firma}</span>
              <span className="separador">·</span>
              <span className="tarjeta-rol">{p.rol}</span>
            </div>
            <div className="tarjeta-linea3">
              <span>{regionCorta(p.region)}</span>
              <span className="separador">·</span>
              <span>{p.tipo_inversor}</span>
              {p.email && (
                <>
                  <span className="separador">·</span>
                  <span className="tenue">{p.email_estado.startsWith("buzón") ? "buzón general" : "email"}</span>
                </>
              )}
              {p.linkedin && (
                <>
                  <span className="separador">·</span>
                  <span className="tenue">LinkedIn</span>
                </>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
