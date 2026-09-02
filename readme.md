# CRM inversores

App para filtrar y consultar perfiles de inversores deep tech / dev tools hispanohablantes (84 perfiles auditados el
2 de septiembre de 2026, nivel 0-100).

Convención: el código, los nombres de archivos y los campos de la base están en inglés; los textos que ve el usuario
están en español (`src/lib/labels.ts` traduce cada código a su etiqueta).

## Una sola fuente de verdad: Firestore

Una única colección, `investors`, con un documento por inversor: el perfil completo con su auditoría. La app se
suscribe a la colección entera y refleja cualquier cambio en vivo. No hay datos en el repositorio; `backups/`
(ignorado por git) sólo contiene volcados de `npm run export`.

```bash
npm run dev                               # la app, suscripta a investors
npm run recalculate                       # valida cada documento y reescribe los valores derivados que cambiaron
npm run import -- <archivo.json|carpeta>  # alta de inversores nuevos desde un JSON de investigación (auditoría pendiente)
npm run export                            # respaldo local de investors/* en backups/<fecha>/
npm run typecheck                         # tipos de la app y de los scripts
```

Editar un perfil = editarlo en Firestore. La app recalcula lo derivado al leer, así que un documento editado a mano
nunca muestra un nivel desfasado; `npm run recalculate` deja además los valores derivados guardados alineados.

## Estructura

- `src/types/investor.ts` — **tipo canónico** `Investor` (esquema zod + tipo TypeScript), umbrales de banda,
  `computeScore` y `deriveInvestor` (validación + derivación). Todo lo demás se apoya en este archivo.
- `src/lib/labels.ts` — etiquetas en español para cada código (bandas, regiones, tipos, estados, topes, rúbrica).
- `src/lib/investors.ts` — suscripción a Firestore. `src/context/` — el contexto que expone la colección.
- `src/lib/filters.ts` — filtros, orden y URL. `src/components/` — filtros, lista, ficha y badges.
- `scripts/` — `recalculate.ts`, `import-profiles.ts`, `export.ts`; `scripts/lib/firestore.ts` conecta con la
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
