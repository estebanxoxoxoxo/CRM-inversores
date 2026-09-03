/** Section "Descubrimiento de candidatos": how to find new people. */
import { numbered, paragraphs, quotedList } from "../format";
import type { PromptContext, PromptSection } from "../types";

export const intro = (ctx: PromptContext): string => `Buscá personas que no estén en la lista de excluidos de la sección ${ctx.sectionNumber("exclusions")}.`;

export const FUNDS =
  "Recorré fondo por fondo los fondos especialistas en infraestructura y los de primer nivel, buscando socios hispanohablantes cuyo foco " +
  "personal sea infraestructura de IA, dev tools, infraestructura de datos, ciberseguridad, infraestructura enterprise, open source o deep " +
  "tech de frontera. Buscá también fondos nuevos de 2024-2026 enfocados en IA, agentes, infraestructura, cuántica, semiconductores, " +
  "ciberseguridad o developer tools; solo GPs; y angels técnicos: fundadores y CTOs que firman cheques en deep tech.";

/** Example search queries, in both languages. */
export const QUERIES = [
  "venture capital deep tech España partner",
  "fondo deep tech España 2025",
  "inversores developer tools España",
  "VC inteligencia artificial infraestructura España",
  "business angel deep tech España",
  "nuevo fondo IA España 2025 2026",
  "inversor ángel CTO España inteligencia artificial",
  "founders técnicos españoles que invierten como business angels",
  "Latino venture capital partners AI infrastructure",
  "Hispanic VC partner developer tools",
  "LatinxVC members deep tech",
  "Spanish-speaking VC Silicon Valley AI",
  "venture partner nacido en España Silicon Valley",
  "argentino partner venture capital Silicon Valley inteligencia artificial",
  "colombiano partner venture capital Estados Unidos deep tech",
  "chileno venture capital Estados Unidos AI",
  "mexicano partner fondo venture capital San Francisco",
  "new AI infrastructure fund 2025 founded by Latino",
  "Latino general partner launches fund AI 2025 2026",
  "fondo venture capital México deep tech",
  "inversionista ángel México inteligencia artificial infraestructura",
];

export const queries = (): string => `Buscá en español y en inglés, variando muchas consultas. Ejemplos: ${quotedList(QUERIES)}.`;

/** Where to look. */
export const SOURCES = [
  "Dealflow.es",
  "El Referente",
  "Expansión",
  "Cinco Días",
  "TechCrunch",
  "Sifted",
  "Startupxplore",
  "Crunchbase",
  "Signal NFX",
  "AngelList",
  "Contxto",
  "Whitepaper.mx",
  "Latitud",
  "Startupeable",
  "LinkedIn a través de buscadores",
  "X/Twitter",
  "podcasts (20VC, Invest Like the Best, Itnig, Dealflow.es, Latitud, Startupeable)",
  "newsletters y blogs propios de los inversores",
];

export const sources = (): string => `Fuentes de descubrimiento: ${SOURCES.join(", ")}.`;

export const NOTES =
  "Para cada candidato anotá origen o evidencia de español, foco, etapa y ticket, formación técnica, por qué encaja y confianza. " +
  'Sé honesto: si no podés confirmar la fluidez en español, decilo ("origen sólo, fluidez no confirmada"). No rellenes con generalistas ' +
  "de consumo o fintech. Llevá una lista de considerados y rechazados con el motivo, para no volver a investigarlos.";

export const discoverySection: PromptSection = {
  id: "discovery",
  title: () => "Descubrimiento de candidatos",
  render: (ctx) => paragraphs(intro(ctx), numbered([FUNDS, queries(), sources(), NOTES])),
};
