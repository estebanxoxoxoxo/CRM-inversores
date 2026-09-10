/** Section "Descubrimiento de candidatos": how to find new people. */
import { numbered, paragraphs, quotedList } from "../format/markdown";
import type { PromptContext } from "../types/prompt";
import type { Term } from "../types/term";

export const intro = (ctx: PromptContext): string => `Buscá personas que no estén en la lista de excluidos de la sección ${ctx.sectionNumber("exclusions")}.`;

export const FUNDS =
  "Recorré fondo por fondo los fondos especialistas en infraestructura y los de primer nivel, buscando socios hispanohablantes cuyo foco " +
  "personal sea infraestructura de IA, dev tools, infraestructura de datos, ciberseguridad, infraestructura enterprise, open source o deep " +
  "tech de frontera. Buscá también fondos nuevos de 2024-2026 enfocados en IA, agentes, infraestructura, cuántica, semiconductores, " +
  "ciberseguridad o developer tools; solo GPs; y angels técnicos: fundadores y CTOs que firman cheques en deep tech.";

export const INSTITUTIONS =
  "Cualificá primero la institución y después a las personas. Cuando un fondo, vehículo o sindicato encaja de verdad con el cliente " +
  "(tesis en la capa, etapa temprana, operaciones reales documentadas), no te quedes con el primer nombre que aparece: abrí la página " +
  "de equipo y mapeá a todo el que invierta, incluidos principals, directores de inversión y socios de riesgo. De ahí elegí de una a " +
  "tres personas, las de mejor calidad para este cliente, y hacé una ficha de cada una. La calidad se mide por lo que la persona tiene " +
  "documentado a su nombre: operaciones concretas en la capa, tesis propia escrita o hablada, evidencia de español y accesibilidad; el " +
  "cargo pesa en la puntuación pero no decide a quién investigar. Una institución que encaja no se descarta nunca porque la primera " +
  "persona que miraste no fuera la correcta: es el error más caro y más silencioso, porque se pierde el fondo entero por haber elegido " +
  "mal a quién mirar.";

