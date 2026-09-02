# CRM inversores

App para filtrar y consultar los perfiles de inversores deep tech / dev tools hispanohablantes investigados y auditados
el 2 de septiembre de 2026 (84 perfiles: 17 indiscutibles, 34 de alto potencial, 25 en reserva, 8 descartados).

## Estructura

- `src/types/inversor.ts` — **tipo canónico** `Inversor` (esquema zod + tipo TypeScript inferido). Es la única definición:
  los scripts y la app validan contra él.
- `data/perfiles/<id>.json` — un perfil por inversor, ya normalizado y validado. `data/indice.json` — resumen para listados.
- `scripts/importar-perfiles.ts` — importa los JSON de la investigación, normaliza (listas siempre en array,
  `tipo_inversor` a enum, URL de LinkedIn separada de sus notas, `id` = slug) y valida. `npm run importar [carpeta]`.
- `scripts/subir-firestore.ts` — sube `data/` a Firestore: colección `inversores/{id}` y documento `meta/indice`. `npm run subir`.
- `src/lib/datos.ts` — capa de datos: lee de Firestore y, si no está disponible o las reglas lo bloquean, de `data/` local.
- `src/lib/filtros.ts` — filtros, orden y sincronización con la URL (los filtros se comparten por enlace).
- `src/components/` — panel de filtros, lista y ficha de detalle.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y completar con la config web de Firebase (VITE_FIREBASE_*)
npm run dev
```

Variables opcionales: `VITE_FUENTE_DATOS=local` fuerza los JSON locales; `VITE_FUENTE_DATOS=firestore` fuerza Firestore.

## Subir los datos a Firestore

`npm run subir` usa, en este orden:

1. Una service account si hay un archivo `*firebase-adminsdk*.json` o `*serviceAccount*.json` en la raíz
   (Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada). El archivo está
   ignorado por git. No depende de las reglas de seguridad.
2. Si no, el SDK web con la config de `.env`: requiere reglas de Firestore que permitan escribir.

Para que la app lea de Firestore desde el navegador, las reglas deben permitir la lectura de `meta/indice` e
`inversores/{id}` (por ejemplo, `allow read: if true;` mientras la app sea de uso interno, o autenticación).

## Niveles

- `1` Indiscutible (pureza): tesis explícita en infra de IA / dev tools / deep tech de software, cheques pre-tracción
  documentados, español documentado, activo en 2024-2026 y con capacidad de decidir.
- `2` Alto potencial: muy buen encaje con una reserva relevante.
- `r` Reserva: encaje parcial o bloqueo hoy (útiles como advisors, campeones técnicos o para rondas posteriores).
- `x` Descartado: el motivo está en `auditoria.motivo`.

Cada perfil conserva en `auditoria` la prioridad y confianza que asignó el agente investigador y las finales tras la
revisión manual, con el motivo.
