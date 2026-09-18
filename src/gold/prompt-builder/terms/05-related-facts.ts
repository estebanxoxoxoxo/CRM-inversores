/** Section "Los hechos relacionados": the dry facts every profile carries, the raw material of the emails the client writes himself. */
import { FACTS_MAX, FACTS_MIN, FACT_MAX } from "../../types/gold";
import { paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const investigate = (): string =>
  `Para cada perfil, investigá a fondo a la persona, a su fondo y/o su actividad como ángel, y reportá entre ${FACTS_MIN} y ${FACTS_MAX} hechos relacionados.`;

export const WHAT_IS_A_FACT =
  "Un hecho relacionado es cualquier cosa —una cita, una inversión, una declaración, una charla, un dato— que se pueda mencionar en un mail " +
  "en frío que el cliente va a escribir él mismo, y que enlace los intereses del inversor (deep tech, dev tools, IA agéntica, stacks para IA, " +
  "harnesses, coordinación de agentes, cloud para IA, deploy de IA) con el producto del cliente.";

export const dryRule = (): string =>
  `El hecho va en \`fact\`, seco, de como máximo ${FACT_MAX} caracteres, tal cual podría caer dentro del mail: con su fuente nombrada adentro ` +
  "cuando salga natural (el podcast, el artículo, la fecha), pero sin envoltura, sin justificaciones y sin una sola mención a la " +
  "investigación. Nunca rompas la cuarta pared. Cada palabra de más es un error.";

export const EXAMPLE_LABEL = "Un hecho perfecto:";

export const EXAMPLE =
  "En el podcast xx el 17/9 dijo que mejorar la coordinación de agentes es la única forma en que la IA puede ser productiva en los trabajos de oficina y en programación";

export const SOURCES = "`sources` lleva la o las URL donde se puede constatar el hecho: al menos una.";

export const relatedFacts: Term = {
  id: "relatedFacts",
  title: () => "Los hechos relacionados",
  render: () => paragraphs(investigate(), WHAT_IS_A_FACT, dryRule(), `${EXAMPLE_LABEL}\n\n> ${EXAMPLE}`, SOURCES),
};