/** Example search queries, in both languages. */
export const QUERIES = [

  "Venture capital deep tech Estados unidos general partner",
  "Venture capital deep tech United states general partner",
  "Venture capital deep tech San francisco general partner",  
  "Latino venture capital deep tech Estados unidos general partner",
  "Latino venture capital deep tech United states general partner",
  "Latino venture capital deep tech San francisco general partner",
  "Venture capital deep tech España general partner",
  "Venture capital deep tech México general partner",
  "Venture capital deep tech Argentina general partner",
  "Venture capital deep tech árabe general partner",
  "Venture capital deep tech arab general partner",
  "Conservative Christian venture capital deep tech United states general partner",
  "Conservative Christian venture capital deep tech Texas general partner",
  "Conservative Christian venture capital deep tech Florida general partner",
  "Conservative Christian venture capital deep tech New Mexico general partner",
  "Conservative Christian venture capital deep tech Nevada general partner",
  "Conservative Christian venture capital deep tech Utah general partner",


 "Venture capital deep tech Estados unidos partner",
"Venture capital deep tech United states partner",
  "Venture capital deep tech San francisco partner",  
  "Latino venture capital deep tech Estados unidos partner",
  "Latino venture capital deep tech United states partner",
  "Latino venture capital deep tech San francisco partner",
  "Venture capital deep tech España partner",
  "Venture capital deep tech México partner",
  "Venture capital deep tech Argentina partner",
  "Venture capital deep tech árabe partner",
  "Venture capital deep tech arab partner",
  "Conservative Christian venture capital deep tech United states partner",
  "Conservative Christian venture capital deep tech Texas partner",
  "Conservative Christian venture capital deep tech Florida partner",
  "Conservative Christian venture capital deep tech New Mexico partner",
  "Conservative Christian venture capital deep tech Nevada partner",
  "Conservative Christian venture capital deep tech Utah partner",

  "Venture capital deep tech Estados unidos principal",
  "Venture capital deep tech United states principal",
  "Venture capital deep tech San francisco principal",  
  "Latino venture capital deep tech Estados unidos principal",
  "Latino venture capital deep tech United states principal",
  "Latino venture capital deep tech San francisco principal",
  "Venture capital deep tech España principal",
  "Venture capital deep tech México principal",
  "Venture capital deep tech Argentina principal",
  "Venture capital deep tech árabe principal",
  "Venture capital deep tech arab principal",
  "Conservative Christian venture capital deep tech United states principal",
  "Conservative Christian venture capital deep tech Texas principal",
  "Conservative Christian venture capital deep tech Florida principal",
  "Conservative Christian venture capital deep tech New Mexico principal",
  "Conservative Christian venture capital deep tech Nevada principal",
  "Conservative Christian venture capital deep tech Utah principal",

  "Fondo capital deep tech Estados unidos",
  "Fund capital deep tech United states",
  "Fondo capital deep tech San francisco",
  "Fund capital deep tech San Francisco",
  "Latino fondo capital deep tech Estados unidos",
  "Latino fund capital deep tech United states",
  "Latino fondo capital deep tech San francisco",
  "Latino fund capital deep tech San Francisco",
  "Fondo deep tech España",
  "Fondo capital deep tech México",
  "Fondo capital deep tech Argentina",
  "Fondo capital deep tech árabe",
  "Fund capital deep tech arab",
  "Conservative Christian Fund capital deep tech United states",
  "Conservative Christian Fund capital deep tech Texas",
  "Conservative Christian Fund capital deep tech Florida",
  "Conservative Christian Fund capital deep tech New Mexico",
  "Conservative Christian Fund capital deep tech Nevada",
  "Conservative Christian Fund capital deep tech Utah",

  "Inversor angel deep tech España",
  "Inversor angel deep tech Estados unidos",
  "Inversor angel deep tech San francisco",
  "Latino inversor angel deep tech Estados unidos",
  "Latino inversor angel deep tech San francisco",
  "Inversor angel deep tech México",
  "Inversor angel deep tech Argentina",
  "Inversor angel deep tech árabe",
  "Conservador cristiano inversor angel deep tech United states",
  "Conservador cristiano inversor angel deep tech Texas",
  "Conservador cristiano inversor angel deep tech Florida",
  "Conservador cristiano inversor angel deep tech New Mexico",
  "Conservador cristiano inversor angel deep tech Nevada",
  "Conservador cristiano inversor angel deep tech Utah",

  "Angel investor deep tech España",
  "Angel investor deep tech Estados unidos",
  "Angel investor deep tech San francisco",
  "Latino angel investor deep tech Estados unidos",
  "Latino angel investor deep tech San francisco",
  "Angel investor deep tech México",
  "Angel investor deep tech Argentina",
  "Angel investor deep tech arab",
  "Conservative Christian angel investor deep tech United states",
  "Conservative Christian angel investor deep tech Texas",
  "Conservative Christian angel investor deep tech Florida",
  "Conservative Christian angel investor deep tech New Mexico",
  "Conservative Christian angel investor deep tech Nevada",
  "Conservative Christian angel investor deep tech Utah",





  "Venture capital dev tools Estados unidos general partner",
  "Venture capital dev tools United states general partner",
  "Venture capital dev tools San francisco general partner",  
  "Latino venture capital dev tools Estados unidos general partner",
  "Latino venture capital dev tools United states general partner",
  "Latino venture capital dev tools San francisco general partner",
  "Venture capital dev tools España general partner",
  "Venture capital dev tools México general partner",
  "Venture capital dev tools Argentina general partner",
  "Venture capital dev tools árabe general partner",
  "Venture capital dev tools arab general partner",
  "Conservative Christian venture capital dev tools United states general partner",
  "Conservative Christian venture capital dev tools Texas general partner",
  "Conservative Christian venture capital dev tools Florida general partner",
  "Conservative Christian venture capital dev tools New Mexico general partner",
  "Conservative Christian venture capital dev tools Nevada general partner",
  "Conservative Christian venture capital dev tools Utah general partner",


 "Venture capital dev tools Estados unidos partner",
  "Venture capital dev tools United states partner",
  "Venture capital dev tools San francisco partner",  
  "Latino venture capital dev tools Estados unidos partner",
  "Latino venture capital dev tools United states partner",
  "Latino venture capital dev tools San francisco partner",
  "Venture capital dev tools España partner",
  "Venture capital dev tools México partner",
  "Venture capital dev tools Argentina partner",
  "Venture capital dev tools árabe partner",
  "Venture capital dev tools arab partner",
  "Conservative Christian venture capital dev tools United states partner",
  "Conservative Christian venture capital dev tools Texas partner",
  "Conservative Christian venture capital dev tools Florida partner",
  "Conservative Christian venture capital dev tools New Mexico partner",
  "Conservative Christian venture capital dev tools Nevada partner",
  "Conservative Christian venture capital dev tools Utah partner",

  "Venture capital dev tools Estados unidos principal",
  "Venture capital dev tools United states principal",
  "Venture capital dev tools San francisco principal",  
  "Latino venture capital dev tools Estados unidos principal",
  "Latino venture capital dev tools United states principal",
  "Latino venture capital dev tools San francisco principal",
  "Venture capital dev tools España principal",
  "Venture capital dev tools México principal",
  "Venture capital dev tools Argentina principal",
  "Venture capital dev tools árabe principal",
  "Venture capital dev tools arab principal",
  "Conservative Christian venture capital dev tools United states principal",
  "Conservative Christian venture capital dev tools Texas principal",
  "Conservative Christian venture capital dev tools Florida principal",
  "Conservative Christian venture capital dev tools New Mexico principal",
  "Conservative Christian venture capital dev tools Nevada principal",
  "Conservative Christian venture capital dev tools Utah principal",

  "Fondo capital dev tools Estados unidos",
  "Fund capital dev tools United states",
  "Fondo capital dev tools San francisco",
  "Fund capital dev tools San Francisco",
  "Latino fondo capital dev tools Estados unidos",
  "Latino fund capital dev tools United states",
  "Latino fondo capital dev tools San francisco",
  "Latino fund capital dev tools San Francisco",
  "Fondo dev tools España",
  "Fondo capital dev tools México",
  "Fondo capital dev tools Argentina",
  "Fondo capital dev tools árabe",
  "Fund capital dev tools arab",
  "Conservative Christian Fund capital dev tools United states",
  "Conservative Christian Fund capital dev tools Texas",
  "Conservative Christian Fund capital dev tools Florida",
  "Conservative Christian Fund capital dev tools New Mexico",
  "Conservative Christian Fund capital dev tools Nevada",
  "Conservative Christian Fund capital dev tools Utah",

  "Inversor angel dev tools España",
  "Inversor angel dev tools Estados unidos",
  "Inversor angel dev tools San francisco",
  "Latino inversor angel dev tools Estados unidos",
  "Latino inversor angel dev tools San francisco",
  "Inversor angel dev tools México",
  "Inversor angel dev tools Argentina",
  "Inversor angel dev tools árabe",
  "Conservador cristiano inversor angel dev tools United states",
  "Conservador cristiano inversor angel dev tools Texas",
  "Conservador cristiano inversor angel dev tools Florida",
  "Conservador cristiano inversor angel dev tools New Mexico",
  "Conservador cristiano inversor angel dev tools Nevada",
  "Conservador cristiano inversor angel dev tools Utah",

  "Angel investor dev tools España",
  "Angel investor dev tools Estados unidos",
  "Angel investor dev tools San francisco",
  "Latino angel investor dev tools Estados unidos",
  "Latino angel investor dev tools San francisco",
  "Angel investor dev tools México",
  "Angel investor dev tools Argentina",
  "Angel investor dev tools árabe",
  "Conservative Christian angel investor dev tools United states",
  "Conservative Christian angel investor dev tools Texas",
  "Conservative Christian angel investor dev tools Florida",
  "Conservative Christian angel investor dev tools New Mexico",
  "Conservative Christian angel investor dev tools Nevada",
  "Conservative Christian angel investor dev tools Utah",












  "Venture capital developer tools Estados unidos general partner",
  "Venture capital developer tools tools United states general partner",
  "Venture capital developer tools San francisco general partner",  
  "Latino venture capital developer tools Estados unidos general partner",
  "Latino venture capital developer tools United states general partner",
  "Latino venture capital developer tools San francisco general partner",
  "Venture capital developer tools España general partner",
  "Venture capital developer tools México general partner",
  "Venture capital developer tools Argentina general partner",
  "Venture capital developer tools árabe general partner",
  "Venture capital developer tools arab general partner",
  "Conservative Christian venture capital developer tools United states general partner",
  "Conservative Christian venture capital developer tools Texas general partner",
  "Conservative Christian venture capital developer tools Florida general partner",
  "Conservative Christian venture capital developer tools New Mexico general partner",
  "Conservative Christian venture capital developer tools Nevada general partner",
  "Conservative Christian venture capital developer tools Utah general partner",


 "Venture capital developer tools Estados unidos partner",
  "Venture capital developer tools United states partner",
  "Venture capital developer tools San francisco partner",  
  "Latino venture capital developer tools Estados unidos partner",
  "Latino venture capital developer tools United states partner",
  "Latino venture capital developer tools San francisco partner",
  "Venture capital developer tools España partner",
  "Venture capital developer tools México partner",
  "Venture capital developer tools Argentina partner",
  "Venture capital developer tools árabe partner",
  "Venture capital developer tools arab partner",
  "Conservative Christian venture capital developer tools United states partner",
  "Conservative Christian venture capital developer tools Texas partner",
  "Conservative Christian venture capital developer tools Florida partner",
  "Conservative Christian venture capital developer tools New Mexico partner",
  "Conservative Christian venture capital developer tools Nevada partner",
  "Conservative Christian venture capital developer tools Utah partner",

  "Venture capital developer tools Estados unidos principal",
  "Venture capital developer tools United states principal",
  "Venture capital developer tools San francisco principal",  
  "Latino venture capital developer tools Estados unidos principal",
  "Latino venture capital developer tools United states principal",
  "Latino venture capital developer tools San francisco principal",
  "Venture capital developer tools España principal",
  "Venture capital developer tools México principal",
  "Venture capital developer tools Argentina principal",
  "Venture capital developer tools árabe principal",
  "Venture capital developer tools arab principal",
  "Conservative Christian venture capital developer tools United states principal",
  "Conservative Christian venture capital developer tools Texas principal",
  "Conservative Christian venture capital developer tools Florida principal",
  "Conservative Christian venture capital developer tools New Mexico principal",
  "Conservative Christian venture capital developer tools Nevada principal",
  "Conservative Christian venture capital developer tools Utah principal",

  "Fondo capital dev tools Estados unidos",
  "Fund capital developer tools United states",
  "Fondo capital developer tools San francisco",
  "Fund capital developer tools San Francisco",
  "Latino fondo capital developer tools Estados unidos",
  "Latino fund capital developer tools United states",
  "Latino fondo capital developer tools San francisco",
  "Latino fund capital developer tools San Francisco",
  "Fondo developer tools España",
  "Fondo capital developer tools México",
  "Fondo capital developer tools Argentina",
  "Fondo capital developer tools árabe",
  "Fund capital developer tools arab",
  "Conservative Christian Fund capital developer tools United states",
  "Conservative Christian Fund capital developer tools Texas",
  "Conservative Christian Fund capital developer tools Florida",
  "Conservative Christian Fund capital developer tools New Mexico",
  "Conservative Christian Fund capital developer tools Nevada",
  "Conservative Christian Fund capital developer tools Utah",

  "Inversor angel developer tools España",
  "Inversor angel developer tools Estados unidos",
  "Inversor angel developer tools San francisco",
  "Latino inversor angel developer tools Estados unidos",
  "Latino inversor angel developer tools San francisco",
  "Inversor angel developer tools México",
  "Inversor angel developer tools Argentina",
  "Inversor angel developer tools árabe",
  "Conservador cristiano inversor angel developer tools United states",
  "Conservador cristiano inversor angel developer tools Texas",
  "Conservador cristiano inversor angel developer tools Florida",
  "Conservador cristiano inversor angel developer tools New Mexico",
  "Conservador cristiano inversor angel developer tools Nevada",
  "Conservador cristiano inversor angel developer tools Utah",

  "Angel investor developer tools España",
  "Angel investor developer tools Estados unidos",
  "Angel investor developer tools San francisco",
  "Latino angel investor developer tools Estados unidos",
  "Latino angel investor developer tools San francisco",
  "Angel investor developer tools México",
  "Angel investor developer tools Argentina",
  "Angel investor developer tools árabe",
  "Conservative Christian angel investor developer tools United states",
  "Conservative Christian angel investor developer tools Texas",
  "Conservative Christian angel investor developer tools Florida",
  "Conservative Christian angel investor developer tools New Mexico",
  "Conservative Christian angel investor developer tools Nevada",
  "Conservative Christian angel investor dev tools Utah",


  




  "Venture capital infra IA Estados unidos general partner",
  "Venture capital infra IA tools United states general partner",
  "Venture capital infra IA San francisco general partner",  
  "Latino venture capital infra IA Estados unidos general partner",
  "Latino venture capital infra IA United states general partner",
  "Latino venture capital infra IA San francisco general partner",
  "Venture capital infra IA España general partner",
  "Venture capital infra IA México general partner",
  "Venture capital infra IA Argentina general partner",
  "Venture capital infra IA árabe general partner",
  "Venture capital infra IA arab general partner",
  "Conservative Christian venture capital infra IA United states general partner",
  "Conservative Christian venture capital infra IA Texas general partner",
  "Conservative Christian venture capital infra IA Florida general partner",
  "Conservative Christian venture capital infra IA New Mexico general partner",
  "Conservative Christian venture capital infra IA Nevada general partner",
  "Conservative Christian venture capital infra IA Utah general partner",


 "Venture capital infra IA tools Estados unidos partner",
  "Venture capital infra IA tools United states partner",
  "Venture capital infra IA tools San francisco partner",  
  "Latino venture capital infra IA Estados unidos partner",
  "Latino venture capital infra IA United states partner",
  "Latino venture capital infra IA San francisco partner",
  "Venture capital infra IA España partner",
  "Venture capital infra IA México partner",
  "Venture capital infra IA Argentina partner",
  "Venture capital infra IA árabe partner",
  "Venture capital infra IA arab partner",
  "Conservative Christian venture capital infra IA United states partner",
  "Conservative Christian venture capital infra IA Texas partner",
  "Conservative Christian venture capital infra IA Florida partner",
  "Conservative Christian venture capital infra IA New Mexico partner",
  "Conservative Christian venture capital infra IA Nevada partner",
  "Conservative Christian venture capital infra IA Utah partner",

  "Venture capital infra IA tools Estados unidos principal",
  "Venture capital infra IA tools United states principal",
  "Venture capital infra IA tools San francisco principal",  
  "Latino venture capital infra IA Estados unidos principal",
  "Latino venture capital infra IA United states principal",
  "Latino venture capital infra IA San francisco principal",
  "Venture capital infra IA España principal",
  "Venture capital infra IA México principal",
  "Venture capital infra IA Argentina principal",
  "Venture capital infra IA árabe principal",
  "Venture capital infra IA arab principal",
  "Conservative Christian venture capital infra IA United states principal",
  "Conservative Christian venture capital infra IA Texas principal",
  "Conservative Christian venture capital infra IA Florida principal",
  "Conservative Christian venture capital infra IA New Mexico principal",
  "Conservative Christian venture capital infra IA Nevada principal",
  "Conservative Christian venture capital infra IA Utah principal",

  "Fondo capital infra IA Estados unidos",
  "Fund capital infra IA United states",
  "Fondo capital infra IA San francisco",
  "Fund capital infra IA San Francisco",
  "Latino fondo capital infra IA Estados unidos",
  "Latino fund capital infra IA United states",
  "Latino fondo capital infra IA San francisco",
  "Latino fund capital infra IA San Francisco",
  "Fondo infra IA España",
  "Fondo capital infra IA México",
  "Fondo capital infra IA Argentina",
  "Fondo capital infra IA árabe",
  "Fund capital infra IA arab",
  "Conservative Christian Fund capital infra IA United states",
  "Conservative Christian Fund capital infra IA Texas",
  "Conservative Christian Fund capital infra IA Florida",
  "Conservative Christian Fund capital infra IA New Mexico",
  "Conservative Christian Fund capital infra IA Nevada",
  "Conservative Christian Fund capital infra IA Utah",

  "Inversor angel infra IA España",
  "Inversor angel infra IA Estados unidos",
  "Inversor angel infra IA San francisco",
  "Latino inversor angel infra IA Estados unidos",
  "Latino inversor angel infra IA San francisco",
  "Inversor angel infra IA México",
  "Inversor angel infra IA Argentina",
  "Inversor angel infra IA árabe",
  "Conservador cristiano inversor angel infra IA United states",
  "Conservador cristiano inversor angel infra IA Texas",
  "Conservador cristiano inversor angel infra IA Florida",
  "Conservador cristiano inversor angel infra IA New Mexico",
  "Conservador cristiano inversor angel infra IA Nevada",
  "Conservador cristiano inversor angel infra IA Utah",

  "Angel investor infra IA España",
  "Angel investor infra IA Estados unidos",
  "Angel investor infra IA San francisco",
  "Latino angel investor infra IA Estados unidos",
  "Latino angel investor infra IA San francisco",
  "Angel investor infra IA México",
  "Angel investor infra IA Argentina",
  "Angel investor infra IA árabe",
  "Conservative Christian angel investor infra IA United states",
  "Conservative Christian angel investor infra IA Texas",
  "Conservative Christian angel investor infra IA Florida",
  "Conservative Christian angel investor infra IA New Mexico",
  "Conservative Christian angel investor infra IA Nevada",
  "Conservative Christian angel investor infra IA Utah",






];

