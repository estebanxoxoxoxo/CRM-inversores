# CRM inversores

App para filtrar y consultar perfiles de inversores deep tech / dev tools hispanohablantes (84 perfiles auditados el
2 de septiembre de 2026, nivel 0-100).

## Una sola fuente de verdad

`data/perfiles/<id>.json` es el perfil completo, incluida la auditoría. Se edita ahí y en ningún otro sitio; Firestore
recibe una copia idéntica. Flujo:

```bash
npm run recalcular   # deriva nivel/banda/prioridad de la puntuación, valida contra el tipo, regenera data/indice.json
npm run subir        # sube data/perfiles a inversores/{id}, el resumen a meta/indice y la rúbrica a meta/criterio
npm run importar -- <archivo.json | carpeta>   # alta de inversores nuevos desde un JSON de investigación (auditoría pendiente)
npm run dev          # la app lee sólo de Firestore
```

## Estructura

- `src/types/inversor.ts` — **tipo canónico** `Inversor` (esquema zod + tipo TypeScript), la rúbrica (`CRITERIO`), los
  umbrales de banda y `calcularPuntuacion`. Todo lo demás se apoya en este archivo.
- `data/perfiles/<id>.json` — un perfil por inversor. `data/indice.json` — resumen derivado para listados.
- `scripts/recalcular.ts`, `scripts/subir-firestore.ts`, `scripts/importar-perfiles.ts` — los tres comandos de arriba.
- `src/lib/datos.ts` — lectura desde Firestore (`meta/indice` para el listado, `inversores/{id}` para la ficha).
- `src/lib/filtros.ts` — filtros, orden y sincronización con la URL. `src/components/` — filtros, lista y ficha.

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
mientras el estado sea pendiente. `nivel`, `banda` y `prioridad` (A/B/C) de la raíz se derivan de aquí con `npm run recalcular`.

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

Las reglas de Firestore deben permitir leer `meta/*` e `inversores/*` desde el navegador; para `npm run subir`, o bien
permiten escribir, o bien se deja una service account `*firebase-adminsdk*.json` en la raíz (ignorada por git).
