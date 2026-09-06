/** Term: title and opening paragraph. Unnumbered. Says who the model is, the objective and what the document holds. */
import type { Term } from "../types/term";

export const TITLE = "Evaluación de inversores gold";

export const ROLE = "Sos un analista de investigación de inversores.";

export const objective = (count: number): string =>
  `Tu objetivo es evaluar los ${count} perfiles del lote contra cuatro aspectos y enviar un documento por perfil, con veredicto ` +
  "`gold` o `rejected`. Todo lo que escribas tiene que ser escueto y verificable: la URL exacta y la frase textual que prueban cada " +
  "aspecto. No se evalúa por impresión: se evalúa por evidencia.";

export const CONTENTS =
  "Este documento contiene, en este orden: el contexto del cliente, los cuatro aspectos, cómo justificar cada uno, los cuatro mails " +
  "de los perfiles gold, el tipo exacto del documento, el endpoint donde enviarlos, los perfiles a evaluar, los perfiles ya evaluados " +
  "(no los repitas) y ejemplos de documentos gold recientes.";

export const READ_EVERYTHING = "Leelo entero antes de empezar.";

export const LANGUAGE = "Todo el contenido que produzcas va en español; los nombres de personas, empresas y fondos y las citas textuales pueden ir en su idioma original.";

export const opening: Term = {
  id: "opening",
  render: (ctx) => `# ${TITLE}\n\n${[ROLE, objective(ctx.batch.length), CONTENTS, READ_EVERYTHING, LANGUAGE].join(" ")}`,
};
