/** Section "El pedido": the founder's request, one constant per idea, quoted in this order. */
import { paragraphs, quote } from "../format";
import type { PromptContext, Term } from "../types";

export const IMPORTANCE =
  "Quiero plantearte el trabajo de tu vida. Es lo más importante que te pedí hasta ahora; el nivel de importancia de esta tarea " +
  "para nuestro proyecto es absoluto. Tenemos un stack IA-nativo que funciona un 90% mejor que los stacks actuales operados con IA " +
  "(le faltan unos meses para lanzar una demo para inversores) y un harness de desarrollo con nube de agentes, con una propuesta " +
  "muy superadora, del que en un mes vamos a tener una versión para mostrar a inversores.";

export const PAST_EXPERIENCE = "Nos pasó en el pasado que los inversores buscaban usuarios o que les dejáramos todo servido. Necesitamos inversores deep tech y/o dev tools.";

export const REGIONS = "Quiero acceder a inversores en España, México y sobre todo en Estados Unidos de habla hispana.";

export const PURITY =
  "Quiero que la pureza sea absoluta: que de verdad busques que cada perfil sea hiperatractivo como inversor para algo profundo, " +
  "a largo plazo y en línea con inversiones en IA con fortísimo moat.";

export const quantity = (count: number): string => `Quiero ${count} perfiles que sean indiscutibles en su pureza y ${count} que tengan muchísimo potencial.`;

export const delivery = (ctx: PromptContext): string =>
  `Cada perfil se entrega con el tipo de la sección ${ctx.sectionNumber("type")} y se envía a la base por el endpoint de la sección ${ctx.sectionNumber("endpoint")}.`;

export const request: Term = {
  id: "request",
  title: () => "El pedido",
  render: (ctx) => paragraphs(quote([IMPORTANCE, PAST_EXPERIENCE, REGIONS, PURITY, quantity(ctx.count)]), delivery(ctx)),
};
