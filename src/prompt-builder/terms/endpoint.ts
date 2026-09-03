/** Term "Envío de perfiles: endpoint". URL and token are inputs; the batch limit comes from the type contract. */
import { INGEST_MAX_PER_REQUEST } from "../../types/investor";
import { bullets, codeBlock, paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const request = (ctx: PromptContext): string =>
  codeBlock("", `POST ${ctx.endpoint}\nAuthorization: Bearer ${ctx.token}\nContent-Type: application/json\n\n{ "investors": [ { ...perfil 1... }, { ...perfil 2... } ] }`);

export const batching = (): string =>
  `Hasta ${INGEST_MAX_PER_REQUEST} perfiles por petición; hacé varias peticiones para enviarlos todos. Agregá \`?dryRun=1\` a la URL para validar sin escribir; ` +
  "hacelo siempre primero y corregí lo que rechace.";

export const RESPONSE =
  'Respuesta: `{ "dryRun": boolean, "created": [ { "id", "name" } ], "rejected": [ { "id", "name", "reason" } ] }`. Un perfil se rechaza si no ' +
  "valida contra el tipo (el motivo dice qué campo falla) o si ya existe uno con el mismo id, nombre, LinkedIn o email. Los perfiles creados " +
  "quedan con auditoría pendiente hasta que un humano los revise; nunca se sobreescribe un perfil existente.";

export const EXAMPLE_LABEL = "Ejemplo:";

export const curl = (ctx: PromptContext): string =>
  codeBlock(
    "bash",
    `curl -X POST "${ctx.endpoint}?dryRun=1" \\\n  -H "Authorization: Bearer ${ctx.token}" \\\n  -H "Content-Type: application/json" \\\n  --data @perfiles.json`,
  );

export const FALLBACK = "Si no podés hacer peticiones HTTP, entregá el cuerpo JSON completo en un bloque de código, listo para enviarlo con el comando anterior.";

export const endpoint: Term = {
  id: "endpoint",
  title: () => "Envío de perfiles: endpoint",
  render: (ctx) => paragraphs(request(ctx), bullets([batching(), RESPONSE, EXAMPLE_LABEL]), curl(ctx), FALLBACK),
};
