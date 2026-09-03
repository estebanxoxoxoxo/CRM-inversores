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
npm run import -- <archivo.json|carpeta>  # alta de inversores nuevos desde un JSON de investigación (auditoría pendiente)
npm run snapshot                          # copia de recupero: investors/* -> snapshot/investors/<id>.json (commitear)
npm run restore                           # vuelve a escribir en Firestore lo que hay en snapshot/ (--prune borra lo que no esté)
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

El botón "Buscar más perfiles" (arriba a la derecha) copia al portapapeles un prompt completo para pegar en un chat de
IA: el pedido original, la metodología de descubrimiento e investigación, la rúbrica, el código fuente del tipo, el
endpoint de ingesta con su token, todos los perfiles existentes como excluidos (nombre, LinkedIn, email) y los perfiles
con nivel mayor a 80 como ejemplos. El texto estático vive en `src/prompt/research-brief.md`; lo dinámico lo arma
`src/lib/prompt.ts` desde la colección en vivo.

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

`snapshot/investors/` es una copia versionada de la colección, no una fuente de verdad. Antes de una tarea riesgosa:
`npm run snapshot` y commit. Si la base se daña: `npm run restore` (agrega `--prune` para eliminar también los
documentos que no estén en el snapshot). Los archivos se escriben con las claves ordenadas, así que `git diff`
muestra exactamente qué cambió entre dos snapshots.

Editar un perfil = editarlo en Firestore. La app recalcula lo derivado al leer, así que un documento editado a mano
nunca muestra un nivel desfasado; `npm run recalculate` deja además los valores derivados guardados alineados.

## Estructura

- `src/types/investor.ts` — **tipo canónico** `Investor` (esquema zod + tipo TypeScript), umbrales de banda,
  `computeScore` y `deriveInvestor` (validación + derivación). Todo lo demás se apoya en este archivo.
- `src/lib/labels.ts` — etiquetas en español para cada código (bandas, regiones, tipos, estados, topes, rúbrica).
- `src/lib/investors.ts` — suscripción a Firestore. `src/context/` — el contexto que expone la colección.
- `src/lib/filters.ts` — filtros, orden y URL. `src/components/` — filtros, lista, ficha y badges.
- `scripts/` — `recalculate.ts`, `import-profiles.ts`, `snapshot.ts`, `restore.ts`; `scripts/lib/firestore.ts` conecta con la
  config de `.env` y `scripts/lib/spanish-values.ts` traduce los valores en español de los JSON de investigación.

## Auditoría dentro del perfil

```json
"audit": {
  "status": "reviewed",            // o "pending" (alta nueva sin puntuar)
  "date": "2026-09-02",
  "reason": "...",                 // por qué tiene ese nivel, en términos absolutos
  "score": {
    "thesis": 25, "stage": 10, "decision": 20, "spanish": 6, "access": 5,   // entradas editables
    "otherAspects": -6, "otherAspectsReason": "...",                        // entrada editable, motivo obligatorio si != 0
    "raw": 60, "caps": [], "total": 60                                      // derivados: no editar
  }
}
```

Rúbrica: tesis y encaje 0-25, etapa y pre-tracción 0-20, capacidad de decidir y capital 0-20, español y cercanía 0-15,
acceso y actividad 0-15, otros aspectos -15/+5. Topes: tesis < 6 → máx. 45; tesis < 10 → máx. 55; decisión ≤ 8 → máx. 69;
etapa ≤ 7 → máx. 64. Bandas: `undisputed` ≥ 78, `high_potential` 60-77, `reserve` 45-59, `discarded` < 45, y
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
