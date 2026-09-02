/**
 * Importa los perfiles JSON de la investigación, los normaliza al tipo canónico (src/types/inversor.ts),
 * los valida y los deja en data/perfiles/<id>.json más data/indice.json.
 *
 * Uso: npx tsx scripts/importar-perfiles.ts [carpeta_origen]
 * Por defecto lee de ../Benchmark/tools/inversores/perfiles_json (relativo a la raíz del proyecto).
 */
import fs from "node:fs";
import path from "node:path";
import { InversorSchema, NIVELES, resumenDe, type Inversor, type TipoInversor } from "../src/types/inversor";

const raiz = path.resolve(import.meta.dirname, "..");
const origen = path.resolve(process.argv[2] ?? path.join(raiz, "..", "Benchmark", "tools", "inversores", "perfiles_json"));
const destino = path.join(raiz, "data", "perfiles");
fs.mkdirSync(destino, { recursive: true });

const URL_RE = /https?:\/\/[^\s)\]]+/;

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Mapea el texto libre de tipo_inversor a uno de los cinco valores del enum. */
function tipoInversor(texto: string): TipoInversor {
  const t = sinAcentos(texto);
  if (t.startsWith("vc institucional")) return "VC institucional";
  if (t.startsWith("business angel")) return "Business angel";
  if (t.startsWith("fondo operador") || t.includes("solo gp")) return "Fondo operador / solo GP";
  if (t.startsWith("corporate vc")) return "Corporate VC";
  if (t.startsWith("aceleradora")) return "Aceleradora / programa";
  throw new Error(`tipo_inversor no reconocido: ${texto}`);
}

/** Convierte un campo lista-o-texto en array de strings (líneas, separadores " || " o enumeraciones "1) ... 2) ..."). */
function aLista(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v ?? "").trim();
  if (!s) return [];
  let partes = s.split(/\r?\n+|\s\|\|\s/);
  if (partes.length === 1 && /\s\d{1,2}\)\s/.test(s)) partes = s.split(/\s+(?=\d{1,2}\)\s)/);
  return partes.map((x) => x.trim()).filter(Boolean);
}

/** Separa la URL de LinkedIn de cualquier nota pegada ("... (probable, no verificado)"). */
function linkedin(v: unknown): { linkedin: string; linkedin_nota: string } {
  const s = String(v ?? "").trim();
  const m = URL_RE.exec(s);
  if (!m) return { linkedin: "", linkedin_nota: s };
  const url = m[0].replace(/[),.;]+$/, "");
  const nota = s.replace(m[0], "").replace(/^[\s(]+|[\s)]+$/g, "").trim();
  return { linkedin: url, linkedin_nota: nota };
}

function normalizar(id: string, d: Record<string, unknown>): Inversor {
  const li = linkedin(d.linkedin);
  const email = String(d.email ?? "").trim();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const candidato = {
    ...d,
    id,
    nivel_etiqueta: NIVELES[String(d.nivel) as keyof typeof NIVELES] ?? d.nivel_etiqueta,
    tipo_inversor: tipoInversor(String(d.tipo_inversor ?? "")),
    tipo_inversor_detalle: String(d.tipo_inversor ?? ""),
    linkedin: li.linkedin,
    linkedin_nota: li.linkedin_nota,
    email: emailValido ? email : "",
    email_estado: emailValido ? d.email_estado : "no encontrado",
    email_fuente: emailValido || !email ? String(d.email_fuente ?? "") : `${d.email_fuente ?? ""} | valor original no válido: ${email}`.trim(),
    inversiones_relevantes: aLista(d.inversiones_relevantes),
    senales_de_encaje: aLista(d.senales_de_encaje ?? (d as Record<string, unknown>)["señales_de_encaje"]),
    riesgos_o_alertas: aLista(d.riesgos_o_alertas),
    como_llegar: aLista(d.como_llegar),
    fuentes: aLista(d.fuentes),
  };
  delete (candidato as Record<string, unknown>)["señales_de_encaje"];
  return InversorSchema.parse(candidato);
}

const archivos = fs.readdirSync(origen).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();
const perfiles: Inversor[] = [];
const errores: string[] = [];
for (const f of archivos) {
  const id = f.replace(/\.json$/, "");
  try {
    const bruto = JSON.parse(fs.readFileSync(path.join(origen, f), "utf8").replace(/^﻿/, ""));
    const p = normalizar(id, bruto);
    fs.writeFileSync(path.join(destino, `${id}.json`), JSON.stringify(p, null, 2) + "\n", "utf8");
    perfiles.push(p);
  } catch (e) {
    errores.push(`${f}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const orden = { "1": 0, "2": 1, r: 2, x: 3 } as const;
perfiles.sort((a, b) => orden[a.nivel] - orden[b.nivel] || a.region.localeCompare(b.region) || a.prioridad.localeCompare(b.prioridad) || a.nombre.localeCompare(b.nombre));
const indice = { generado: new Date().toISOString().slice(0, 10), total: perfiles.length, perfiles: perfiles.map(resumenDe) };
fs.writeFileSync(path.join(raiz, "data", "indice.json"), JSON.stringify(indice, null, 1) + "\n", "utf8");

const cuenta = (k: keyof Inversor) => perfiles.reduce<Record<string, number>>((acc, p) => ((acc[String(p[k])] = (acc[String(p[k])] ?? 0) + 1), acc), {});
console.log(`Origen: ${origen}`);
console.log(`Importados ${perfiles.length}/${archivos.length} perfiles -> ${destino}`);
console.log("nivel:", cuenta("nivel"), "| prioridad:", cuenta("prioridad"), "| tipo:", cuenta("tipo_inversor"));
console.log("linkedin con nota:", perfiles.filter((p) => p.linkedin_nota).length, "| sin linkedin:", perfiles.filter((p) => !p.linkedin).map((p) => p.nombre));
if (errores.length) {
  console.error("\nERRORES DE VALIDACIÓN:");
  for (const e of errores) console.error(" -", e);
  process.exit(1);
}
