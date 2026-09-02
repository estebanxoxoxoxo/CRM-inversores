/**
 * Importa los perfiles JSON de la investigación original, los normaliza y les aplica la auditoría v2
 * (data/auditoria_v2), dejando data/perfiles/<id>.json y data/indice.json validados contra el tipo canónico.
 *
 * Uso: npm run importar [carpeta_origen]
 * Por defecto lee de ../Benchmark/tools/inversores/perfiles_json (relativo a la raíz del proyecto).
 * Para re-aplicar sólo la auditoría sobre data/perfiles ya importados, usar npm run auditar.
 */
import fs from "node:fs";
import path from "node:path";
import { resumenDe, type Inversor, type TipoInversor } from "../src/types/inversor";
import { aplicarV2, cargarDecisiones, ordenarPerfiles } from "./lib/auditoria-v2";

const raiz = path.resolve(import.meta.dirname, "..");
const origen = path.resolve(process.argv[2] ?? path.join(raiz, "..", "Benchmark", "tools", "inversores", "perfiles_json"));
const destino = path.join(raiz, "data", "perfiles");
fs.mkdirSync(destino, { recursive: true });
const decisiones = cargarDecisiones(raiz);
const hoy = new Date().toISOString().slice(0, 10);

const URL_RE = /https?:\/\/[^\s)\]]+/;
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function tipoInversor(texto: string): TipoInversor {
  const t = sinAcentos(texto);
  if (t.startsWith("vc institucional")) return "VC institucional";
  if (t.startsWith("business angel")) return "Business angel";
  if (t.startsWith("fondo operador") || t.includes("solo gp")) return "Fondo operador / solo GP";
  if (t.startsWith("corporate vc")) return "Corporate VC";
  if (t.startsWith("aceleradora")) return "Aceleradora / programa";
  throw new Error(`tipo_inversor no reconocido: ${texto}`);
}

function aLista(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v ?? "").trim();
  if (!s) return [];
  let partes = s.split(/\r?\n+|\s\|\|\s/);
  if (partes.length === 1 && /\s\d{1,2}\)\s/.test(s)) partes = s.split(/\s+(?=\d{1,2}\)\s)/);
  return partes.map((x) => x.trim()).filter(Boolean);
}

function linkedin(v: unknown): { linkedin: string; linkedin_nota: string } {
  const s = String(v ?? "").trim();
  const m = URL_RE.exec(s);
  if (!m) return { linkedin: "", linkedin_nota: s };
  return { linkedin: m[0].replace(/[),.;]+$/, ""), linkedin_nota: s.replace(m[0], "").replace(/^[\s(]+|[\s)]+$/g, "").trim() };
}

/** Normaliza el JSON bruto de la investigación (forma v1) sin validarlo aún: la validación la hace aplicarV2. */
function normalizar(id: string, d: Record<string, unknown>): Record<string, unknown> {
  const li = linkedin(d.linkedin);
  const email = String(d.email ?? "").trim();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const out: Record<string, unknown> = {
    ...d,
    id,
    tipo_inversor: tipoInversor(String(d.tipo_inversor ?? "")),
    tipo_inversor_detalle: String(d.tipo_inversor ?? ""),
    linkedin: li.linkedin,
    linkedin_nota: li.linkedin_nota,
    email: emailValido ? email : "",
    email_estado: emailValido ? d.email_estado : "no encontrado",
    email_fuente: emailValido || !email ? String(d.email_fuente ?? "") : `${d.email_fuente ?? ""} | valor original no válido: ${email}`.trim(),
    inversiones_relevantes: aLista(d.inversiones_relevantes),
    senales_de_encaje: aLista(d.senales_de_encaje ?? d["señales_de_encaje"]),
    riesgos_o_alertas: aLista(d.riesgos_o_alertas),
    como_llegar: aLista(d.como_llegar),
    fuentes: aLista(d.fuentes),
    etapa_y_ticket: aLista(d.etapa_y_ticket),
  };
  delete out["señales_de_encaje"];
  return out;
}

const archivos = fs.readdirSync(origen).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();
const perfiles: Inversor[] = [];
const errores: string[] = [];
for (const f of archivos) {
  const id = f.replace(/\.json$/, "");
  try {
    const bruto = JSON.parse(fs.readFileSync(path.join(origen, f), "utf8").replace(/^﻿/, "")) as Record<string, unknown>;
    const d = decisiones[id];
    if (!d) throw new Error("sin decisión en data/auditoria_v2");
    const p = aplicarV2(normalizar(id, bruto), d, hoy);
    fs.writeFileSync(path.join(destino, `${id}.json`), JSON.stringify(p, null, 2) + "\n", "utf8");
    perfiles.push(p);
  } catch (e) {
    errores.push(`${f}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
ordenarPerfiles(perfiles);
fs.writeFileSync(
  path.join(raiz, "data", "indice.json"),
  JSON.stringify({ generado: hoy, version: 2, total: perfiles.length, perfiles: perfiles.map(resumenDe) }, null, 1) + "\n",
  "utf8",
);
const cuenta = (f: (p: Inversor) => string) => perfiles.reduce<Record<string, number>>((a, p) => ((a[f(p)] = (a[f(p)] ?? 0) + 1), a), {});
console.log(`Origen: ${origen}`);
console.log(`Importados ${perfiles.length}/${archivos.length} perfiles -> ${destino}`);
console.log("bandas:", cuenta((p) => p.banda), "| tipo:", cuenta((p) => p.tipo_inversor));
console.log("sin linkedin:", perfiles.filter((p) => !p.linkedin).map((p) => p.nombre));
if (errores.length) {
  console.error("\nERRORES:");
  for (const e of errores) console.error(" -", e);
  process.exit(1);
}
