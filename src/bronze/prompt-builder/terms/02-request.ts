/** Section "El pedido": the founder's request, one constant per idea, quoted in this order. */
import { paragraphs, quote } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const IMPORTANCE =
  "Quiero plantearte el trabajo de tu vida. Es lo más importante que te pedí hasta ahora; el nivel de importancia de esta tarea " +
  "para nuestro proyecto es absoluto. Tenemos un stack IA-nativo que funciona un 90% mejor que los stacks actuales operados con IA " +
  "(le faltan unos meses para lanzar una demo para inversores) y un harness de desarrollo con nube de agentes, con una propuesta " +
  "muy superadora, del que en un mes vamos a tener una versión para mostrar a inversores." +
  "No tenes que hacer absolutamente nada en el repo. Tenes que dedicar muchisisimo tiempo y" +
 "esfuerzo para lograr esta tarea empujando al endpoint la cantidad de perfiles pedido, que se ajusten totalmente a lo buscado y" +  
 "siempre respetando el tipo requerido"

export const PAST_EXPERIENCE = "Nos pasó en el pasado que los inversores buscaban usuarios o que les dejáramos todo servido. Necesitamos inversores deep tech y/o dev tools.";

export const REGIONS =
  "Quiero acceder a inversores en Argentina, España, México, mundo árabe de habla hispana y sobre todo en Estados Unidos de habla hispana. " +
  "Rastreá también las entidades cristianas (protestantes de diversas ramas) conservadoras de Texas, Florida, Nuevo México, Nevada, Utah, Colorado, Luisiana, Alabama, " +
  "Georgia, las dos Carolinas y Arkansas, buscando a los que ahí hablen español e inviertan en fundadores hispanohablantes: es capital que " 

export const PURITY =
  "Quiero que la pureza sea absoluta: que de verdad busques que cada perfil sea hiperatractivo como inversor para algo profundo, " +
  "a largo plazo y en línea con inversiones en IA con fortísimo moat.";

export const quantity = (count: number): string =>
  `Quiero hasta ${count} perfiles nuevos y quiero que todos vayan a buscar ser indiscutibles. No reserves un cupo para perfiles de menor pureza: ` +
  "buscá siempre lo mejor que exista, y si alguno de los que investigaste no llega a indiscutible pero igual es muy bueno, mandámelo también. " +
  "Prefiero pocos impecables antes que muchos mezclados.";

export const delivery = (ctx: PromptContext): string =>
  `Cada perfil se entrega con el tipo de la sección ${ctx.sectionNumber("type")} y se envía a la base por el endpoint de la sección ${ctx.sectionNumber("endpoint")}.`;

export const request: Term = {
  id: "request",
  title: () => "El pedido",
  render: (ctx) => paragraphs(quote([IMPORTANCE, PAST_EXPERIENCE, REGIONS, PURITY, quantity(ctx.count)]), delivery(ctx)),
};
