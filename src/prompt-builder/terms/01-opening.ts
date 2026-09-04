/** Term: title and opening paragraph. Unnumbered. Says who the model is, the objective and what the document holds. */
import type { Term } from "../types/term";
import { EXAMPLE_MIN_LEVEL } from "./10-examples";

export const TITLE = "Búsqueda de nuevos inversores deep tech / dev tools hispanohablantes";

export const ROLE = "Sos un analista de investigación de inversores.";

export const objective = (count: number): string =>
  `Tu objetivo es encontrar, investigar y enviar ${count} perfiles de inversores indiscutibles en su pureza y ${count} perfiles con muchísimo potencial, todos nuevos y que superen el criterio de pureza descrito abajo.`;

export const CONTENTS =
  "Este documento contiene, en este orden: el pedido, la metodología de descubrimiento e investigación, la rúbrica de auditoría, " +
  "el tipo exacto de cada perfil, el endpoint donde enviar los perfiles, la lista de perfiles que ya existen (no los repitas) " +
  `y perfiles de ejemplo con nivel superior a ${EXAMPLE_MIN_LEVEL}.`;

export const READ_EVERYTHING = "Leelo entero antes de empezar.";

export const LANGUAGE = "Todo el contenido que produzcas va en español; los nombres de empresas, fondos y citas textuales pueden ir en su idioma original.";

export const opening: Term = {
  id: "opening",
  render: (ctx) => `# ${TITLE}\n\n${[ROLE, objective(ctx.count), CONTENTS, READ_EVERYTHING, LANGUAGE].join(" ")}`,
};