export const queries = (): string => `Buscá en español y en inglés, variando muchas consultas. Ejemplos: ${quotedList([...QUERIES, ...FAITH_QUERIES])}.`;

/** Where to look, by scope. Only sources that exist. Rendered as a sub-list under the numbered item. */
export const SOURCE_GROUPS: { scope: string; items: string[] }[] = [
  {
    scope: "Datos y directorios de inversores",
    items: [
      "Crunchbase",
      "PitchBook",
      "Dealroom",
      "Tracxn",
      "Signal NFX",
      "OpenVC (directorio de inversores filtrable por tesis)",
      "AngelList",
      "Landscape.vc",
      "LinkedIn a través de buscadores",
      "X/Twitter",
    ],
  },
  {
    scope: "Asociaciones y redes de inversores",
    items: [
      "ASCRI (Asociación Española de Capital, Crecimiento e Inversión) y su directorio de socios",
      "AEBAN (Asociación Española de Business Angels)",
      "AMEXCAP (Asociación Mexicana de Capital Privado)",
      "LAVCA (Association for Private Capital Investment in Latin America) y su directorio",
      "LatinxVC y su informe State of Latinx VC",
      "VC Include",
      "Endeavor (Miami, México, España)",
      "Keiretsu Forum España",
      "BigBan Angels",
      "ESADE BAN",
      "IESE Business Angels",
    ],
  },
  {
    scope: "España",
    items: [
      "Dealflow.es",
      "El Referente",
      "Startupxplore",
      "Novobrief",
      "Loogic",
      "Expansión",
      "Cinco Días",
      "El Español (Invertia y D+I)",
      "Business Insider España",
      "Emprendedores",
      "South Summit y Spain Tech Week (listas de inversores asistentes)",
    ],
  },
  {
    scope: "México",
    items: ["Contxto", "Whitepaper.mx", "Expansión (México)", "El Economista (México)", "El Financiero Bloomberg", "Startupeable", "MassChallenge México", "Endeavor México"],
  },
  {
    scope: "Latinos en San Francisco y Silicon Valley",
    items: [
      "Techqueria",
      "Latinas in Tech",
      "Stanford Latino Entrepreneurship Initiative (SLEI) y LBAN",
      "Latino Community Foundation",
      "Latino Startup Alliance",
      "Silicon Valley Latino",
      "L'Attitude (conferencia)",
      "las páginas de equipo de los fondos de Sand Hill Road y San Francisco, buscando socios de origen hispano o latinoamericano",
    ],
  },
  {
    scope: "Latinos en Estados Unidos en general",
    items: [
      "Bloomberg Línea",
      "Forbes México y Forbes Centroamérica",
      "Latino Leaders",
      "Hispanic Executive",
      "US Hispanic Chamber of Commerce",
      "Google for Startups Latino Founders Fund (mentores e inversores)",
      "Crunchbase News (listas de inversores y fundadores latinos)",
      "Latitud",
    ],
  },
  {
    scope: "Mundo árabe: hispanohablantes en el Golfo y cobertura en español",
    items: [
      "Atalayar",
      "El Correo del Golfo",
      "Casa Árabe",
      "ICEX (oficinas en Dubái y Riad; informes sobre inversores del Golfo)",
      "MAGNiTT (datos de venture capital en MENA)",
      "Wamda",
      "Hub71 (Abu Dabi) y DIFC Innovation Hub (Dubái)",
      "comunidades de españoles y latinos en Dubái, Abu Dabi y Riad en LinkedIn",
    ],
  },
  {
    scope: "Cinturón cristiano conservador de Estados Unidos",
    items: [
      "Faith Driven Investor y Faith Driven Entrepreneur (directorio, grupos locales y podcast)",
      "C12 Group, Convene, Legatus, Napa Institute, Halftime Institute y Kingdom Advisors (directorios de miembros y ponentes)",
      "National Christian Foundation y sus capítulos estatales",
      "ProPublica Nonprofit Explorer y Candid/GuideStar para leer los formularios 990 de fundaciones, endowments y ministerios: ahí aparecen el patrimonio, los gestores y los consejos",
      "formularios D de la SEC para los vehículos de esos family offices",
      "los business journals estatales y sus Book of Lists: D CEO y Texas Monthly, Florida Trend, Atlanta Business Chronicle, Charlotte y Triangle Business Journal, Birmingham Business Journal, Arkansas Business, Utah Business, Nevada Business Magazine, Biz New Orleans, Colorado Springs Gazette, Albuquerque Business First",
      "World, Christianity Today y Ministry Watch para la cobertura de negocios de ese mundo",
      "las páginas de equipo y de consejo de las universidades cristianas y sus fondos de emprendimiento",
    ],
  },
  {
    scope: "Podcasts y newsletters",
    items: ["20VC", "Invest Like the Best", "Itnig", "Kapital", "Cracks (Oso Trava)", "Dealflow.es", "Latitud", "Startupeable", "newsletters y blogs propios de los inversores"],
  },
];

