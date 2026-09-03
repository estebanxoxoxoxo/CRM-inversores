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
npm run integrity                         # valida cada documento contra el tipo y reporta inválidos y desfasados (--fix reescribe los desfasados)
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

El prompt se construye en `src/prompt-builder/` como una suma de términos: cada archivo de `terms/` es un término, y el
agregador `build/build.ts` los renderiza en orden y los junta literalmente, separados por una línea en blanco.

- `terms/` — un archivo por término, en orden de aparición: `opening` (título y párrafo inicial), `request` (el pedido),
  `context`, `discovery`, `research`, `rubric` (pesos, topes y bandas leídos del tipo), `type` (el tipo incrustado tal
  cual), `endpoint`, `exclusions` (todos los perfiles de la base), `examples` (los revisados con nivel mayor a 80,
  sin desaprobados ni relleno; las reglas viven ahí) y `footer` (fecha). Cada párrafo es una constante exportada:
  cambiar una idea es cambiar una constante.
- `inputs/` — de dónde sale cada entrada: `count` (la cantidad del diálogo, con valor por defecto y máximo),
  `environment` (URL del endpoint y token), `type-source` (el archivo del tipo, leído tal cual), `date`. Los perfiles
  llegan de la suscripción de la app.
- `build/` — `build.ts`, el agregador, con la lista de términos en orden; `numbering.ts` numera los términos con título y
  resuelve las referencias cruzadas ("el tipo de la sección 6"), así que mover un término renumera títulos y
  referencias a la vez.
- `format/markdown.ts` — ayudantes de Markdown que usan los términos (cita, listas, bloques de código, decimal con coma).
- `types/` — `term.ts` (un término y sus ids) y `prompt.ts` (las entradas y el contexto que recibe cada término).
- `index.ts` — punto de entrada: reúne las entradas y ejecuta la unión.

Como la rúbrica y el límite por petición se leen del tipo (`SCORE_WEIGHTS`, `CAP_RULES`, `BAND_THRESHOLDS`,
`INGEST_MAX_PER_REQUEST`), el prompt nunca se desfasa del servidor.

`POST /api/investors` (`api/investors.ts`, función de Vercel) recibe `{ "investors": [ ... ] }` con
`Authorization: Bearer <VITE_INGEST_TOKEN>`, hasta 20 perfiles por petición. Valida cada uno contra el tipo, fuerza la
auditoría a `pending`, recalcula lo derivado, rechaza duplicados por id, nombre, LinkedIn o email y escribe sólo los
nuevos; nunca sobreescribe. `?dryRun=1` valida sin escribir. Variables: `VITE_INGEST_TOKEN` (obligatoria) y
`VITE_APP_URL` (opcional; en Vercel se toma de `VERCEL_PROJECT_PRODUCTION_URL`).

En desarrollo, `npm run dev` también sirve cada `api/<nombre>.ts` en `/api/<nombre>` con el mismo handler (plugin
`localApi` en `vite.config.ts`), así que se puede probar con `curl` contra `http://localhost:5173/api/investors`. El endpoint que va
en el prompt es `VITE_APP_URL` si está definida y, si no, el origen de la página: un chat externo no puede llegar a
`localhost`, así que en local conviene definir `VITE_APP_URL` con la URL del deploy.

## Recupero ante desastres

El botón "Hacer backup" de la cabecera y `npm run backup` hacen lo mismo con el mismo código (`src/lib/backup.ts`):
suben toda la colección como un único JSON a `backups/investors/<fecha>.json` en el bucket de Storage, lo vuelven a
descargar y comprueban que sea byte a byte igual a lo leído. Desde la app corre en el servidor a través de
`/api/backup` (`api/backup.ts`; `POST` con el token crea, `GET` devuelve el último), así la verificación no depende de la
configuración CORS del bucket. La cabecera muestra la fecha del último backup: se consulta al cargar
(`src/context/BackupProvider.tsx`) y se actualiza al crear uno. Antes de una tarea riesgosa: backup.
`npm run backup -- --list` enumera las copias.

Si la base se daña: `npm run restore -- <nombre>.json`; `--prune` elimina además los documentos que no estén en la
copia. Las reglas de Storage deben permitir leer y escribir `backups/**` con el SDK web. No hay copias en el repo ni
en disco: la única fuente de verdad es Firestore y las copias viven en el bucket.

Editar un perfil = editarlo en Firestore. La app recalcula lo derivado al leer, así que un documento editado a mano
nunca muestra un nivel desfasado. `npm run integrity` comprueba toda la colección contra el tipo: reporta los documentos
inválidos (no cumplen el tipo) y los desfasados (valores derivados viejos o campos que el tipo no define); con `--fix`
reescribe los desfasados en su forma canónica.

## Estructura

- `src/types/investor.ts` — **tipo canónico** `Investor` (esquema zod + tipo TypeScript), umbrales de banda,
  `computeScore` y `deriveInvestor` (validación + derivación). Todo lo demás se apoya en este archivo.
- `src/lib/labels.ts` — etiquetas en español para cada código (bandas, regiones, tipos, estados, topes, rúbrica).
- `src/lib/investors.ts` — suscripción a Firestore. `src/context/` — el contexto que expone la colección.
- `src/lib/filters.ts` — filtros, orden y URL. `src/components/` — filtros, lista, ficha y badges.
- `src/lib/backup.ts` — copias en el bucket, compartido por la app y los scripts. `src/lib/json.ts` — claves ordenadas.
  `src/lib/api.ts` — llamadas de la app a sus propias funciones (`/api/*`) con el token.
- `api/` — funciones de Vercel: `investors.ts` (ingesta) y `backup.ts`. `server/` — lo que comparten: `firestore.ts`
  (inicialización con las variables de entorno), `auth.ts` (token), `ingest.ts` (validación y deduplicación).
- `scripts/` — `integrity.ts`, `backup.ts`, `restore.ts`; `scripts/lib/firestore.ts` carga `.env` y reutiliza la
  inicialización de `server/firestore.ts`.

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
