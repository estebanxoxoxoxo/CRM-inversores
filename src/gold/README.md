# Evaluación gold

Evalúa los inversores que ya están en `investors` contra cuatro aspectos y guarda una evaluación por inversor en una
colección aparte, `gold`. El trabajo pesado lo hace un agente de IA: este módulo sólo le arma el prompt y le abre la
puerta para escribir.

Dos piezas, nada más:

1. **El endpoint** `POST /api/gold` (`api/gold.ts`, función de Vercel desplegada con el resto del CRM): recibe las
   evaluaciones del agente, las valida y las escribe.
2. **El comando** `npm run gold:prompt`: arma el prompt del próximo lote y lo deja en el portapapeles.

## Estructura

- `types/gold.ts` — el tipo del documento `gold` (esquema zod + `validateEvaluation`). Se incrusta tal cual en el
  prompt, así que lo que lee el agente es exactamente lo que valida el endpoint.
- `types/investor.ts` — lector **permisivo** de `investors`: el digest que muestra el prompt. No es el tipo canónico
  del CRM (`src/types/investor.ts`) a propósito: aquí nunca se escribe un inversor y un campo que el CRM añada,
  renombre o quite no debe romper el comando a mitad de lote.
- `server/evaluations.ts` — la ingesta: comprueba cada evaluación contra la base y escribe en lote.
- `lib/` — lectura de `gold` y de `investors`, y el portapapeles de Node (`clipboardy`).
- `prompt-builder/` — el prompt, un término por archivo, con la misma organización que `src/prompt-builder/`.
- `scripts/prompt.ts` — el comando.

Comparte con el CRM `server/auth.ts`, `server/firestore.ts` y `scripts/lib/firestore.ts`, y las mismas ocho variables
de `.env` (`VITE_APP_URL` es la URL del despliegue, que es la que va en el prompt como endpoint). Es código de Node:
está excluido de `tsconfig.app.json` y se comprueba con `tsconfig.scripts.json`.

## `npm run gold:prompt`

1. Carga el `.env` y se conecta a Firestore (si faltan las variables de Firebase, corta con un mensaje claro).
2. Lee todos los `investors` (cada documento entero, tal como está en la base) y todos los documentos de `gold`.
3. Calcula el **remanente**: los inversores que todavía no tienen documento en `gold`, ordenados por nivel
   descendente y, a igual nivel, por nombre. El **lote** son los primeros 25 del remanente.
4. Toma como **ejemplos** los 100 documentos más recientes con veredicto `gold`.
5. Arma la lista de **excluidos**: todos los evaluados, con los dos veredictos, para que ninguno se repita.
6. Construye el prompt con el lote, los ejemplos, los excluidos, la URL del endpoint, el token y el código de
   `types/gold.ts` leído del disco.
7. Lo copia al portapapeles y resume por consola: tamaño del lote, cuántos quedan, ejemplos, excluidos y peso en KB.
   Si el portapapeles falla, escribe el prompt en un archivo temporal y dice dónde quedó.

Si el remanente está vacío, lo dice y no arma nada. Con `--out archivo.md` además escribe el prompt en ese archivo.

## Probar el endpoint en local

`npm run dev` sirve `api/gold.ts` en `http://localhost:5173/api/gold` con el mismo handler que corre en Vercel (plugin
`localApi` de `vite.config.ts`). Escribe en la base de verdad, así que usá `?dryRun=1`.

## Reglas de Firestore

La colección `gold` hay que habilitarla además de la de `investors`:

```
match /gold/{id} { allow read, write: if true; }
```

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
    "spanish": { "passes": true, "reason": "Entrevista en español en <URL>.", "sources": ["https://…"] },
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
- `hispanicFounders` es `null` en un perfil `us_hispanic`, o no lo es en cualquier otra región;
- un aspecto pasa sin ninguna URL en `sources`;
- el veredicto no coincide con los aspectos: `gold` si y sólo si pasan todos los que aplican;
- el veredicto es `gold` y no vienen exactamente 4 mails, o es `rejected` y viene alguno.

`region`, `name` y `evaluatedAt` los pone el servidor leyendo `investors/{investorId}` y el reloj: lo que mande el
agente en esos campos se ignora, así que la región no se puede falsear para esquivar el cuarto aspecto.
