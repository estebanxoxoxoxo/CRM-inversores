/** Section "Investigación profunda de cada persona seleccionada": one constant per instruction, rendered numbered. */
import { numbered } from "../format";
import type { Term } from "../types";

export const SEARCH =
  "Buscá en la web en inglés y español, con un mínimo de 8 a 12 búsquedas por persona: web del fondo, LinkedIn a través de buscadores, " +
  "Crunchbase, Signal NFX, AngelList, X/Twitter, podcasts, newsletters o blogs propios, entrevistas, YouTube, papers, GitHub.";

export const CONFIRM =
  "Confirmá cargo actual (2026), fondo y tamaño del fondo vigente, etapa y ticket, inversiones concretas en deep tech, infraestructura de IA, " +
  "dev tools, open source, ciberseguridad o datos, formación técnica, y origen y fluidez en español citando evidencia: nacimiento, estudios, " +
  "entrevistas o contenido en español.";

export const ORIGIN =
  "Origen y español: sólo con autoidentificación pública o hechos biográficos documentados. Nunca inferir por apellido. Si no hay evidencia, " +
  "el perfil lo dice explícitamente y no puede ser indiscutible.";

export const EMAIL =
  "Email sólo de fuentes públicas: web del fondo, web personal, bio de ponente, prensa, GitHub, paper. Nunca inventar. Estados posibles: " +
  "`public_verified` (aparece en una fuente pública y se verificó), `public_sourced` (aparece en una fuente pública; citar cuál), " +
  "`firm_general_mailbox` (buzón general del fondo, público), `inferred_pattern` (patrón deducido del dominio a partir de emails públicos " +
  "de otros socios; decir de dónde sale), `not_found`. La procedencia de cada vía va en `contactSources`, con notas cortas o URLs por " +
  "canal: email, linkedin, other.";

export const PERSONAL_WEBSITE = "`personalWebsite` es el sitio, blog o newsletter que controla la propia persona; nunca la web del fondo. Vacío si no existe.";

export const HONESTY =
  'Sé honesto: si el encaje es parcial, decilo en `risksOrAlerts` y bajá la puntuación. Si un dato no se confirma, escribí "no confirmado". ' +
  "No rellenes con generalidades.";

export const DEEP_RESEARCH =
  "`deepResearch` tiene que ser realmente largo y concreto, de 600 a 1500 palabras: historia completa y cronológica, inversiones relevantes " +
  "con años y montos, board seats, declaraciones públicas sobre IA, agentes, infraestructura o dev tools, podcasts y entrevistas con URL, " +
  "newsletters o ensayos que escriba, patrones de inversión observados, coinversores habituales, relación con el ecosistema hispanohablante, " +
  "fondos levantados con tamaño y fecha, reconocimientos, controversias si las hay, y cualquier detalle que sirva para personalizar un primer " +
  "contacto. Es el campo más valioso.";

export const BACKGROUND = "`background`, de 100 a 250 palabras: formación, carrera, empresas fundadas u operadas, exits, fondos, cargos actuales y anteriores.";

export const SUMMARIES =
  "`whyInteresting`, `investmentThesis` y `stageAndTicket` son listas de puntos breves: todo valor, nada de verbosidad. `whyInteresting` es " +
  "específico para una startup de stack IA-nativo y harness de desarrollo con nube de agentes: por qué encaja, qué evidencia hay de que " +
  "invierte pre-tracción en apuestas técnicas, qué ángulo usar al contactarlo. `investmentThesis`: en qué invierte, en qué etapa, qué busca " +
  "en un equipo, qué opina de deep tech, infraestructura de IA, dev tools y moats, citando frases o posts propios si existen. " +
  "`stageAndTicket`: etapas y ticket típico con fuente; si no hay dato, decirlo.";

export const LISTS =
  '`relevantInvestments`: "Empresa (año, ronda, qué hace) — por qué es relevante". `fitSignals`: señales concretas de que invierte ' +
  'pre-tracción en deep tech, infraestructura de IA o dev tools con horizonte largo. `risksOrAlerts`: por ejemplo "sólo lidera Serie A+", ' +
  '"ticket mínimo alto", "poco activo desde 2024", "fluidez en español no confirmada", "invierte sólo en LatAm". `howToReach`: eventos ' +
  "donde habla, programas del fondo, newsletters, socios o founders de portfolio que pueden hacer intro, formulario del fondo, comunidades " +
  "(Latinx VC, Spain Tech Week, South Summit, etc.).";

export const SOURCES_AND_CONFIDENCE =
  "`sources`: mínimo 6 URLs consultadas. `confidence` califica la calidad y cantidad de las fuentes (`high`, `medium`, `low`), no el encaje.";

export const ABSOLUTE_TERMS =
  'Cada ficha se redacta en términos absolutos: nunca comparar con otros perfiles ("el mejor de la lista", "mejor que X"), porque la base ' +
  "crece y esas frases envejecen mal.";

export const STEPS = [SEARCH, CONFIRM, ORIGIN, EMAIL, PERSONAL_WEBSITE, HONESTY, DEEP_RESEARCH, BACKGROUND, SUMMARIES, LISTS, SOURCES_AND_CONFIDENCE, ABSOLUTE_TERMS];

export const research: Term = {
  id: "research",
  title: () => "Investigación profunda de cada persona seleccionada",
  render: () => numbered(STEPS),
};