export const sources = (): string => `Fuentes de descubrimiento, por ámbito:\n${SOURCE_GROUPS.map((group) => `   - ${group.scope}: ${group.items.join(", ")}.`).join("\n")}`;

/** The twelve states of the faith-driven segment, in the order the client named them. Both names: the prose is in Spanish, the searches are not. */
export const FAITH_STATES: { es: string; en: string }[] = [
  { es: "Texas", en: "Texas" },
  { es: "Florida", en: "Florida" },
  { es: "Nuevo México", en: "New Mexico" },
  { es: "Nevada", en: "Nevada" },
  { es: "Utah", en: "Utah" },
  { es: "Colorado", en: "Colorado" },
  { es: "Luisiana", en: "Louisiana" },
  { es: "Alabama", en: "Alabama" },
  { es: "Georgia", en: "Georgia" },
  { es: "Carolina del Sur", en: "South Carolina" },
  { es: "Carolina del Norte", en: "North Carolina" },
  { es: "Arkansas", en: "Arkansas" },
];

export const faithIntro = (): string =>
  `Veta dentro del ámbito de Estados Unidos hispanohablante, que hoy no estás recorriendo: las entidades cristianas conservadoras de ${FAITH_STATES.map((state) => state.es).join(", ")}. ` +
  "Es dinero que decide por convicción y horizonte largo, no por tracción, así que encaja con un cliente sin usuarios todavía. Lo que buscás " +
  "ahí es la intersección, no la entidad: personas de ese mundo que además hablen español e inviertan en fundadores hispanohablantes. " +
  "Recorrelo por tipo de entidad, porque cada tipo se busca distinto:";

