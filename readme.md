# CRM inversores

App para filtrar y consultar perfiles de inversores deep tech / dev tools hispanohablantes (84 perfiles auditados el
2 de septiembre de 2026, nivel 0-100).

Convención: el código, los nombres de archivos y los campos de la base están en inglés; los textos que ve el usuario
están en español (`src/lib/labels.ts` traduce cada código a su etiqueta).

## Una sola fuente de verdad: Firestore

Una única colección, `investors`, con un documento por inversor: el perfil completo con su auditoría. La app se
suscribe a la colección entera y refleja cualquier cambio en vivo.

```bash
npm run dev                               # la app, suscripta a investors
npm run recalculate                       # valida cada documento y reescribe los valores derivados que cambiaron
npm run backup                            # copia completa de investors al bucket de Storage, verificada (--list las enumera)
npm run restore -- <nombre>.json          # vuelve a escribir en Firestore una copia del bucket (--prune borra lo que no esté)
npm run typecheck                         # tipos de la app y de los scripts
```

## Tema claro y oscuro

Todos los colores salen de los tokens de `src/index.css`; el bloque oscuro sólo redefine tokens. Por defecto la app
sigue al sistema (`prefers-color-scheme`); la pill sol / luna de la cabecera guarda la elección en `localStorage` y la
aplica antes del primer render (`src/lib/theme.ts`).

## Calificación manual

Desde la ficha, "Calificar perfil" abre un diálogo con Aprobado, Dudoso, Desaprobado y Relleno, más "Descalificar" si
ya tenía una. Se guarda en `rating` del documento (`approved`, `doubtful`, `rejected`, `filler` o `null`), es la única
escritura que hace la app y se refleja en vivo: borde de 3px en la tarjeta del listado (verde, azul oscuro, rojo, gris
oscuro), badge en la ficha y primer grupo de filtros. El endpoint de ingesta siempre deja `rating` en `null`; los
perfiles calificados como desaprobado o relleno no se usan como ejemplos en el prompt.

## Buscar más perfiles

El botón "Buscar más perfiles" (arriba a la derecha) pregunta cuántos perfiles buscar y copia al portapapeles un prompt
completo para pegar en un chat de IA: el pedido, la metodología de descubrimiento e investigación, la rúbrica, el código
fuente del tipo, el endpoint de ingesta con su token, todos los perfiles existentes como excluidos (nombre, LinkedIn,
email) y los perfiles con nivel mayor a 80 como ejemplos.

El prompt se construye en `src/prompt-builder/`:

- `sections/` — un archivo por aspecto: `intro`, `request` (el pedido, un párrafo por constante), `context`,
  `discovery`, `research`, `rubric`, `output-format`, `endpoint`, `exclusions`, `examples`, `footer`. Cada texto es una
  constante exportada; cambiar una idea es cambiar una constante.
- `sections.ts` — el orden del documento. Reordenar renumera los títulos y las referencias cruzadas ("sección 6").
- `config.ts` — parámetros: cantidad por defecto y máxima, nivel mínimo de los ejemplos, calificaciones excluidas.
- `assemble.ts` — ensambla intro, secciones numeradas y pie en una sola cadena. Puro, sin acceso al entorno.
- `environment.ts` — URL del endpoint y token desde el entorno. `index.ts` — punto de entrada de la app.

La rúbrica y el límite por petición se leen del tipo (`SCORE_WEIGHTS`, `CAP_RULES`, `BAND_THRESHOLDS`,
`INGEST_MAX_PER_REQUEST`), así que el prompt nunca se desfasa del servidor.

`POST /api/investors` (`api/investors.ts`, función de Vercel) recibe `{ "investors": [ ... ] }` con
`Authorization: Bearer <VITE_INGEST_TOKEN>`, hasta 20 perfiles por petición. Valida cada uno contra el tipo, fuerza la
auditoría a `pending`, recalcula lo derivado, rechaza duplicados por id, nombre, LinkedIn o email y escribe sólo los
nuevos; nunca sobreescribe. `?dryRun=1` valida sin escribir. Variables: `VITE_INGEST_TOKEN` (obligatoria) y
`VITE_APP_URL` (opcional; en Vercel se toma de `VERCEL_PROJECT_PRODUCTION_URL`).

