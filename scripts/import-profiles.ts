/**
 * Adds new investors to Firestore from research JSON files (Spanish keys: nombre, region, firma, rol,
 * tesis_de_inversion, antecedentes, por_que_es_interesante, investigacion_larga, fuentes, ...).
 *
 * Normalises each file to the canonical type and creates `investors/<id>` with the audit in "pending" status
 * (zero score, empty reason). Existing documents are never overwritten. Audit the profile in the database afterwards
 * and run `npm run recalculate`.
 *
 * Usage: npm run import -- <file.json | folder>
 */
import fs from "node:fs";
import path from "node:path";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";
import { parseConfidence, parseEmailStatus, parseInvestorType, parseRegion } from "./lib/spanish-values";

const source = process.argv[2];
if (!source) {
  console.error("Usage: npm run import -- <file.json | folder>");
  process.exit(1);
}

const URL_RE = /https?:\/\/[^\s)\]]+/;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const slugify = (s: string) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Splits free text into list items (lines, " || " separators or "1) 2) 3)" numbering). */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const text = String(value ?? "").trim();
  if (!text) return [];
  let parts = text.split(/\r?\n+|\s\|\|\s/);
  if (parts.length === 1 && /\s\d{1,2}\)\s/.test(text)) parts = text.split(/\s+(?=\d{1,2}\)\s)/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Short deduplicated notes: bullets stripped, first letter capitalised unless the note is a URL. */
function toNotes(value: unknown): string[] {
  const text = Array.isArray(value) ? value.map(String).join("\n") : String(value ?? "");
  const seen = new Set<string>();
  const notes: string[] = [];
  for (const raw of text.split(/\r?\n+|\s\|\|\s|\s\|\s/)) {
    let note = raw.trim().replace(/^[—–\-·•]\s*/, "").replace(/\s+/g, " ").trim();
    if (note && !/^(https?:\/\/|www\.)/i.test(note)) note = note[0].toUpperCase() + note.slice(1);
    if (!note || /^no encontrado\.?$/i.test(note) || seen.has(note.toLowerCase())) continue;
    seen.add(note.toLowerCase());
    notes.push(note);
  }
  return notes;
}

function splitLinkedin(value: unknown): { url: string; note: string } {
  const text = String(value ?? "").trim();
  const match = URL_RE.exec(text);
  if (!match) return { url: "", note: text };
  return { url: match[0].replace(/[),.;]+$/, ""), note: text.replace(match[0], "").replace(/^[\s(]+|[\s)]+$/g, "").trim() };
}

function normalise(research: Record<string, unknown>): Record<string, unknown> {
  const name = String(research.nombre ?? "").replace(/\s*\([^)]*\)/g, "").trim();
  const linkedin = splitLinkedin(research.linkedin);
  const rawEmail = String(research.email ?? "").trim();
  const emailMatch = EMAIL_RE.exec(rawEmail);
  const email = emailMatch ? emailMatch[0] : "";
  const emailNotes = toNotes([research.email_fuente, emailMatch ? rawEmail.replace(emailMatch[0], "") : rawEmail]);
  if (!emailNotes.length) emailNotes.push(email ? "Dirección tomada de la investigación; ver fuentes." : "No se localizó email individual en fuentes públicas.");
  const now = new Date().toISOString();
  return {
    id: String(research.id ?? slugify(name)),
    name,
    confidence: research.confianza ? parseConfidence(research.confianza) : "medium",
    region: parseRegion(research.region),
    firm: String(research.firma ?? ""),
    role: String(research.rol ?? ""),
    baseCity: String(research.ciudad_base ?? ""),
    investorType: parseInvestorType(research.tipo_inversor),
    investorTypeDetail: String(research.tipo_inversor ?? ""),
    stageAndTicket: toList(research.etapa_y_ticket),
    linkedin: linkedin.url,
    personalWebsite: "",
    email,
    emailStatus: email ? (research.email_estado ? parseEmailStatus(research.email_estado) : "public_sourced") : "not_found",
    whyInteresting: toList(research.por_que_es_interesante),
    investmentThesis: toList(research.tesis_de_inversion),
    background: String(research.antecedentes ?? ""),
    relevantInvestments: toList(research.inversiones_relevantes),
    fitSignals: toList(research.senales_de_encaje ?? research["señales_de_encaje"]),
    risksOrAlerts: toList(research.riesgos_o_alertas),
    howToReach: toList(research.como_llegar),
    deepResearch: String(research.investigacion_larga ?? ""),
    sources: toList(research.fuentes),
    contactSources: { email: emailNotes, linkedin: toNotes(linkedin.note), other: toNotes(research.otros_perfiles) },
    audit: {
      status: "pending",
      date: now.slice(0, 10),
      reason: "",
      score: { thesis: 0, stage: 0, decision: 0, spanish: 0, access: 0, otherAspects: 0, otherAspectsReason: "" },
    },
    updatedAt: now,
  };
}

const files = fs.statSync(source).isDirectory()
  ? fs.readdirSync(source).filter((file) => file.endsWith(".json") && !file.startsWith("_")).map((file) => path.join(source, file))
  : [source];

const db = connect();
(async () => {
  let created = 0;
  const warnings: string[] = [];
  for (const file of files) {
    try {
      const research = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")) as Record<string, unknown>;
      const investor = deriveInvestor(normalise(research));
      const ref = doc(db, COLLECTION, investor.id);
      if ((await getDoc(ref)).exists()) {
        warnings.push(`${investor.id}: already exists, not overwritten`);
        continue;
      }
      await setDoc(ref, investor);
      created++;
      console.log(`Created ${investor.id} (${investor.name}) - audit pending`);
    } catch (e) {
      warnings.push(`${path.basename(file)}: ${describeError(e)}`);
    }
  }
  console.log(`${created} investor(s) created.`);
  if (warnings.length) {
    console.error("\nWARNINGS:");
    for (const warning of warnings) console.error(" -", warning);
  }
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
