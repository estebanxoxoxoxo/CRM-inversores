/**
 * Builds the evaluation prompt for the next batch of investors and leaves it in the clipboard.
 *
 *   npm run gold:prompt                  build the prompt and copy it
 *   npm run gold:prompt -- --out p.md    also write it to that file
 *
 * The batch is the head of the remainder: every investor of `investors` that has no document in `gold` yet, in the
 * reader's order (level desc, name asc). Nothing is written to the database here; the agent that receives the
 * prompt is the one that pushes the evaluations through the endpoint.
 */
import { writeFileSync } from "node:fs";
import { terminate } from "firebase/firestore";
import { BATCH_SIZE } from "../types/gold";
import { buildGoldPrompt } from "../prompt-builder/index";
import { connect, explainError } from "../../../scripts/lib/firestore";
import { copy } from "../lib/clipboard";
import { evaluatedIds, readGold } from "../lib/gold";
import { readInvestors } from "../lib/investors";

/** Only flag: `--out <file>`. */
function outputFile(): string | null {
  const flag = process.argv.indexOf("--out");
  if (flag === -1) return null;
  const path = process.argv[flag + 1];
  if (!path) throw new Error("--out necesita la ruta de un archivo");
  return path;
}

(async () => {
  const out = outputFile();
  const db = connect();
  console.log("Leyendo inversores y evaluaciones…");
  const [investors, gold] = await Promise.all([readInvestors(db), readGold(db)]);
  const evaluated = evaluatedIds(gold);
  const remainder = investors.filter((investor) => !evaluated.has(investor.id));
  console.log(`Inversores: ${investors.length} · ya evaluados: ${gold.length} · remanente: ${remainder.length}`);

  if (!remainder.length) {
    console.log("No queda ningún inversor sin evaluar: no hay lote que armar.");
    await terminate(db);
    return;
  }

  const batch = remainder.slice(0, BATCH_SIZE);
  console.log(`Armando el prompt para ${batch.length} perfiles…`);
  const prompt = buildGoldPrompt(batch, gold);
  if (!prompt.hasEndpoint) console.warn("Aviso: VITE_APP_URL no está configurado; el prompt lleva un marcador en lugar de la URL del endpoint.");
  if (!prompt.hasToken) console.warn("Aviso: VITE_INGEST_TOKEN no está configurado; el prompt lleva un marcador en lugar del token.");

  const fallback = await copy(prompt.text);
  if (out) writeFileSync(out, prompt.text, "utf8");

  const size = (Buffer.byteLength(prompt.text) / 1024).toFixed(1);
  console.log(`Lote: ${prompt.batch} perfiles · quedan para después: ${remainder.length - batch.length} · ejemplos: ${prompt.examples} · excluidos: ${prompt.excluded} · ${size} KB`);
  console.log(fallback ? `No se pudo usar el portapapeles; el prompt quedó en ${fallback}` : "El prompt está en el portapapeles.");
  if (out) console.log(`También lo escribí en ${out}`);

  // Let the process end on its own: process.exit() while sockets close trips a libuv assertion on Windows.
  await terminate(db);
})().catch((e: unknown) => {
  console.error("ERROR:", explainError(e));
  process.exit(1);
});
