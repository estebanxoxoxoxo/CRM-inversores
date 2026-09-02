/**
 * Alta de inversores nuevos directamente en Firestore a partir de un JSON de investigación (nombre, region, firma,
 * rol, tesis_de_inversion, antecedentes, por_que_es_interesante, investigacion_larga, fuentes, etc.).
 *
 * Normaliza al tipo canónico, crea `inversores/<id>` con la auditoría en estado "pendiente" (puntuación a cero,
 * motivo vacío) y regenera `meta/indice`. No sobrescribe documentos que ya existen. Después se audita el perfil
 * (en la base) y se ejecuta `npm run recalcular`.
 *
 * Uso: npm run importar -- <archivo.json | carpeta>
 */
import fs from "node:fs";
import path from "node:path";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { derivar, type TipoInversor } from "../src/types/inversor";
import { conectar, explicarError } from "./lib/firestore";
import { recalcularBase } from "./recalcular";

const origen = process.argv[2];
if (!origen) {
  console.error("Uso: npm run importar -- <archivo.json | carpeta>");
  process.exit(1);
}

const URL_RE = /https?:\/\/[^\s)\]]+/;
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slug = (s: string) => sinAcentos(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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

function aNotas(v: unknown): string[] {
  const texto = Array.isArray(v) ? v.map(String).join("\n") : String(v ?? "");
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const bruto of texto.split(/\r?\n+|\s\|\|\s|\s\|\s/)) {
    let n = bruto.trim().replace(/^[—–\-·•]\s*/, "").replace(/\s+/g, " ").trim();
    if (n && !/^(https?:\/\/|www\.)/i.test(n)) n = n[0].toUpperCase() + n.slice(1);
    if (!n || /^no encontrado\.?$/i.test(n) || vistas.has(n.toLowerCase())) continue;
    vistas.add(n.toLowerCase());
    out.push(n);
  }
  return out;
}

function linkedin(v: unknown): { url: string; nota: string } {
  const s = String(v ?? "").trim();
  const m = URL_RE.exec(s);
  if (!m) return { url: "", nota: s };
  return { url: m[0].replace(/[),.;]+$/, ""), nota: s.replace(m[0], "").replace(/^[\s(]+|[\s)]+$/g, "").trim() };
}

function normalizar(d: Record<string, unknown>): Record<string, unknown> {
  const id = String(d.id ?? slug(String(d.nombre ?? "")));
  const li = linkedin(d.linkedin);
  const emailBruto = String(d.email ?? "").trim();
  const m = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.exec(emailBruto);
  const email = m ? m[0] : "";
  const notasEmail = aNotas([d.email_fuente, m ? emailBruto.replace(m[0], "") : emailBruto]);
  if (!notasEmail.length) notasEmail.push(email ? "Dirección tomada de la investigación; ver fuentes." : "No se localizó email individual en fuentes públicas.");
  return {
    id,
    nombre: String(d.nombre ?? "").replace(/\s*\([^)]*\)/g, "").trim(),
    confianza: d.confianza ?? "media",
    region: d.region,
    firma: d.firma ?? "",
    rol: d.rol ?? "",
    ciudad_base: d.ciudad_base ?? "",
    tipo_inversor: tipoInversor(String(d.tipo_inversor ?? "")),
    tipo_inversor_detalle: String(d.tipo_inversor ?? ""),
    etapa_y_ticket: aLista(d.etapa_y_ticket),
    linkedin: li.url,
    web_personal: "",
    email,
    email_estado: email ? String(d.email_estado ?? "") || "público (ver fuente)" : "no encontrado",
    por_que_es_interesante: aLista(d.por_que_es_interesante),
    tesis_de_inversion: aLista(d.tesis_de_inversion),
    antecedentes: String(d.antecedentes ?? ""),
    inversiones_relevantes: aLista(d.inversiones_relevantes),
    senales_de_encaje: aLista(d.senales_de_encaje ?? d["señales_de_encaje"]),
    riesgos_o_alertas: aLista(d.riesgos_o_alertas),
    como_llegar: aLista(d.como_llegar),
    investigacion_larga: String(d.investigacion_larga ?? ""),
    fuentes: aLista(d.fuentes),
    fuente_vias_de_contacto: { email: notasEmail, linkedin: aNotas(li.nota), otras: aNotas(d.otros_perfiles) },
    auditoria: {
      estado: "pendiente",
      fecha: new Date().toISOString().slice(0, 10),
      motivo: "",
      puntuacion: { tesis: 0, etapa: 0, decision: 0, espanol: 0, acceso: 0, otros_aspectos: 0, otros_aspectos_motivo: "" },
    },
  };
}

const rutas = fs.statSync(origen).isDirectory()
  ? fs.readdirSync(origen).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => path.join(origen, f))
  : [origen];

const db = conectar();
(async () => {
  let altas = 0;
  const avisos: string[] = [];
  for (const ruta of rutas) {
    try {
      const bruto = JSON.parse(fs.readFileSync(ruta, "utf8").replace(/^﻿/, "")) as Record<string, unknown>;
      const p = derivar(normalizar(bruto));
      const ref = doc(db, "inversores", p.id);
      if ((await getDoc(ref)).exists()) {
        avisos.push(`${p.id}: ya existe en la base, no se sobrescribe`);
        continue;
      }
      await setDoc(ref, { ...p, actualizado: new Date().toISOString() });
      altas++;
      console.log(`Alta: ${p.id} (${p.nombre}) — auditoría pendiente`);
    } catch (e) {
      avisos.push(`${path.basename(ruta)}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const { perfiles } = await recalcularBase(db);
  console.log(`${altas} alta(s). Índice regenerado con ${perfiles.length} perfiles.`);
  if (avisos.length) {
    console.error("\nAVISOS:");
    for (const a of avisos) console.error(" -", a);
  }
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explicarError(e));
  process.exit(1);
});
