/** Term "Formato de salida: el tipo exacto": the type source verbatim (an input) plus the notes to fill an object. */
import { bullets, codeBlock, paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const INTRO =
  "Cada perfil es un objeto que valida contra `InvestorSchema` del siguiente archivo TypeScript (esquema zod). Los valores de los enums van " +
  "con los códigos en inglés tal cual aparecen; el contenido de texto va en español.";

export const NOTES_INTRO = "Notas para armar cada objeto:";

export const NOTE_ID = "`id`: slug del nombre en minúsculas, sin acentos, con guiones (por ejemplo `mar-hershenson`).";
export const NOTE_DERIVED = "No envíes `level`, `band`, `priority`, `score.raw`, `score.caps`, `score.total` ni `updatedAt`: los calcula el servidor. Si los enviás, se ignoran.";
export const NOTE_RATING = "No envíes `rating`: es la calificación manual del equipo y el servidor la deja en `null`.";
export const NOTE_AUDIT =
  '`audit`: `{ "status": "pending", "date": "AAAA-MM-DD", "reason": "...", "score": { "thesis": n, "stage": n, "decision": n, "spanish": n, "access": n } }`.';
export const NOTE_TEXT = "Las listas son arrays de strings. `background` y `deepResearch` son texto con párrafos separados por líneas en blanco.";
export const NOTE_URLS = "`linkedin` y `personalWebsite`: URL completa o cadena vacía. `email`: dirección o cadena vacía, coherente con `emailStatus`.";

export const NOTES = [NOTE_ID, NOTE_DERIVED, NOTE_RATING, NOTE_AUDIT, NOTE_TEXT, NOTE_URLS];

export const type: Term = {
  id: "type",
  title: () => "Formato de salida: el tipo exacto",
  render: (ctx) => paragraphs(INTRO, codeBlock("ts", ctx.typeSource), `${NOTES_INTRO}\n\n${bullets(NOTES)}`),
};
