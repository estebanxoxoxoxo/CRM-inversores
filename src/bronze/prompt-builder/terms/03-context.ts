/** Section "Contexto del cliente y criterio de pureza". */
import { bullets, paragraphs } from "../format/markdown";
import type { Term } from "../types/term";

export const CLIENT =
  "Startup hispanohablante que construye (a) un stack de software IA-nativo, con demo para inversores en unos meses, y (b) un harness " +
  "de desarrollo con nube de agentes, con versión para inversores en un mes. Busca inversores deep tech y/o dev tools que apuesten por " +
  "tecnología profunda, horizonte largo y moat fuerte antes de que haya tracción. Tuvo malas experiencias con inversores que piden " +
  "usuarios o todo servido. La lista es para outreach real: la precisión importa más que el volumen.";

export const PURITY =
  "Pureza: nada de inversores que piden usuarios o ingresos primero, nada de consumo, fintech puro, marketplaces, biotech ni growth. " +
  "Una persona entra sólo si hay evidencia real de que (1) invierte en deep tech, infraestructura de IA, dev tools, infraestructura de " +
  "datos, ciberseguridad, infraestructura enterprise u open source; (2) invierte temprano (pre-seed, seed, como mucho Serie A) o como " +
  "business angel; y (3) idealmente tiene formación técnica (ingeniería, ciencias de la computación, doctorado) o fundó u operó una " +
  "empresa de infraestructura o IA. Si un fondo es relevante, la ficha es siempre de una persona concreta y nunca del fondo; y cuando el " +
  "fondo encaja de verdad, no es de una sola persona: identificá de una a tres personas de ese fondo, las de mejor calidad para " +
  "infraestructura de IA y dev tools, y hacé una ficha de cada una.";

export const REGIONS_INTRO =
  "Regiones, en orden de prioridad. `region` se decide por el país donde vive la persona, no por su origen ni por dónde tiene oficinas " +
  "el fondo: un español en Londres es `out_of_region`, y un argentino en Buenos Aires es `spanish_speaking`. De ese código depende " +
  "después qué se le exige al perfil, así que ponerlo mal cuesta caro:";

export const REGIONS = [
  "Estados Unidos hispanohablante (prioridad máxima; `region` = `us_hispanic`): partners, GPs, principals y angels en Estados Unidos de origen español, hispano o latinoamericano, o con fluidez en español verificable.",
  "Argentina y el resto de América Latina (`region` = `spanish_speaking`): partners, GPs, principals y angels radicados en Argentina, Chile, Uruguay, Colombia, Perú o cualquier otro país de habla hispana. Un argentino radicado fuera de un país hispanohablante no va acá: va en `out_of_region`.",
  "España (`region` = `spain`): partners, GPs, principals y angels radicados en España. Un español radicado fuera va en la región del país donde vive, no en `spain`.",
  "México (`region` = `mexico`): partners, GPs, principals y angels radicados en México.",
  "Mundo árabe (`region` = `out_of_region`, porque no es un país hispanohablante): partners, GPs, principals y angels hispanohablantes con fondos del Golfo.",
  "Entidades cristianas protestantes conservadoras de Estados Unidos (veta dentro del ámbito hispanohablante, no un ámbito aparte): partners, GPs, principals y angels ligados a entidades cristianas conservadoras de Texas, Florida, Nuevo México, Nevada, Utah, Colorado, Luisiana, Alabama, Georgia, Carolina del Sur, Carolina del Norte y Arkansas que además hablen español e inviertan en fundadores hispanohablantes. Se les exige lo mismo que al resto del ámbito estadounidense: sin español verificable y sin evidencia de que trabajen con fundadores hispanohablantes, no entran. La afiliación religiosa sólo se registra si la entidad la declara o la persona lo dijo en público.",
  "Fuera de región (`region` = `out_of_region`, cualquier país que no habla español y no es Estados unidos a secas o Entidades cristianas en Estados unidos: Reino Unido, Alemania, Canadá, Emiratos, etc.): sólo para encajes excepcionales, por ejemplo un español en Londres con la tesis exacta, y diciéndolo explícitamente.",
];

export const objective = (count: number): string =>
  `Objetivo: hasta ${count} perfiles nuevos, buscando siempre el máximo de pureza posible. No hay cupos por banda. La banda es el ` +
  "resultado de la rúbrica, no un objetivo de búsqueda: nunca busques a propósito perfiles menos puros para llenar una segunda " +
  "categoría. Cada perfil enviado tiene que superar el criterio de pureza; los que lo superan pero no llegan a indiscutible se envían " +
  "igual, porque salieron de buscar lo mejor y no de conformarse. Si con ese estándar no llegás al número, entregá menos y decilo: es " +
  "preferible entregar menos perfiles excelentes que completar la cantidad con perfiles mediocres. Si dudás, no lo envíes o dejalo " +
  "claro en riesgos.";

export const context: Term = {
  id: "context",
  title: () => "Contexto del cliente y criterio de pureza",
  render: (ctx) => paragraphs(CLIENT, PURITY, `${REGIONS_INTRO}\n\n${bullets(REGIONS)}`, objective(ctx.count)),
};
