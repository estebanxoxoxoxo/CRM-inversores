import type { Banda, Confianza, EmailEstado, InversorResumen, Region, TipoInversor } from "../types/inversor";

export interface Filtros {
  texto: string;
  banda: Banda[];
  nivelMin: number;
  region: Region[];
  confianza: Confianza[];
  tipo: TipoInversor[];
  email: EmailEstado[];
  conLinkedin: boolean;
  orden: "nivel" | "nombre" | "firma" | "region";
}

export const FILTROS_VACIOS: Filtros = {
  texto: "",
  banda: [],
  nivelMin: 0,
  region: [],
  confianza: [],
  tipo: [],
  email: [],
  conLinkedin: false,
  orden: "nivel",
};

/** Por defecto la app abre con las dos bandas útiles para outreach. */
export const FILTROS_INICIALES: Filtros = { ...FILTROS_VACIOS, banda: ["Indiscutible", "Alto potencial"] };

const CLAVES_LISTA = ["banda", "region", "confianza", "tipo", "email"] as const;

export function filtrosDesdeUrl(): Filtros {
  const q = new URLSearchParams(window.location.search);
  if (![...q.keys()].length) return FILTROS_INICIALES;
  const f: Filtros = { ...FILTROS_VACIOS, texto: q.get("q") ?? "", conLinkedin: q.get("li") === "1" };
  const orden = q.get("orden");
  if (orden === "nivel" || orden === "nombre" || orden === "firma" || orden === "region") f.orden = orden;
  const min = Number(q.get("min"));
  if (Number.isFinite(min) && min > 0) f.nivelMin = Math.min(100, Math.max(0, min));
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
  if (f.nivelMin > 0) q.set("min", String(f.nivelMin));
  if (f.conLinkedin) q.set("li", "1");
  if (f.orden !== "nivel") q.set("orden", f.orden);
  const qs = q.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function aplicarFiltros(perfiles: InversorResumen[], f: Filtros): InversorResumen[] {
  const texto = normalizar(f.texto.trim());
  const res = perfiles.filter((p) => {
    if (f.banda.length && !f.banda.includes(p.banda)) return false;
    if (p.nivel < f.nivelMin) return false;
    if (f.region.length && !f.region.includes(p.region)) return false;
    if (f.confianza.length && !f.confianza.includes(p.confianza)) return false;
    if (f.tipo.length && !f.tipo.includes(p.tipo_inversor)) return false;
    if (f.email.length && !f.email.includes(p.email_estado)) return false;
    if (f.conLinkedin && !p.linkedin) return false;
    if (texto) {
      const pajar = normalizar([p.nombre, p.firma, p.rol, p.ciudad_base, p.etapa_resumen, p.motivo_nivel].join(" · "));
      if (!texto.split(/\s+/).every((t) => pajar.includes(t))) return false;
    }
    return true;
  });
  const cmp: Record<Filtros["orden"], (a: InversorResumen, b: InversorResumen) => number> = {
    nivel: (a, b) => b.nivel - a.nivel || a.nombre.localeCompare(b.nombre),
    nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    firma: (a, b) => a.firma.localeCompare(b.firma) || a.nombre.localeCompare(b.nombre),
    region: (a, b) => a.region.localeCompare(b.region) || b.nivel - a.nivel || a.nombre.localeCompare(b.nombre),
  };
  return res.sort(cmp[f.orden]);
}
