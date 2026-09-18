/** Section "Envío": URL and token are inputs; the batch limit comes from the type contract. */
import { FACTS_MAX, FACTS_MIN, MAX_PER_REQUEST } from "../../types/gold";
import { bullets, codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const request = (ctx: PromptContext): string =>
  codeBlock("", `POST ${ctx.endpoint}\nAuthorization: Bearer ${ctx.token}\nContent-Type: application/json\n\n{ "evaluations": [ { ...evaluación 1... }, { ...evaluación 2... } ] }`);

export const batching = (): string =>
  `Hasta ${MAX_PER_REQUEST} evaluaciones por petición; hacé varias peticiones si hace falta. Agregá \`?dryRun=1\` a la URL para validar ` +
  "sin escribir; hacelo siempre primero y corregí lo que salga como inválido.";

export const response = (): string =>
  'Respuesta: `{ "dryRun": boolean, "created": [ { "investorId" } ], "invalid": [ { "investorId", "reason" } ] }`. En `invalid` ' +
  "están las evaluaciones que el servidor no aceptó: el perfil no existe, ya estaba evaluado, el documento no valida contra el tipo o " +
  `faltan hechos (siempre entre ${FACTS_MIN} y ${FACTS_MAX} por perfil). El motivo dice qué falla; corregilo y reenviá esa evaluación.`;

export const typeReference = (ctx: PromptContext): string =>
  `Cada evaluación va con el tipo de la sección ${ctx.sectionNumber("type")}, y los perfiles a evaluar son los de la sección ${ctx.sectionNumber("batch")}.`;

export const EXAMPLE_LABEL = "Ejemplo:";

export const curl = (ctx: PromptContext): string =>
  codeBlock(
    "bash",
    `curl -X POST "${ctx.endpoint}?dryRun=1" \\\n  -H "Authorization: Bearer ${ctx.token}" \\\n  -H "Content-Type: application/json" \\\n  --data @evaluaciones.json`,
  );

export const COMPLETENESS = "Cada perfil del lote tiene que volver con su documento; el que falte reaparece en el próximo lote.";

export const FALLBACK = "Si no podés hacer peticiones HTTP, entregá el cuerpo JSON en un bloque de código.";

export const endpoint: Term = {
  id: "endpoint",
  title: () => "Envío",
  render: (ctx) => paragraphs(request(ctx), bullets([batching(), response(), typeReference(ctx), EXAMPLE_LABEL]), curl(ctx), COMPLETENESS, FALLBACK),
};
