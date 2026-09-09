/** Section "El tipo exacto": the source of src/types/gold.ts verbatim (an input) plus the notes to fill one object. */
import { bullets, codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const INTRO =
  "Cada evaluación es un objeto que valida contra `EvaluationSchema` del siguiente archivo TypeScript (esquema zod). Es el mismo " +
  "archivo que corre en el servidor, así que lo que leés acá es exactamente lo que se valida. Las claves y los enums van en inglés " +
  "tal cual; el contenido de texto va en español.";

export const NOTES_INTRO = "Notas para armar cada objeto:";

export const NOTE_ID = "`investorId`: el `id` del perfil tal como viene en el lote, sin tocarlo. Es la clave del documento.";
export const NOTE_SERVER =
  "No inventes `region`, `name` ni `evaluatedAt`: los pone el servidor leyendo el perfil guardado y el reloj. Si los mandás, se sobreescriben.";
export const NOTE_HISPANIC =
  "`aspects.spanish` y `aspects.hispanicFounders` van en `null` cuando `region` es `spain`, `mexico` o `spanish_speaking`, y son obligatorios los dos cuando es `us_hispanic` o `out_of_region`.";
export const NOTE_SOURCES = "`sources` de cada aspecto son URL completas; cuando el aspecto pasa tiene que haber al menos una.";
export const NOTE_VERDICT = "`verdict` no es una opinión: es `gold` si y sólo si pasan todos los aspectos que aplican. El servidor lo recalcula y rechaza el documento si no coincide.";

export const NOTES = [NOTE_ID, NOTE_SERVER, NOTE_HISPANIC, NOTE_SOURCES, NOTE_VERDICT];

export const typeBlock = (ctx: PromptContext): string => codeBlock("ts", ctx.typeSource);

export const type: Term = {
  id: "type",
  title: () => "El tipo exacto",
  render: (ctx) => paragraphs(INTRO, typeBlock(ctx), `${NOTES_INTRO}\n\n${bullets(NOTES)}`),
};
