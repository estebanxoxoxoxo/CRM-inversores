/** Section "Los cuatro aspectos": the definition of each aspect and the rule that turns the ones that apply into a verdict. */
import { bullets, paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const STAGE =
  "`stage` (etapa): invierte en pre-seed o seed, antes de que haya ingresos y usuarios. Evidencia válida: inversiones concretas en " +
  "rondas pre-seed o seed documentadas con URL (Crunchbase, nota de prensa, web del fondo), o una declaración textual del inversor o " +
  "del fondo sobre invertir antes de la tracción. No vale un 'early stage' genérico ni una Serie A.";

export const DEEP_TECH =
  "`deepTech` (IA profunda, deep tech o dev tools): invierte en infraestructura de IA, modelos, developer tools o deep tech de " +
  "software. Evidencia válida: al menos dos inversiones nombradas en empresas de ese tipo con la URL que las documenta, o una tesis " +
  "publicada por el propio inversor con la frase textual.";

export const SPANISH =
  "`spanish` (habla español; se evalúa sólo cuando el inversor está fuera de un país hispanohablante, y en los demás va en `null`): evidencia válida: " +
  "contenido propio en español con URL (entrevista, podcast, post, charla), o un hecho biográfico documentado (nacido, criado o " +
  "formado en un país hispanohablante). Nunca inferir por apellido.";

export const HISPANIC_FOUNDERS =
  "`hispanicFounders` (se evalúa en los mismos perfiles que el anterior, y en los demás va en `null`): trabaja con founders de " +
  "habla hispana. Evidencia válida: inversiones nombradas en empresas con fundadores hispanohablantes, con URL; participación " +
  "documentada en comunidades o programas para founders latinos o españoles; o declaraciones textuales al respecto.";

export const ASPECTS = [STAGE, DEEP_TECH, SPANISH, HISPANIC_FOUNDERS];

export const RULE =
  "Los dos primeros, `stage` y `deepTech`, son obligatorios para todos, sin excepción. Los dos últimos dependen del país en el que " +
  "está el inversor, y la regla es una sola: si está en un país de habla hispana no se preguntan y van en `null`, porque el idioma se " +
  "da por hecho; si está en cualquier otro país, se preguntan y son obligatorios. En el tipo eso se lee de `region`: van en `null` " +
  "cuando es `spain`, `mexico` o `spanish_speaking` (cualquier otro país hispanohablante: Argentina, Chile, Uruguay, Colombia…), y son " +
  "obligatorios cuando es `us_hispanic` o `out_of_region` (un país que no habla español: Reino Unido, Alemania, Canadá, Emiratos…). " +
  "Un español en Londres o un argentino en Berlín entran por `out_of_region` y tienen que cumplir los cuatro, igual que los de Estados " +
  "Unidos. El servidor comprueba la región contra la guardada en la base, así que no hay forma de esquivarlo. El veredicto es `gold` " +
  "únicamente si pasan todos los aspectos que aplican; si uno falla, es `rejected`, y el documento se envía igual.";

export const aspects: Term = {
  id: "aspects",
  title: () => "Los cuatro aspectos",
  render: () => paragraphs(bullets(ASPECTS), RULE),
};
