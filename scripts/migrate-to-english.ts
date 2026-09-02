/**
 * One-off migration: `inversores/*` (Spanish fields) -> `investors/*` (English fields).
 *
 *   npm run migrate                    writes investors/*; legacy collections are left untouched
 *   npm run migrate -- --delete-legacy same, then deletes `inversores` and `meta`
 *
 * The legacy documents are written to backups/<timestamp>/legacy/ in both modes.
 */
import fs from "node:fs";
import path from "node:path";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { COLLECTION, deriveInvestor, describeError, type Investor } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";
import { parseConfidence, parseEmailStatus, parseInvestorType, parseRegion } from "./lib/spanish-values";

type Doc = Record<string, unknown>;

function translate(legacy: Doc, now: string): Investor {
  const audit = (legacy.auditoria ?? {}) as Doc;
  const score = (audit.puntuacion ?? {}) as Doc;
  const contact = (legacy.fuente_vias_de_contacto ?? {}) as Doc;
  return deriveInvestor({
    id: legacy.id,
    name: legacy.nombre,
    confidence: parseConfidence(legacy.confianza),
    region: parseRegion(legacy.region),
    firm: legacy.firma,
    role: legacy.rol,
    baseCity: legacy.ciudad_base,
    investorType: parseInvestorType(legacy.tipo_inversor),
    investorTypeDetail: legacy.tipo_inversor_detalle,
    stageAndTicket: legacy.etapa_y_ticket,
    linkedin: legacy.linkedin,
    personalWebsite: legacy.web_personal,
    email: legacy.email,
    emailStatus: parseEmailStatus(legacy.email_estado),
    whyInteresting: legacy.por_que_es_interesante,
    investmentThesis: legacy.tesis_de_inversion,
    background: legacy.antecedentes,
    relevantInvestments: legacy.inversiones_relevantes,
    fitSignals: legacy.senales_de_encaje,
    risksOrAlerts: legacy.riesgos_o_alertas,
    howToReach: legacy.como_llegar,
    deepResearch: legacy.investigacion_larga,
    sources: legacy.fuentes,
    contactSources: { email: contact.email, linkedin: contact.linkedin, other: contact.otras },
    audit: {
      status: audit.estado === "pendiente" ? "pending" : "reviewed",
      date: audit.fecha,
      reason: audit.motivo,
      score: {
        thesis: score.tesis,
        stage: score.etapa,
        decision: score.decision,
        spanish: score.espanol,
        access: score.acceso,
        otherAspects: score.otros_aspectos,
        otherAspectsReason: score.otros_aspectos_motivo,
      },
    },
    updatedAt: now,
  });
}

const root = path.resolve(import.meta.dirname, "..");
const db = connect();
(async () => {
  const now = new Date().toISOString();
  const legacyInvestors = await getDocs(collection(db, "inversores"));
  const legacyMeta = await getDocs(collection(db, "meta"));
  console.log(`Read ${legacyInvestors.size} legacy investors and ${legacyMeta.size} meta documents.`);

  const backup = path.join(root, "backups", now.replace(/[:.]/g, "-").slice(0, 19), "legacy");
  for (const [name, snapshot] of [["inversores", legacyInvestors], ["meta", legacyMeta]] as const) {
    fs.mkdirSync(path.join(backup, name), { recursive: true });
    for (const document of snapshot.docs) fs.writeFileSync(path.join(backup, name, `${document.id}.json`), JSON.stringify(document.data(), null, 2) + "\n", "utf8");
  }
  console.log(`Legacy documents backed up to ${backup}`);

  const translated: Investor[] = [];
  const errors: string[] = [];
  for (const document of legacyInvestors.docs) {
    try {
      translated.push(translate({ ...document.data(), id: document.id }, now));
    } catch (e) {
      errors.push(`${document.id}: ${describeError(e)}`);
    }
  }
  if (errors.length) {
    console.error("Translation failed; nothing written:");
    for (const error of errors) console.error(" -", error);
    process.exit(1);
  }

  let batch = writeBatch(db);
  for (const investor of translated) batch.set(doc(db, COLLECTION, investor.id), investor);
  await batch.commit();
  const written = await getDocs(collection(db, COLLECTION));
  if (written.size < translated.length) {
    console.error(`Expected ${translated.length} documents in ${COLLECTION}, found ${written.size}; legacy collections left untouched.`);
    process.exit(1);
  }
  console.log(`Wrote ${translated.length} documents to ${COLLECTION}.`);

  if (!process.argv.includes("--delete-legacy")) {
    console.log("Legacy collections inversores and meta left untouched (run with --delete-legacy to remove them).");
    process.exit(0);
  }
  batch = writeBatch(db);
  for (const document of legacyInvestors.docs) batch.delete(document.ref);
  for (const document of legacyMeta.docs) batch.delete(document.ref);
  await batch.commit();
  console.log("Deleted legacy collections inversores and meta.");
  process.exit(0);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
