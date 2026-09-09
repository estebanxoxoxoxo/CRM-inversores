# Evaluación gold

Evalúa los inversores que ya están en `investors` contra cuatro aspectos —etapa y deep tech para todos; español y
founders hispanos sólo para los que viven fuera de un país de habla hispana— y guarda una evaluación por inversor en una
colección aparte, `gold`. El trabajo pesado lo hace un agente de IA: este módulo sólo le arma el prompt y le abre la
puerta para escribir. En la app, la sección Gold navega por las evaluaciones.

Tres piezas:

1. **El botón "Evaluar más perfiles"** (cabecera de la sección Gold): arma el prompt del próximo lote y lo copia al
   portapapeles, igual que "Buscar más perfiles" en Bronce.
2. **El endpoint** `POST /api/gold` (`api/gold.ts`, función de Vercel desplegada con el resto del CRM): recibe las
   evaluaciones del agente, las valida y las escribe.
3. **El backup** de `gold`: el botón "Hacer backup" de la sección Gold y `npm run backup -- --collection gold`.

## Estructura

- `types/gold.ts` — el tipo del documento `gold` (esquema zod + `validateEvaluation`). Se incrusta tal cual en el
  prompt (`prompt-builder/inputs/type-source.ts`, vía `?raw` de Vite), así que lo que lee el agente es exactamente lo
  que valida el endpoint.
- `server/evaluations.ts` — la ingesta: comprueba cada evaluación contra la base y escribe en lote.
- `lib/gold.ts` — qué está evaluado (las exclusiones) y qué sirve de ejemplo.
- `prompt-builder/` — el prompt, un término por archivo, con la misma organización que `src/bronze/prompt-builder/`. Sus
  entradas: la cantidad (diálogo), la URL del despliegue y el token (los mismos del prompt de búsqueda, de
  `import.meta.env`), el tipo y la fecha. Los inversores y las evaluaciones salen de las suscripciones vivas de la app.

Es código de navegador salvo `server/evaluations.ts`, que corre en la función de Vercel; comparte `server/auth.ts` y
`server/firestore.ts` con el resto de la API.

## El botón "Evaluar más perfiles"

1. Calcula el **remanente**: los inversores que todavía no tienen documento en `gold`, en el orden de la app (nivel
   descendente y, a igual nivel, por nombre). El **lote** son los primeros N del remanente; N lo pide el diálogo
   (25 por defecto, 100 como máximo, que es lo que acepta una petición).
2. Toma como **ejemplos** los 100 documentos más recientes con veredicto `gold`.
3. Arma la lista de **excluidos**: todos los evaluados, con los dos veredictos, para que ninguno se repita.
4. Construye el prompt con el lote, los ejemplos, los excluidos, la URL del endpoint, el token y el código de
   `types/gold.ts`, lo copia y resume: perfiles del lote, tamaño, ejemplos, excluidos y cuántos quedan.

Si no queda ningún inversor sin evaluar, el botón se desactiva y lo dice.

## Probar el endpoint en local

`npm run dev` sirve `api/gold.ts` en `http://localhost:5173/api/gold` con el mismo handler que corre en Vercel (plugin
`localApi` de `vite.config.ts`). Escribe en la base de verdad, así que usá `?dryRun=1`.

## Reglas de Firestore

La colección `gold` hay que habilitarla además de la de `investors`:

```
match /gold/{id} { allow read, write: if true; }
```

Los backups van a `backups/gold/<fecha>.json` en el bucket de Storage, bajo la misma regla `backups/**`.

## El documento `gold`

Uno por inversor, con el `id` del inversor como id del documento:

```json
{
  "investorId": "mar-hershenson",
  "name": "Mar Hershenson",
  "region": "us_hispanic",
  "verdict": "gold",
  "aspects": {
    "stage": { "passes": true, "reason": "Lideró la pre-seed de X en 2024, según <URL>.", "sources": ["https://…"] },
    "deepTech": { "passes": true, "reason": "Invirtió en X e Y, ambas infraestructura de IA, según <URL>.", "sources": ["https://…"] },
    "spanish": { "passes": true, "reason": "Entrevista en español en <URL>.", "sources": ["https://…"] },   // null fuera de EE. UU.
    "hispanicFounders": { "passes": true, "reason": "Invirtió en Z, con fundadores argentinos, según <URL>.", "sources": ["https://…"] }
  },
  "emails": [{ "subject": "…", "body": "…", "basedOn": "Artículo <URL>, frase citada" }],
  "evaluatedAt": "2026-09-06T10:00:00.000Z"
}
```

## Lo que valida el endpoint

`POST /api/gold` con `Authorization: Bearer <VITE_INGEST_TOKEN>` y cuerpo `{ "evaluations": [ … ] }` (hasta 100 por
petición; `?dryRun=1` valida sin escribir). Responde
`{ dryRun, created: [{ investorId, verdict }], invalid: [{ investorId, reason }] }`. Una evaluación entra en `invalid`
—que no tiene nada que ver con el veredicto `rejected`, que sí se guarda— cuando:

- el `investorId` no existe en `investors`, ya tiene documento en `gold`, o se repite dentro de la misma petición;
- el documento no valida contra `EvaluationSchema` (`reason` de hasta 400 caracteres, `sources` con URL reales,
  asunto de hasta 100 y cuerpo de hasta 900 caracteres);
- `spanish` o `hispanicFounders` son `null` en un perfil de `us_hispanic` u `out_of_region`, o no lo son en `spain`, `mexico` o `spanish_speaking`;
- un aspecto pasa sin ninguna URL en `sources`;
- el veredicto no coincide con los aspectos: `gold` si y sólo si pasan todos los que aplican;
- el veredicto es `gold` y no vienen exactamente 4 mails, o es `rejected` y viene alguno.

`region`, `name` y `evaluatedAt` los pone el servidor leyendo `investors/{investorId}` y el reloj: lo que mande el
agente en esos campos se ignora, así que la región no se puede falsear para esquivar los dos aspectos que dependen de ella.

La región manda desde `investors`: la evaluación guarda la que tenía al escribirse, así que reclasificar a un inversor
la deja desfasada en su documento de `gold`. La app y el prompt leen siempre la del inversor, pero conviene
sincronizar el documento cuando se reclasifica.
