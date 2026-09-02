import { BANDAS, ConfianzaSchema, EmailEstadoSchema, RegionSchema, TipoInversorSchema, UMBRALES, type InversorResumen } from "../types/inversor";
import { FILTROS_INICIALES, FILTROS_VACIOS, type Filtros } from "../lib/filtros";

interface Props {
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  perfiles: InversorResumen[];
}

type ClaveLista = "banda" | "region" | "confianza" | "tipo" | "email";

const RANGO_BANDA: Record<string, string> = {
  Indiscutible: `${UMBRALES.Indiscutible}-100`,
  "Alto potencial": `${UMBRALES["Alto potencial"]}-${UMBRALES.Indiscutible - 1}`,
  Reserva: `${UMBRALES.Reserva}-${UMBRALES["Alto potencial"] - 1}`,
  Descartado: `0-${UMBRALES.Reserva - 1}`,
  "Sin auditar": "pendiente",
};

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
            Indiscutibles y alto potencial
          </button>
          <button type="button" className="enlace" onClick={() => onChange(FILTROS_VACIOS)}>
            Ver todo
          </button>
        </div>
      </div>
      {grupo("Banda", "banda", "banda", BANDAS, (v) => `${v} (${RANGO_BANDA[v]})`)}
      <fieldset className="grupo">
        <legend>Nivel mínimo: {filtros.nivelMin}</legend>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={filtros.nivelMin}
          onChange={(e) => onChange({ ...filtros, nivelMin: Number(e.target.value) })}
          className="rango"
          aria-label="Nivel mínimo"
        />
      </fieldset>
      {grupo("Región", "region", "region", RegionSchema.options)}
      {grupo("Tipo de inversor", "tipo", "tipo_inversor", TipoInversorSchema.options)}
      {grupo("Confianza en las fuentes", "confianza", "confianza", ConfianzaSchema.options)}
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
            <option value="nivel">Nivel (mayor a menor)</option>
            <option value="nombre">Nombre</option>
            <option value="firma">Firma</option>
            <option value="region">Región</option>
          </select>
        </label>
      </fieldset>
    </aside>
  );
}
