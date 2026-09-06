/** Section "Los cuatro aspectos": the definition of each aspect and the rule that turns them into a verdict. */
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
  "`spanish` (habla español): evidencia válida: contenido propio en español con URL (entrevista, podcast, post, charla), o un hecho " +
  "biográfico documentado (nacido, criado o formado en un país hispanohablante). Nunca inferir por apellido.";

export const HISPANIC_FOUNDERS =
  "`hispanicFounders` (sólo para perfiles con `region` igual a `us_hispanic`; en los demás va en `null`): trabaja con founders de " +
  "habla hispana. Evidencia válida: inversiones nombradas en empresas con fundadores hispanohablantes, con URL; participación " +
  "documentada en comunidades o programas para founders latinos o españoles; o declaraciones textuales al respecto.";

export const ASPECTS = [STAGE, DEEP_TECH, SPANISH, HISPANIC_FOUNDERS];

export const RULE =
  "Los tres primeros son obligatorios para todos. El cuarto es obligatorio sólo cuando `region` es `us_hispanic`; el servidor lo " +
  "comprueba con la región guardada en la base, así que no hay forma de esquivarlo. El veredicto es `gold` únicamente si pasan todos " +
  "los aspectos que aplican; si uno falla, es `rejected`, y el documento se envía igual.";

export const aspects: Term = {
  id: "aspects",
  title: () => "Los cuatro aspectos",
  render: () => paragraphs(bullets(ASPECTS), RULE),
};