En desarrollo, `npm run dev` también sirve `/api/investors` con el mismo handler (plugin `localApi` en
`vite.config.ts`), así que se puede probar con `curl` contra `http://localhost:5173/api/investors`. El endpoint que va
en el prompt es `VITE_APP_URL` si está definida y, si no, el origen de la página: un chat externo no puede llegar a
`localhost`, así que en local conviene definir `VITE_APP_URL` con la URL del deploy.

## Recupero ante desastres

`npm run backup` sube toda la colección como un único JSON a `backups/investors/<fecha>.json` en el bucket de Storage,
lo vuelve a descargar y comprueba que sea byte a byte igual a lo leído. Antes de una tarea riesgosa: `npm run backup`.
`npm run backup -- --list` enumera las copias.

Si la base se daña: `npm run restore -- <nombre>.json`; `--prune` elimina además los documentos que no estén en la
copia. Las reglas de Storage deben permitir leer y escribir `backups/**` con el SDK web. No hay copias en el repo ni
en disco: la única fuente de verdad es Firestore y las copias viven en el bucket.

Editar un perfil = editarlo en Firestore. La app recalcula lo derivado al leer, así que un documento editado a mano
nunca muestra un nivel desfasado; `npm run recalculate` deja además los valores derivados guardados alineados.

## Estructura

- `src/types/investor.ts` — **tipo canónico** `Investor` (esquema zod + tipo TypeScript), umbrales de banda,
  `computeScore` y `deriveInvestor` (validación + derivación). Todo lo demás se apoya en este archivo.
- `src/lib/labels.ts` — etiquetas en español para cada código (bandas, regiones, tipos, estados, topes, rúbrica).
- `src/lib/investors.ts` — suscripción a Firestore. `src/context/` — el contexto que expone la colección.
- `src/lib/filters.ts` — filtros, orden y URL. `src/components/` — filtros, lista, ficha y badges.
- `scripts/` — `recalculate.ts`, `backup.ts`, `restore.ts`; `scripts/lib/` conecta con la config de `.env`, serializa con claves
  ordenadas y maneja las copias del bucket.

## Auditoría dentro del perfil

```json
"audit": {
  "status": "reviewed",            // o "pending" (alta nueva sin puntuar)
  "date": "2026-09-02",
  "reason": "...",                 // por qué tiene ese nivel, en términos absolutos
  "score": {
    "thesis": 10, "stage": 5, "decision": 10, "spanish": 4, "access": 3.3,  // entradas editables, 0-10 con un decimal
    "raw": 68, "caps": [], "total": 68                                      // derivados: no editar
  }
}
```

Rúbrica: cinco dimensiones de 0 a 10 (un decimal) y nivel 0-100 como promedio ponderado con pesos tesis 26, etapa 21,
decisión 21, español 16, acceso 16. Topes: tesis < 2,4 → máx. 45; tesis < 4 → máx. 55; decisión ≤ 4 → máx. 69;
etapa ≤ 3,5 → máx. 64. Bandas: `undisputed` ≥ 78, `high_potential` 60-77, `reserve` 45-59, `discarded` < 45, y
`unaudited` mientras el estado sea `pending`. `level`, `band` y `priority` (A/B/C) de la raíz se derivan de aquí.

Reglas de redacción: cada ficha se escribe en términos absolutos, sin comparaciones con otros perfiles. Origen y español
sólo con autoidentificación pública o hechos biográficos documentados. Emails sólo de fuentes públicas, con `emailStatus`
explícito; la procedencia de cada vía va en `contactSources`. `personalWebsite` es el sitio, blog o newsletter que
controla la propia persona, nunca la web del fondo.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # config web de Firebase (VITE_FIREBASE_*)
npm run dev
```

Las reglas de Firestore deben permitir leer y escribir `investors/{id}` con el SDK web (la app lee; los scripts leen
y escriben).
