/** Section "Cómo justificar cada aspecto": the shape of a `reason`, straight from the limits of the type. */
import { REASON_MAX } from "../../types/gold";
import { paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const howToJustify = (): string =>
  `Un solo párrafo, escueto, de como máximo ${REASON_MAX} caracteres, con la URL exacta y la frase textual o el dato puntual (por ` +
  "ejemplo: 'invirtió en X e Y, ambas infraestructura de IA, según <URL>'). Nada de generalidades ni de adjetivos. Tiene que permitir " +
  "constatar en un minuto que el aspecto se cumple. Si no encontrás evidencia, el aspecto no pasa: escribí qué buscaste y no apareció. " +
  "`sources` lleva las URL usadas; cuando el aspecto pasa, al menos una.";

export const RESEARCH = "Investigá en la web más allá del extracto: el extracto es una pista, no una prueba.";

export const justifications: Term = {
  id: "justifications",
  title: () => "Cómo justificar cada aspecto",
  render: () => paragraphs(howToJustify(), RESEARCH),
};