/** Every kind of investor entity in that world, each with names to start from. Verify each one: they are leads, not evidence. */
export const FAITH_TYPES = [
  "Redes de empresarios y pastores hispanos evangélicos, que es donde la intersección es más densa: la National Hispanic Christian Leadership Conference, El Rey Jesús (Miami), las iglesias hispanas grandes de Houston, Dallas, San Antonio, Orlando, Atlanta y Charlotte, y sus grupos de negocios. Empezá por acá.",
  "Fondos de venture con tesis cristiana declarada: Sovereign's Capital, Praxis, y en general los fondos que se presentan como faith-driven o redemptive en su propia web.",
  "Gestoras de inversión bíblicamente responsable (BRI): Timothy Plan (Maitland, Florida), Ave Maria Mutual Funds y Schwartz Investment Counsel (Naples, Florida), Inspire Investing, Eventide Asset Management, GuideStone Financial Resources (Dallas), Knights of Columbus Asset Advisors. Invierten en cotizadas, pero sus fundadores, consejeros y clientes son angels frecuentes.",
  "Capital conservador de la llamada economía paralela, con tesis explícita anti-ESG o EIG: 1789 Capital (Palm Beach), New Founding (Texas), PublicSquare / PSQ Holdings (West Palm Beach), Strive Asset Management.",
  "Family offices de familias que se declaran cristianas: en Texas, Wilks Brothers (Cisco), Hunt (Dallas), Bass (Fort Worth), CrownQuest y Tim Dunn (Midland), Interstate Batteries y Norm Miller (Dallas); en Arkansas, Walton y Runway Group (Bentonville), Tyson (Springdale), Stephens Inc. (Little Rock), Murphy (El Dorado); en Georgia, la familia Cathy y WinShape; en Alabama, Harbert Management, Drummond y McWane (Birmingham); en las Carolinas, Belk (Charlotte) y el entorno de la Billy Graham Evangelistic Association; en Luisiana, las familias del petróleo y la comunidad católica de Nueva Orleans; en Nuevo México, las familias del Pérmico de los condados de Lea y Eddy.",
  "Endowments, fondos de emprendimiento y angel networks de universidades cristianas, empezando por las de ciudad hispanohablante: St. Mary's y University of the Incarnate Word (San Antonio), Baylor y su Baylor Angel Network, TCU, Abilene Christian y Dallas Baptist (Texas); Ave Maria University, Palm Beach Atlantic y Southeastern University (Florida); Samford (Alabama); Ouachita Baptist, Harding y John Brown University (Arkansas); Anderson University, Bob Jones y Furman (Carolina del Sur); Wake Forest, Davidson y Campbell (Carolina del Norte); Colorado Christian University; Louisiana Christian University y Loyola New Orleans; University of the Southwest (Hobbs, Nuevo México).",
  "Fondos denominacionales: GuideStone (Convención Bautista del Sur), AGFinancial (Asambleas de Dios, con una red hispana enorme), Wespath (metodistas) y la fundación de la Iglesia Presbiteriana.",
  "Fundaciones de donantes cristianos con brazo de inversión de impacto: National Christian Foundation y sus capítulos de Texas, Florida, Georgia, Colorado y las Carolinas; The Signatry; The Gathering; Generous Giving.",
  "Redes de empresarios y CEOs cristianos, que es donde están los angels sin página web: C12 Group (sede en Fort Worth, capítulos en los doce estados), Convene, Napa Institute, Halftime Institute (Dallas), Kingdom Advisors (Atlanta), Faith Driven Investor y Faith Driven Entrepreneur (Atlanta) con sus grupos locales, su podcast y su directorio, y el Acton Institute. En todos ellos, filtrá por los miembros hispanos.",
  "Fondos de dotación de ministerios y organizaciones paraeclesiales, con patrimonio propio y consejos llenos de empresarios: Focus on the Family, Compassion International, Navigators y Young Life (Colorado Springs); Samaritan's Purse y la Billy Graham Evangelistic Association (Carolina del Norte); In Touch (Atlanta). Mirá sus programas y consejos para América Latina, que es donde aparecen los hispanohablantes.",
  "Aceleradoras e incubadoras de raíz cristiana y los programas de emprendimiento de esas universidades, donde aparecen los mentores que además firman cheques.",
  "Angel groups y sindicatos regionales de esos estados que se declaran faith-driven o values-aligned en su propia presentación.",
  "Bancos, aseguradoras y gestoras regionales de raíz cristiana con brazo de venture o de alternativos.",
];

