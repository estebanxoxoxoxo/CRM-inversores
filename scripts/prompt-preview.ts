/**
 * Renders the research prompt from the committed snapshot, without the browser, so every section can be inspected.
 *
 * Usage: npm run prompt -- [count]   → writes the prompt to a file in the system temp folder and prints its path
 */
import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assemblePrompt } from "../src/prompt-builder/assemble";
import { DEFAULT_COUNT, MISSING_TOKEN } from "../src/prompt-builder/config";
import { deriveInvestor, type Investor } from "../src/types/investor";

const root = path.resolve(import.meta.dirname, "..");
const snapshotDir = path.join(root, "snapshot", "investors");
const count = Number.parseInt(process.argv[2] ?? "", 10) || DEFAULT_COUNT;

const investors: Investor[] = fs
  .readdirSync(snapshotDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => deriveInvestor({ ...JSON.parse(fs.readFileSync(path.join(snapshotDir, file), "utf8")), id: file.replace(/\.json$/, "") }))
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
