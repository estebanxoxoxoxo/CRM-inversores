# CRM inversores

App para filtrar y consultar perfiles de inversores deep tech / dev tools hispanohablantes (84 perfiles auditados el
2 de septiembre de 2026, nivel 0-100).

## Una sola fuente de verdad: Firestore

- `inversores/{id}` — un documento por inversor, perfil completo con su auditoría. Es lo que se edita.
- `meta/indice` — resumen derivado de todos los perfiles, para listados y filtros. No se edita: lo regenera `npm run recalcular`.
- `meta/criterio` — texto de la rúbrica. Lo escribe `npm run recalcular` desde `CRITERIO` en el tipo.

No hay datos en el repositorio. `respaldo/` (ignorado por git) sólo contiene volcados de `npm run exportar`.

```bash
npm run recalcular                          # valida cada documento, deriva nivel/banda/prioridad, regenera meta/indice y meta/criterio
npm run importar -- <archivo.json|carpeta>  # alta de inversores nuevos en la base desde un JSON de investigación (auditoría pendiente)
npm run exportar                            # respaldo local de inversores/* y meta/* en respaldo/<fecha>/
npm run dev                                 # la app lee de Firestore
```

Editar un perfil = editarlo en Firestore (consola o app) y ejecutar `npm run recalcular`. La app además recalcula lo
derivado al leer, así que un documento editado a mano nunca muestra un nivel desfasado.

## Estructura

- `src/types/inversor.ts` — **tipo canónico** `Inversor` (esquema zod + tipo TypeScript), la rúbrica (`CRITERIO`), los
  umbrales de banda, `calcularPuntuacion` y `derivar` (validación + derivación). Todo lo demás se apoya en este archivo.
- `scripts/recalcular.ts`, `scripts/importar-perfiles.ts`, `scripts/exportar.ts` — los tres comandos; `scripts/lib/firestore.ts` conecta con la config de `.env`.
- `src/lib/datos.ts` — lectura desde Firestore. `src/lib/filtros.ts` — filtros, orden y URL. `src/components/` — filtros, lista y ficha.

## Auditoría dentro del perfil

```json
"auditoria": {
  "estado": "revisado",            // o "pendiente" (alta nueva sin puntuar)
  "fecha": "2026-09-02",
  "motivo": "...",                 // por qué tiene ese nivel, en términos absolutos
  "puntuacion": {
    "tesis": 25, "etapa": 10, "decision": 20, "espanol": 6, "acceso": 5,   // entradas editables
    "otros_aspectos": -6, "otros_aspectos_motivo": "...",                  // entrada editable, motivo obligatorio si != 0
    "bruto": 60, "topes": [], "total": 60                                   // derivados: no editar
  }
}
```

Rúbrica: tesis y encaje 0-25, etapa y pre-tracción 0-20, capacidad de decidir y capital 0-20, español y cercanía 0-15,
acceso y actividad 0-15, otros aspectos -15/+5. Topes: tesis < 6 → máx. 45; tesis < 10 → máx. 55; decisión ≤ 8 → máx. 69;
etapa ≤ 7 → máx. 64. Bandas: Indiscutible ≥ 78, Alto potencial 60-77, Reserva 45-59, Descartado < 45, y "Sin auditar"
mientras el estado sea pendiente. `nivel`, `banda` y `prioridad` (A/B/C) de la raíz se derivan de aquí.

Reglas de redacción: cada ficha se escribe en términos absolutos, sin comparaciones con otros perfiles. Origen y español
sólo con autoidentificación pública o hechos biográficos documentados. Emails sólo de fuentes públicas, con `email_estado`
explícito; la procedencia de cada vía va en `fuente_vias_de_contacto`. `web_personal` es el sitio, blog o newsletter que
controla la propia persona, nunca la web del fondo.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # config web de Firebase (VITE_FIREBASE_*)
npm run dev
```

Las reglas de Firestore deben permitir leer y escribir `inversores/*` y `meta/*` con el SDK web (la app lee; los
scripts leen y escriben).
