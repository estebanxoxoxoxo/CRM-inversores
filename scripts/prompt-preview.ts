/**
 * Renders the research prompt from the live database, without the browser, so every section can be inspected.
 *
 * Usage: npm run prompt -- [count]   → writes the prompt to a file in the system temp folder and prints its path
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collection, getDocs, terminate } from "firebase/firestore";
import { assemblePrompt } from "../src/prompt-builder/assemble";
import { DEFAULT_COUNT, MISSING_TOKEN } from "../src/prompt-builder/config";
import { COLLECTION, deriveInvestor, type Investor } from "../src/types/investor";
import { connect, explainError } from "./lib/firestore";

const root = path.resolve(import.meta.dirname, "..");
const count = Number.parseInt(process.argv[2] ?? "", 10) || DEFAULT_COUNT;

const db = connect();
(async () => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const investors: Investor[] = snapshot.docs
    .map((document) => deriveInvestor({ ...document.data(), id: document.id }))
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));

  const base = process.env.VITE_APP_URL || "http://localhost:5173";
  const text = assemblePrompt({
    count,
    investors,
    endpoint: `${base.replace(/\/+$/, "")}/api/investors`,
    token: process.env.VITE_INGEST_TOKEN || MISSING_TOKEN,
    date: new Date().toISOString().slice(0, 10),
    typeSource: fs.readFileSync(path.join(root, "src", "types", "investor.ts"), "utf8"),
  });

  const target = path.join(os.tmpdir(), `investor-crm-prompt-${count}.md`);
  fs.writeFileSync(target, text, "utf8");
  console.log(`Prompt for ${count} + ${count} investors written to ${target} (${Math.round(text.length / 1024)} KB, ${investors.length} exclusions).`);
  await terminate(db);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
