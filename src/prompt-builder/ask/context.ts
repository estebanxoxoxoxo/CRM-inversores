/** Section "Contexto del cliente y criterio de pureza". */
import { bullets, paragraphs } from "../format";
import type { PromptSection } from "../types";

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
  "empresa de infraestructura o IA. Si un fondo es relevante, la ficha es de la persona concreta más relevante para infraestructura de " +
  "IA y dev tools, no del fondo.";

export const REGIONS_INTRO = "Regiones, en orden de prioridad:";

export const REGIONS = [
  "Estados Unidos hispanohablante (prioridad máxima): partners, GPs, principals y angels en Estados Unidos de origen español, hispano o latinoamericano, o con fluidez en español verificable.",
  "España: inversores radicados en España, o españoles en el exterior que invierten activamente en España.",
  "México: inversores radicados en México o que invierten activamente en México.",
  "Fuera de región (excepcional): sólo para encajes excepcionales, por ejemplo un inversor hispanohablante en Londres con la tesis exacta, y diciéndolo explícitamente.",
];

export const objective = (count: number): string =>
  `Objetivo: ${count} perfiles indiscutibles y ${count} con muchísimo potencial, todos nuevos. Cada perfil enviado tiene que superar el ` +
  "criterio de pureza; si no llegás a esas cantidades con ese estándar, entregá menos y decilo. Es preferible entregar menos perfiles " +
  "indiscutibles que completar la cantidad con perfiles mediocres. Si dudás, no lo envíes o dejalo claro en riesgos.";

export const contextSection: PromptSection = {
  id: "context",
  title: () => "Contexto del cliente y criterio de pureza",
  render: (ctx) => paragraphs(CLIENT, PURITY, `${REGIONS_INTRO}\n\n${bullets(REGIONS)}`, objective(ctx.count)),
};
