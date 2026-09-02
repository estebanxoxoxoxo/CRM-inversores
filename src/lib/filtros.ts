import type { Confianza, EmailEstado, InversorResumen, Nivel, Prioridad, Region, TipoInversor } from "../types/inversor";

export interface Filtros {
  texto: string;
  nivel: Nivel[];
  region: Region[];
  prioridad: Prioridad[];
  confianza: Confianza[];
  tipo: TipoInversor[];
  email: EmailEstado[];
  conLinkedin: boolean;
  orden: "nivel" | "nombre" | "firma" | "region";
}

export const FILTROS_VACIOS: Filtros = {
  texto: "",
  nivel: [],
  region: [],
  prioridad: [],
  confianza: [],
  tipo: [],
  email: [],
  conLinkedin: false,
  orden: "nivel",
};

/** Por defecto la app abre mostrando los dos niveles útiles para outreach. */
export const FILTROS_INICIALES: Filtros = { ...FILTROS_VACIOS, nivel: ["1", "2"] };

const CLAVES_LISTA = ["nivel", "region", "prioridad", "confianza", "tipo", "email"] as const;

export function filtrosDesdeUrl(): Filtros {
  const q = new URLSearchParams(window.location.search);
  if (![...q.keys()].length) return FILTROS_INICIALES;
  const f: Filtros = { ...FILTROS_VACIOS, texto: q.get("q") ?? "", conLinkedin: q.get("li") === "1" };
  const orden = q.get("orden");
  if (orden === "nivel" || orden === "nombre" || orden === "firma" || orden === "region") f.orden = orden;
  for (const k of CLAVES_LISTA) {
    const v = q.get(k);
    if (v) (f as unknown as Record<string, string[]>)[k] = v.split("|");
  }
  return f;
}

export function filtrosAUrl(f: Filtros): void {
  const q = new URLSearchParams();
  if (f.texto) q.set("q", f.texto);
  for (const k of CLAVES_LISTA) {
    const v = f[k] as string[];
    if (v.length) q.set(k, v.join("|"));
  }
  if (f.conLinkedin) q.set("li", "1");
  if (f.orden !== "nivel") q.set("orden", f.orden);
  const qs = q.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const ORDEN_NIVEL: Record<Nivel, number> = { "1": 0, "2": 1, r: 2, x: 3 };

export function aplicarFiltros(perfiles: InversorResumen[], f: Filtros): InversorResumen[] {
  const texto = normalizar(f.texto.trim());
  const res = perfiles.filter((p) => {
    if (f.nivel.length && !f.nivel.includes(p.nivel)) return false;
    if (f.region.length && !f.region.includes(p.region)) return false;
    if (f.prioridad.length && !f.prioridad.includes(p.prioridad)) return false;
    if (f.confianza.length && !f.confianza.includes(p.confianza)) return false;
    if (f.tipo.length && !f.tipo.includes(p.tipo_inversor)) return false;
    if (f.email.length && !f.email.includes(p.email_estado)) return false;
    if (f.conLinkedin && !p.linkedin) return false;
    if (texto) {
      const pajar = normalizar([p.nombre, p.firma, p.rol, p.ciudad_base, p.etapa_y_ticket, p.motivo_nivel].join(" · "));
      if (!texto.split(/\s+/).every((t) => pajar.includes(t))) return false;
    }
    return true;
  });
  const cmp: Record<Filtros["orden"], (a: InversorResumen, b: InversorResumen) => number> = {
    nivel: (a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || a.prioridad.localeCompare(b.prioridad) || a.nombre.localeCompare(b.nombre),
    nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    firma: (a, b) => a.firma.localeCompare(b.firma) || a.nombre.localeCompare(b.nombre),
    region: (a, b) => a.region.localeCompare(b.region) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || a.nombre.localeCompare(b.nombre),
  };
  return res.sort(cmp[f.orden]);
}
