/** Section "Contexto del cliente": why we look for these investors and on whose behalf the emails speak. */
import { paragraphs } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const CLIENT =
  "Startup hispanohablante que construye (a) un stack de software IA-nativo, con demo para inversores en unos meses, y (b) un harness " +
  "de desarrollo con nube de agentes, con versión para inversores en un mes. Busca inversores deep tech y/o dev tools que apuesten por " +
  "tecnología profunda, horizonte largo y moat fuerte antes de que haya tracción. Tuvo malas experiencias con inversores que piden " +
  "usuarios o todo servido.";

export const WHY =
  "Por eso los aspectos son los que son: miden si esta persona invierte antes de la tracción y en esta clase de tecnología. En " +
  "Estados Unidos se suman el idioma y el trabajo con founders hispanohablantes; en España o México no hace falta preguntarlos.";

export const emailsVoice = (ctx: PromptContext): string =>
  `Los mails de la sección ${ctx.sectionNumber("emails")} se escriben en nombre de esta startup: cada uno tiene que conectar una evidencia ` +
  "concreta del inversor con lo que construimos. Tenelo presente al leer su trabajo, porque de ahí sale el material de los mails.";

export const client: Term = {
  id: "client",
  title: () => "Contexto del cliente",
  render: (ctx) => paragraphs(CLIENT, WHY, emailsVoice(ctx)),
};
