import { ConfianzaSchema, EmailEstadoSchema, NIVELES, PrioridadSchema, RegionSchema, TipoInversorSchema, type InversorResumen } from "../types/inversor";
import { FILTROS_INICIALES, FILTROS_VACIOS, type Filtros } from "../lib/filtros";

interface Props {
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  perfiles: InversorResumen[];
}

type ClaveLista = "nivel" | "region" | "prioridad" | "confianza" | "tipo" | "email";

export default function PanelFiltros({ filtros, onChange, perfiles }: Props) {
  const alternar = (clave: ClaveLista, valor: string) => {
    const actual = filtros[clave] as string[];
    const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor];
    onChange({ ...filtros, [clave]: nuevo });
  };
  const contar = (campo: keyof InversorResumen, valor: string) => perfiles.filter((p) => p[campo] === valor).length;

  const grupo = (titulo: string, clave: ClaveLista, campo: keyof InversorResumen, valores: readonly string[], etiqueta?: (v: string) => string) => (
    <fieldset className="grupo">
      <legend>{titulo}</legend>
      {valores.map((v) => (
        <label key={v} className="opcion">
          <input type="checkbox" checked={(filtros[clave] as string[]).includes(v)} onChange={() => alternar(clave, v)} />
          <span className="opcion-texto">{etiqueta ? etiqueta(v) : v}</span>
          <span className="opcion-n">{contar(campo, v)}</span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <aside className="filtros">
      <div className="filtros-cabecera">
        <input
          type="search"
          className="buscador"
          placeholder="Buscar nombre, firma, rol, ciudad…"
          value={filtros.texto}
          onChange={(e) => onChange({ ...filtros, texto: e.target.value })}
        />
        <div className="filtros-acciones">
          <button type="button" className="enlace" onClick={() => onChange(FILTROS_INICIALES)}>
            Niveles 1 y 2
          </button>
          <button type="button" className="enlace" onClick={() => onChange(FILTROS_VACIOS)}>
            Ver todo
          </button>
        </div>
      </div>
      {grupo("Nivel", "nivel", "nivel", Object.keys(NIVELES), (v) => NIVELES[v as keyof typeof NIVELES])}
      {grupo("Región", "region", "region", RegionSchema.options)}
      {grupo("Prioridad", "prioridad", "prioridad", PrioridadSchema.options)}
      {grupo("Confianza", "confianza", "confianza", ConfianzaSchema.options)}
      {grupo("Tipo de inversor", "tipo", "tipo_inversor", TipoInversorSchema.options)}
      {grupo("Email", "email", "email_estado", EmailEstadoSchema.options)}
      <fieldset className="grupo">
        <legend>Otros</legend>
        <label className="opcion">
          <input type="checkbox" checked={filtros.conLinkedin} onChange={(e) => onChange({ ...filtros, conLinkedin: e.target.checked })} />
          <span className="opcion-texto">Sólo con LinkedIn</span>
        </label>
        <label className="opcion opcion-select">
          <span className="opcion-texto">Orden</span>
          <select value={filtros.orden} onChange={(e) => onChange({ ...filtros, orden: e.target.value as Filtros["orden"] })}>
            <option value="nivel">Nivel y prioridad</option>
            <option value="nombre">Nombre</option>
            <option value="firma">Firma</option>
            <option value="region">Región</option>
          </select>
        </label>
      </fieldset>
    </aside>
  );
}
