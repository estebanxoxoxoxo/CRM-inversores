# Bronce: los inversores

La sección de partida del CRM: la colección `investors`, un documento por inversor con el perfil completo y su
auditoría. El trabajo pesado (descubrir y documentar perfiles) lo hace un agente de IA: este módulo le arma el prompt,
le abre la puerta para escribir y muestra lo que hay. La sección Gold (`src/gold/`) evalúa después estos perfiles y
tiene exactamente la misma forma.

Tres piezas:

1. **El botón "Buscar más perfiles"** (cabecera de la sección Bronce): arma el prompt de búsqueda y lo copia al
   portapapeles. Los detalles del prompt están en el readme raíz, sección "Buscar más perfiles".
2. **El endpoint** `POST /api/investors` (`api/investors.ts`, función de Vercel): recibe los perfiles del agente, los
   valida contra el tipo canónico, rechaza duplicados y escribe sólo los nuevos.
3. **El backup** de `investors`: el botón "Hacer backup" de la sección Bronce y `npm run backup`.

## Estructura

- `types/investor.ts` — el **tipo canónico** `Investor` (esquema zod + tipo TypeScript), umbrales de banda,
  `computeScore` y `deriveInvestor` (validación + derivación). Se incrusta tal cual en el prompt
  (`prompt-builder/inputs/type-source.ts`, vía `?raw` de Vite). Todo lo demás se apoya en este archivo.
- `server/ingest.ts` — la ingesta: validación, deduplicación y escritura en lote. La usa `api/investors.ts`.
- `lib/investors.ts` — la suscripción a Firestore y las escrituras desde la app (calificación y conexión).
- `lib/filters.ts` — filtros, orden y su serialización en la URL.
- `lib/labels.ts` — las etiquetas en español de cada código (bandas, regiones, tipos, estados, topes, rúbrica).
- `context/` — el contexto que expone la colección (`useInvestors()`).
- `components/` — filtros, lista, ficha, diálogos de calificación y conexión, el badge de nivel y el botón "Buscar más
  perfiles".
- `prompt-builder/` — el prompt de búsqueda, un término por archivo. Sus entradas: la cantidad (diálogo), la URL del
  despliegue y el token (`import.meta.env`, por `src/lib/api.ts`), el tipo y la fecha. Los inversores salen de la
  suscripción viva de la app.

Es código de navegador salvo `server/ingest.ts`, que corre en la función de Vercel; comparte `server/auth.ts` y
`server/firestore.ts` con el resto de la API, y con Gold todo lo de `src/lib/`, `src/context/` y `src/components/`.

## Lo que valida el endpoint

`POST /api/investors` con `Authorization: Bearer <VITE_INGEST_TOKEN>` y cuerpo `{ "investors": [ … ] }`, hasta 20
perfiles por petición; `?dryRun=1` valida sin escribir. Cada perfil se valida contra el tipo canónico, la auditoría se
fuerza a `reviewed` y lo derivado se recalcula; se rechazan los duplicados por id, nombre, LinkedIn o email contra toda
la colección, y nunca se sobreescribe nada. `npm run dev` sirve el mismo handler en `http://localhost:5173/api/investors`.