export const FAITH_RULE =
  "El ámbito es cristiano protestante y/o conservador. Quedan fuera las entidades catolicas y mormonas (Iglesia " +
  "de Jesucristo de los Santos de los Últimos Días) y su ecosistema, que en Utah y Nevada es la mayor parte del capital tecnológico: en " +
  "esos dos estados buscá las redes protestantes y evangélicas, no las de Silicon Slopes. La afiliación religiosa se registra sólo cuando " +
  "la entidad la declara en su web o la persona la dijo en público: nunca la infieras por el apellido, el estado, la universidad, la " +
  "iglesia a la que asiste alguien de la familia ni las donaciones. Si no hay declaración pública, no lo escribas.";

export const FAITH_SPANISH =
  "Esta veta no es una excepción a nada. Además de la entidad, la persona tiene que cumplir lo mismo que el resto del ámbito " +
  "estadounidense: español verificable e inversión documentada en fundadores hispanohablantes, las dos cosas con evidencia pública. Si " +
  "no habla español, o no hay rastro de que trabaje con fundadores hispanohablantes, no la mandes, por muy alineada que esté la entidad. " +
  "El criterio de pureza tampoco se afloja: entra sólo si invierte en deep tech, infraestructura de IA o dev tools, y temprano. En el " +
  "tipo llevan `region` en `us_hispanic`, y en `fitSignals` decí de qué entidad vienen.";

