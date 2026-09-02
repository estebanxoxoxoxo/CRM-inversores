# CRM inversores

App para filtrar y consultar los perfiles de inversores deep tech / dev tools hispanohablantes investigados y auditados
(84 perfiles, auditoría v2 del 2 de septiembre de 2026 con puntuación 0-100).

## Estructura

- `src/types/inversor.ts` — **tipo canónico** `Inversor` (esquema zod + tipo TypeScript inferido). Única definición:
  scripts y app validan contra él.
- `data/perfiles/<id>.json` — un perfil por inversor, normalizado, auditado y validado. `data/indice.json` — resumen para listados.
- `data/auditoria_v2/lote*.json` — decisiones de la auditoría por perfil: desglose de puntuación, motivo y los tres
  campos de síntesis en puntos (`por_que`, `tesis`, `etapa_y_ticket`). Editar aquí y correr `npm run auditar`.
- `scripts/importar-perfiles.ts` — importa los JSON de la investigación original, normaliza y aplica la auditoría v2. `npm run importar [carpeta]`.
- `scripts/aplicar-auditoria-v2.ts` — re-aplica la auditoría sobre `data/perfiles` y regenera el índice. `npm run auditar`.
- `scripts/subir-firestore.ts` — sube `data/` a Firestore (`inversores/{id}` y `meta/indice`). `npm run subir`.
- `src/lib/datos.ts` — lee de Firestore y, si no está disponible o las reglas lo bloquean, de `data/` local.
- `src/lib/filtros.ts` — filtros, orden y sincronización con la URL (los filtros se comparten por enlace).

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar con la config web de Firebase (VITE_FIREBASE_*)
npm run dev
```

`VITE_FUENTE_DATOS=local` fuerza los JSON locales; `VITE_FUENTE_DATOS=firestore` fuerza Firestore.

## Subir los datos a Firestore

`npm run subir` usa, en este orden: (1) una service account si hay un archivo `*firebase-adminsdk*.json` o
`*serviceAccount*.json` en la raíz (ignorado por git; no depende de las reglas); (2) el SDK web con `.env`, que requiere
reglas de Firestore que permitan escribir. Para que la app lea desde el navegador, las reglas deben permitir la lectura
de `meta/indice` e `inversores/{id}`.

## Nivel (0-100) y bandas

Cada perfil tiene un `nivel` de 0 a 100 asignado en revisión manual con esta rúbrica (`auditoria.puntuacion`):

| Dimensión | Máx. | Qué mide |
|---|---|---|
| Tesis y encaje temático | 25 | Infra de IA / dev tools / deep tech de software, con prueba en cartera |
| Etapa y pre-tracción | 20 | Primer cheque sin tracción, lidera; penaliza Serie A y exigencia de métricas |
| Capacidad de decidir y capital | 20 | GP con fondo vigente y ticket adecuado; penaliza venture partners, associates y fondos sin cerrar |
| Español y cercanía | 15 | Documentado nativo 15; origen documentado sin fluidez confirmada 8-10; sólo herencia 3-5; sin evidencia 0-2 |
| Acceso y actividad | 15 | Activo 2025-26, vía de contacto pública, cadencia |
| Ajuste | -15 / +5 | Conflictos de cartera, filtros geográficos duros, redundancia con otro contacto del mismo fondo |

Topes que encajan la pureza: tesis < 6 → máximo 45; tesis < 10 → máximo 55; sin capacidad de firmar cheque
(decisión ≤ 8) → máximo 69; Serie A o exigencia de tracción (etapa ≤ 7) → máximo 64.

Bandas derivadas del nivel: **Indiscutible** ≥ 78 · **Alto potencial** 60-77 · **Reserva** 45-59 · **Descartado** < 45.
`prioridad` (A/B/C) se deriva del nivel; `confianza` califica las fuentes, no el encaje. La auditoría v1 (niveles 1/2/r/x)
se conserva en `auditoria.nivel_v1`, `prioridad_v1` y `motivo_v1`; los textos largos originales en `textos_v1`.

Regla de origen: sólo autoidentificación pública o hechos biográficos documentados; nunca inferencia por apellido.
Emails: sólo de fuentes públicas, con `email_estado` explícito; ninguna dirección inventada.
