/** Section "Los cuatro mails": what the four cold emails of a gold profile have to prove. */
import { BODY_MAX, SUBJECT_MAX } from "../../types/gold";
import type { Term } from "../types/term";

export const emailsBrief = (): string =>
  "Cuatro propuestas distintas de primer mail en frío, en español, cada una construida sobre una evidencia concreta distinta: un " +
  "artículo con la frase citada, una inversión nombrada, una charla o podcast, una tesis publicada. `basedOn` nombra esa evidencia. " +
  `Asunto de hasta ${SUBJECT_MAX} caracteres, cuerpo de hasta ${BODY_MAX}. Cada mail tiene que demostrar que leímos su trabajo: 'vi ` +
  "que en tal artículo dijiste tal frase, que resuena con lo que hacemos', 'vimos que invertiste en X e Y, por eso creemos que lo " +
  "nuestro puede interesarte'. Sin frases huecas. Para los `rejected`, `emails` va vacío." + 
  "El producto siempre dejalo como una ingonica con estas siglas [X]. Luego a ultimo momento voy a diseñar un texto para reemplazarlo";

export const emails: Term = {
  id: "emails",
  title: () => "Los cuatro mails",
  render: () => emailsBrief(),
};