/** The item as it is rendered: the intro, one line per kind of entity, then the two rules. */
export const faithSegment = (): string =>
  [faithIntro(), ...FAITH_TYPES.map((type) => `   - ${type}`), "", `   ${FAITH_RULE}`, "", `   ${FAITH_SPANISH}`].join("\n");

/** The segment has no single directory, so the query is the directory: every pattern against every state. */
export const FAITH_QUERY_PATTERNS_EN = [
  "Hispanic Christian investor venture capital",
  "Latino faith driven investor",
  "Christian venture capital fund Hispanic founders",
  "faith-based angel investor Latino founders technology",
  "Christian family office technology investment",
];

export const FAITH_QUERY_PATTERNS_ES = ["inversor cristiano hispano capital riesgo deep tech", "empresarios cristianos hispanos inversión tecnología"];

export const FAITH_QUERIES = [
  ...FAITH_STATES.flatMap((state) => FAITH_QUERY_PATTERNS_EN.map((pattern) => `${pattern} ${state.en}`)),
  ...FAITH_STATES.flatMap((state) => FAITH_QUERY_PATTERNS_ES.map((pattern) => `${pattern} ${state.es}`)),
  "Faith Driven Investor podcast guest deep tech",
  "C12 Group member angel investor technology",
  "Legatus chapter member venture capital",
  "National Christian Foundation impact investing venture",
  "Sovereign's Capital portfolio artificial intelligence",
  "Praxis venture portfolio software infrastructure",
  "1789 Capital portfolio deep tech",
  "New Founding portfolio companies",
  "Baylor Angel Network deep tech investor",
  "Christian university endowment venture capital allocation",
  "Permian Basin family office technology investments",
  "National Hispanic Christian Leadership Conference business leaders investors",
  "Hispanic megachurch business network investors Houston Miami",
  "Legatus Hispanic members Miami San Antonio investor",
  "red de empresarios cristianos hispanos inversión Texas Florida",
  "pastor hispano empresario inversor tecnología Estados Unidos",
];

export const NOTES =
  "Para cada candidato anotá origen o evidencia de español, foco, etapa y ticket, formación técnica, por qué encaja y confianza. " +
  'Sé honesto: si no podés confirmar la fluidez en español, decilo ("origen sólo, fluidez no confirmada"). No rellenes con generalistas ' +
  "de consumo o fintech. Llevá una lista de considerados y rechazados con el motivo, para no volver a investigarlos.";

export const discovery: Term = {
  id: "discovery",
  title: () => "Descubrimiento de candidatos",
  render: (ctx) => paragraphs(intro(ctx), numbered([FUNDS, INSTITUTIONS, faithSegment(), queries(), sources(), NOTES])),
};
