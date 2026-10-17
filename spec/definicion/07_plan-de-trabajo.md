# 07 — Plan de trabajo

> **Alcance de este documento:** cómo se construye lo definido en los documentos anteriores — fases, orden, verificación y recortes.
> **Depende de:** [05 — Stack y arquitectura](./05_stack-y-arquitectura.md) · [06 — Tecnologías](./06_tecnologias.md)

> **Este documento es también la traza del proyecto.** Lo que ya está hecho y verificado va ~~tachado~~. Una fase solo se tacha completa cuando su verificación pasó de verdad, no cuando el código existe.

---

## Marco

- **Dónde vive:** un solo monorepo pnpm, `merit/`, con `apps/web` (Next.js;
  la landing en Vercel y la app completa en la máquina de la demo tras un
  Cloudflare Tunnel), `apps/cron` (hoy un Express de pruebas; termina siendo el
  servicio de cobro) y `packages/core` (todavía no existe; lo crea la fase
  2). El estado vive en `data/merit.json`, un archivo JSON con lock entre
  procesos (05 §1). `apps/api/fetch_wallet.js/` es un **PoC** de lectura de historial que
  se absorbe en `packages/core` y se borra en la fase 2.
- **Punto de partida (2026-10-16):** repo con CI en pull requests, hook de
  Conventional Commits, documentos 01–06 escritos, un playground de pago
  (cotizar → aprobar → pagar) entre `apps/web` y `apps/cron`, el PoC de
  historial y el **kit de marca** (`merit-brand-kit.zip`, sin integrar:
  logos, tokens, fuentes, OG image, `metadata`/`manifest`/`robots`/`sitemap`
  listos para Next.js y el documento `09_marca-y-seo.md`). Ninguna pantalla
  de Merit, ninguna base de datos, ningún test.
- **Quiénes construyen:** dos personas, según el historial del repo
  (_confirmar_). Las fases van en serie salvo donde se marca que una persona
  puede adelantar la siguiente.
- **Fecha de cierre:** _por confirmar con la página del hackathon_. El
  calendario de abajo asume cierre el **2026-10-29**; si la fecha real es
  otra, se mueven las fechas y se aplica la sección "Orden y recortes", no
  se acorta la verificación de ninguna fase.

Cada fase termina **desplegada/demostrable y verificable**. Si el tiempo se
acaba en cualquier punto, lo que hay ya sirve.

**Reglas que atraviesan todas las fases**, no negociables por velocidad:

1. **Merit nunca cobra de más ni dos veces** (05 §5). Ningún pago saliente
   se crea sin un grant cuyo `limits.debitAmount` puso el dueño de la
   billetera, y las pruebas de `repayment.ts` listadas en el 05 §5 se
   escriben antes que el código del cobro y se ven fallar.
2. **El dinero nunca pasa por Merit** (04 §1.1). Todo desembolso y toda
   cuota van de la billetera de uno a la billetera del otro. Si una fase
   "necesita" una cuenta intermedia para avanzar, está mal planteada.
3. **Ni tokens ni la llave del cliente llegan al navegador ni al repo.** El
   navegador solo recibe URLs de redirección; la llave vive en una variable
   de entorno (`OPEN_PAYMENTS_PRIVATE_KEY`, PEM en base64); los `.env` y
   `private.key` están en `.gitignore`.
4. **Primero se prueba el proveedor, después se construye.** Lo que depende
   de un comportamiento de la red de prueba (`list-all` sobre la billetera
   de otro, duración de tokens, qué grants piden interacción) se verifica
   con una billetera real antes de escribir el código que lo asume.
5. **Un commit al día, mínimo**, en inglés, con el ritual de `AGENTS.md`
   completo. Los jueces leen el historial.

El detalle operativo —qué se corre antes de cada commit y en qué orden— vive
en el [`AGENTS.md`](../../AGENTS.md) del repositorio; el registro de cada
cambio, en el [`CHANGELOG.md`](../../CHANGELOG.md).

### Calendario

| Fase | Qué | Días | Fechas |
| ---- | --- | ---- | ------ |
| 0 | Andamiaje y compuerta `list-all` | 2 | 16–17 oct |
| 1 | Estilos y SEO: la web de Merit con sus pantallas | 2 | 18–19 oct |
| 2 | Núcleo: `packages/core`, base de datos, historial del solicitante y score | 3 | 20–22 oct |
| 3 | Cupo del prestamista, préstamo y desembolso | 2 | 23–24 oct |
| 4 | Cobro automático | 3 | 25–27 oct |
| 5 | Demo y entrega | 2 | 28–29 oct |

---

## Fase 0 — Andamiaje y compuerta `list-all`

**Objetivo:** que el repo tenga la disciplina completa y que el riesgo que
rompe el producto (05 §10, fila 1) esté resuelto antes de construir nada
que dependa de él.

- ~~Monorepo pnpm con `apps/web` (Next.js 16, Tailwind 4) y `apps/cron`
  (Express, cliente Open Payments).~~
- ~~CI en pull requests: lint, typecheck, build. Vercel despliega `apps/web`.~~
- ~~Hook `commit-msg` con Conventional Commits; `.vercelignore` deja
  `apps/cron` fuera de los despliegues.~~
- ~~Documentos 01–06 escritos y mergeados a `main`.~~
- ~~PoC de lectura de historial en `apps/api/fetch_wallet.js/server.js`:
  grant interactivo de solo lectura, listado paginado de pagos entrantes y
  salientes, CSV y revocación.~~
- **Compuerta `list-all`.** Correr el PoC con la billetera de Merit como
  cliente y una billetera de prueba **distinta** como solicitante, que tenga
  al menos tres pagos entrantes y uno saliente creados por fuera de Merit
  (desde la interfaz de la billetera de prueba o desde el playground). Con
  el grant aprobado, `GET /history` debe devolver esos pagos.
  - Si los devuelve: el score y el cobro leen el historial completo, tal
    como está en el 04 y el 05. Se anota en `spec/feedback/` qué devolvió
    el proveedor (campos, paginación, `expires_in` del token).
  - Si no los devuelve (solo lo que Merit creó, o el grant se rechaza): se
    activa el plan B del 05 §10 el mismo día y se corrige el 04 §4.2, el
    05 §6 y este documento antes de la fase 2.
- ~~Variables de entorno del 06 §8 en un `.env.example` en la raíz, y un
  `.env` (ignorado) con todas las claves para llenar; las dos apps leen el
  `.env` raíz; `OPEN_PAYMENTS_PRIVATE_KEY` reemplaza al archivo. Script
  `tunnel` para el Cloudflare Tunnel.~~
- ~~`AGENTS.md` sin `[ADAPT]`: comandos reales (`pnpm test`, `pnpm
  typecheck`, `pnpm lint`), el test crítico "repayment never exceeds
  total_due and never charges an incoming payment twice", seguridad y
  convenciones del stack. Plantilla de PR, `.gitignore` y `CHANGELOG.md`
  adaptados; `spec/feedback/01_interledger.md` creado.~~
- ~~`03_bounties.md`: decidido el 2026-10-16 que los bounties no son un
  motor del proyecto; se deja como plantilla y no se renumera.~~

**Verificación:** `pnpm lint && pnpm typecheck && pnpm build` en limpio;
`GET /history` del PoC devuelve pagos que Merit no creó, y el resultado
(sí/no) queda escrito en esta sección con fecha. **Compuerta: 2026-10-17.**

---

## Fase 1 — Estilos y SEO

**Objetivo:** que `apps/web` deje de ser el playground y sea la web de
merit: la marca del kit aplicada, las siete pantallas del 04 §5 con su
diseño final y sus estados navegables con datos de ejemplo, y una URL
pública que ya se pueda pegar en WhatsApp y se vea bien. Toda la lógica de
pagos llega después; aquí se construye lo que se ve y lo que se indexa.

La fuente de verdad de esta fase es el **kit de marca** y su documento
[`09_marca-y-seo.md`](./09_marca-y-seo.md): colores, tipografía, voz,
reglas de interfaz y SEO ya están decididos ahí. Nada de esta fase inventa
un color ni un texto.

**Integrar el kit:**

- ~~`brand/` en la raíz (logos, `tokens.json`, fuentes, `generate.py`,
  `render.js`) y `spec/definicion/09_marca-y-seo.md`.~~ Falta la parte web
  del kit: `apps/web/public/` (favicon, iconos, `og-image.png`),
  `apps/web/src/lib/site.ts` y `apps/web/src/app/` (`globals.css`,
  `layout.tsx`, `metadata.tsx`, `manifest.ts`, `robots.ts`, `sitemap.ts`).
- Añadir el `09_marca-y-seo.md` al índice de `spec/README.md` y corregir su "Depende de" (hoy
  apunta a un paquete de handoff que no existe en este repo; depende del
  [02](./02_solucion.md) y del [04](./04_diseno-de-solucion.md)).
- **Reconciliar el 09 con el 04 y el 05**, en el mismo PR, porque el kit
  se diseñó con un modelo de producto distinto en algunos puntos:
  - Score: el rango es **300–1000** (05 §6), no 300–850; las bandas del 09
    (Bajo · Regular · Bueno · Excelente) se mapean a los tramos del 05 §6.
  - Cobro: no hay "una cuota al mes, N meses" ni pool. El texto del momento
    de autorizar (09 §7) se reescribe al modelo real: "el 20 % de cada
    ingreso que recibas, hasta completar $Y; nunca más que eso".
  - Estados: los del 09 §7 se sustituyen por los del 04 §6 (préstamo,
    cupo, solicitud de score, cuota).
  - Rutas: se mantienen las del 05 §3, `/lending` y `/borrowing`; las
    rutas `/app`, `/lender/*`, `/borrower/*` y WhatsApp del 09 no existen.
  - Botones: el home usa la voz del 09, **Aportar liquidez** (Señal) y
    **Pedir préstamo** (Mérito); "Lending" y "Borrowing" quedan solo como
    etiqueta mono. Se actualiza el 04 §4 y §5 en consecuencia.
  - `site.ts` lee `APP_URL` (06 §8) con fallback a
    `VERCEL_PROJECT_PRODUCTION_URL`; no se añade `NEXT_PUBLIC_SITE_URL`.

**Estilos:**

- `globals.css` del kit reemplaza al actual: tokens `@theme` (Noche,
  Grafito, Línea, Hueso, Niebla, Mérito, Lavanda, Señal, Ámbar, Coral,
  Papel), radios y las utilidades `.wordmark` y `.num`. Tema oscuro único,
  como define el 09 §3; Papel solo para documentos.
- Fuentes con `next/font/google`: Outfit, DM Sans y JetBrains Mono como
  `--font-outfit`, `--font-dm-sans`, `--font-jetbrains-mono`. Se quita
  Geist.
- Componentes base en `src/components/`, cada uno con sus estados listados
  antes de escribirlo (09 §7): botón (primario Mérito, confirmación Señal,
  secundario, deshabilitado **con la razón escrita**, cargando), campo con
  etiqueta y error (borde Coral, texto que explica qué pasó y qué hacer),
  tarjeta Grafito, skeleton, estado vacío, mensaje de estado con prefijo
  mono `[OK]`, `[ ! ]`, `[ x ]`, anillo de score con banda, y bloque
  "Detalles" plegable para URLs completas e IDs.
- Pantallas, cada una con **una acción principal** (04 §1.5):
  - `/` landing: tesis en una línea, las cifras del 01 renderizadas en el
    servidor, y dos caminos: **Aportar liquidez** y **Pedir préstamo**.
  - `/lending`: formulario de _wallet address_ y cupo → "Enviar y
    autorizar en mi wallet"; estado "Cupo activo" (cupo, disponible,
    comprometido). Antes de redirigir, la tarjeta de autorización del 09
    §7: qué se mueve, qué va a pasar, qué no pasa, qué se puede deshacer.
  - `/borrowing`: el widget con sus estados, **bloqueado** (formulario de
    monto deshabilitado hasta tener score, 04 §1.4, con la razón escrita),
    **analizando** (skeleton, "Analizando tus movimientos…"), **oferta**
    (score con banda, monto máximo, tasa, interés máximo; formulario
    desbloqueado con el máximo como tope y el botón `Pedir $X`),
    **rechazado** (lo dice, sin formulario) y **préstamo recibido** (monto,
    total a pagar, porcentaje por ingreso, lo pagado).
  - Los estados se alimentan de datos fijos de ejemplo hasta la fase 2 y se
    eligen con un parámetro de la URL para poder mostrar cada uno.
- Números según el 09 §5: una sola función `formatAmount` desde `value` +
  `assetCode` + `assetScale` con agrupación `es-CO`, `tabular-nums` en todo
  monto, score y saldo; _wallet addresses_ abreviadas `$host/path` en mono
  con la URL completa en "Detalles".
- Accesibilidad AA: foco visible Mérito, objetivos de 44 px, nada que
  dependa solo del color. Se revisa en 390 px y 1440 px con _wallet
  addresses_ largas y montos de siete cifras.
- Se eliminan la página del playground, los SVG de ejemplo de `public/` y
  todo texto que use las palabras prohibidas del 09 §6.

**SEO:**

- `metadata.tsx` del kit como `metadata` del `layout`: `merit — Crédito que
  se gana`, plantilla `%s — merit`, descripción de `site.ts`,
  `metadataBase`, Open Graph y X con `og-image.png` 1200 × 630, iconos,
  `manifest`, `robots` indexable, canonical. `<html lang="es">`.
- `JsonLd` (`WebApplication`, `FinanceApplication`) en la landing.
- `/lending` y `/borrowing` con `privatePageRobots` (`noindex` en la meta,
  no `Disallow`): dependen del estado de la billetera y están vacías para
  un buscador. `sitemap.ts` lista `/` y `/como-funciona`.
- `/como-funciona`: una página de contenido propio con los dos flujos del
  02 y la tesis del 01, indexable. `/seguridad` queda para recortes.
- Fijar `APP_URL` al dominio de producción en Vercel antes de compartir
  enlaces (09 §10): un alias de preview pide login y rompe la tarjeta.

**Verificación:** `pnpm build` sin avisos; en el preview de Vercel del PR,
Lighthouse da **SEO 100** y **Accesibilidad ≥ 95** en `/`, `/lending` y
`/borrowing`; `view-source` de `/` muestra `<title>`, descripción,
`og:image` absoluto, canonical y el JSON-LD en el HTML inicial; `/lending`
y `/borrowing` llevan `noindex`; `/robots.txt`, `/sitemap.xml` y
`/manifest.webmanifest` responden; la URL de producción pegada en WhatsApp
y en un validador de Open Graph muestra la tarjeta; Rich Results Test sin
errores; las siete pantallas del 04 §5 se recorren con los estados de
ejemplo en 390 px y 1440 px. Captura de cada pantalla en el `CHANGELOG.md`
(convención de evidencia para cambios de UI).

---

## Fase 2 — Núcleo: `packages/core`, base de datos, historial y score

**Objetivo:** que un solicitante real de la red de prueba autorice la
lectura de su billetera y vea su score y su oferta en el widget (flujo 4.2
completo), con el cálculo probado sin red.

**`packages/core` y datos:**

- Crear `packages/core` (TypeScript unificado) con `db/`, `open-payments/`,
  `score.ts` y `repayment.ts` vacío, más Vitest con `@vitest/coverage-v8` y
  el umbral en la config, de modo que `pnpm test` falle debajo de él.
- Almacén JSON en `db/`: esquema `zod` del documento con las seis
  colecciones del 04 §3 (`lender_grants`, `score_requests`, `loans`,
  `borrower_grants`, `observed_incoming_payments`, `repayments`) y
  `withTransaction()` sobre `proper-lockfile` + `write-file-atomic`, que
  rechaza duplicar `(loan_id, incoming_payment_id)`. Tests primero: una
  escritura interrumpida no deja el archivo a medias; dos transacciones
  desde dos procesos reales no pierden ninguna escritura; el duplicado
  falla.
- `open-payments/client.ts`: cliente autenticado único para las dos apps,
  llave desde `OPEN_PAYMENTS_PRIVATE_KEY`.

**Historial del solicitante, a partir del PoC `apps/api/fetch_wallet.js`.**
El PoC ya resolvió lo difícil; se traslada tal cual a `packages/core`
y se corrige lo que lo hacía un prototipo:

| Se toma del PoC (`server.js`) | A dónde va | Qué cambia |
| ----------------------------- | ---------- | ---------- |
| Grant de solo lectura: `incoming-payment` y `outgoing-payment` con `list`, `list-all`, `read`, `read-all`, `identifier = walletAddress.id`, sin `create`; `interact.start = ['redirect']` y `finish` con `nonce` | `open-payments/history-grant.ts` → `requestHistoryGrant(wallet)` | Igual. El `finish.uri` sale de `APP_URL` + `/api/callbacks/score`. |
| `/callback`: `grant.continue` con `interact_ref` e `isFinalizedGrant` | `POST /api/callbacks/score` en `apps/web` | Antes de continuar se **verifica el `hash`** que devuelve el proveedor con el `nonce` guardado (05 §7). El estado pendiente deja de ser una variable en memoria: es la fila de `score_requests` (`continue_url`, `continue_token`, `nonce`), identificada por la cookie `httpOnly` firmada (05 §4). |
| `listAll(resource)`: paginación con `first: 100` y `cursor` hasta `hasNextPage = false` | `open-payments/history.ts` → `listHistory(wallet, token, { since })` | Se corta al llegar a pagos con `createdAt` anterior a `since` (90 días, 05 §6) en vez de leer todo; devuelve `{ incoming, outgoing }` tipados y validados con `zod`. |
| Columnas del CSV: `receivedAmount` para entrantes, `sentAmount` para salientes, `completed`, `failed` | Entradas del score | El score usa `receivedAmount` de los entrantes **completados** y `debitAmount` de los salientes **no fallidos** (05 §6), ignorando `sentAmount`. |
| `/revoke`: `token.revoke` con `manage_url` | `open-payments/tokens.ts` | Se usa para revocar el token de historial una vez calculado el score: Merit no guarda acceso de lectura que ya no necesita. |
| Express, `dotenv`, `private.key`, estado en memoria | Se eliminan | Route handlers de Next.js, variables de entorno del 06 §8, el almacén JSON. La carpeta `apps/api/` se borra en el commit que cierre esta parte. |

**Score y oferta (test primero):**

- `score.ts`: función pura `scoreFromHistory(history, repaidLoans, now)`
  con las entradas y la fórmula del 05 §6, y `offerFor(score, I,
  availableLimit)` con la tabla de tramos; los parámetros en una sola
  constante exportada. Pruebas escritas antes, y vistas fallar: billetera
  vacía → rechazado; un solo ingreso grande → `regularidad` baja;
  13 semanas con ingreso → `regularidad = 1`; salidas mayores que entradas
  → `neto = 0`; `pagados` suma 25 por préstamo con tope 100; `max_amount`
  nunca supera el mayor cupo disponible; score en [300, 1000].
- `POST /api/score`: valida la _wallet address_, crea la `score_request`
  (`pendiente_grant`), pide el grant y devuelve la URL del proveedor.
- Callback: continúa el grant, pasa a `analizando`, lee el historial de 90
  días, calcula score y oferta, revoca el token, guarda `aprobado` o
  `rechazado`, redirige a `/borrowing`.
- `GET /api/score`: estado y oferta de la solicitud de la cookie; el widget
  hace polling mientras esté `analizando` y marca `vencido` a los 15 min.
- `seed:history`: script que crea pagos entre dos billeteras de prueba
  para que una billetera recién creada tenga historial que puntuar.

**Verificación:** `pnpm test` pasa con el umbral; en el preview de Vercel,
una billetera de prueba sembrada con `seed:history` entra a `/borrowing`,
aprueba el grant en `wallet.interledger-test.dev`, vuelve, ve "Analizando…"
y luego un score ≥ 500 con monto máximo, tasa e interés; una billetera sin
historial ve "rechazado". En `data/merit.json`, la `score_request` quedó
`aprobado` y el token de historial fue revocado (un segundo `listHistory`
con él falla).

---

## Fase 3 — Cupo del prestamista, préstamo y desembolso

**Objetivo:** que un prestamista autorice un cupo y un solicitante con
oferta reciba el dinero en su billetera (flujos 4.1 y 4.3), con el dinero
yendo directo del uno al otro.

- `POST /api/lenders`: grant de `outgoing-payment` con `create, read` y
  `limits.debitAmount = cupo` sobre la billetera del prestamista, con
  `interact.finish` y `nonce`; fila `lender_grants` en `pendiente`.
  Callback `lender`: verifica `hash`, continúa, guarda `access_token` y
  `manage_url`, pasa a `activo`. La pantalla "Cupo activo" lee la fila.
- `POST /api/loans`: valida la cookie y la oferta vigente, recalcula el
  máximo en el servidor (05 §7), reserva `committed_amount` del cupo activo
  más grande en la misma moneda **en la misma transacción** que crea el
  préstamo (`pendiente_grant`), pide el grant de cobro sobre la billetera
  del solicitante (`outgoing-payment: create, read` con `limits.debitAmount
  = total_due` + `incoming-payment: list-all, read-all`) y redirige.
- Callback `loan`: continúa el grant → `borrower_grants`; `desembolsando`;
  crea el pago entrante en la billetera del solicitante, cotiza desde la del
  prestamista, reserva con el `debitAmount` de la cotización (05 §10) y
  crea el pago saliente con el token del prestamista. Guarda
  `disbursement_incoming_payment` y `disbursed_at`; `activo`. Si algo falla:
  `fallido` y la reserva se libera.
- Rotación de tokens (`open-payments/tokens.ts`): antes de usar un token,
  si venció, `POST` a `manage_url` y guardar el nuevo; si el proveedor lo
  rechaza, el cupo pasa a `revocado`.
- Un solicitante con un préstamo `activo` no puede tomar otro (04 §6).
- Se borran las rutas de pago del Express de `apps/cron` (05 §11): su único
  trabajo pasa a ser el ciclo de la fase 4.

**Verificación:** en la red de prueba, la billetera A autoriza un cupo, la
billetera B toma un préstamo dentro de su oferta y su saldo sube en el
monto exacto mientras el de A baja por el `debitAmount` de la cotización;
`committed_amount` de A refleja el préstamo; "Cupo activo" muestra el
disponible nuevo. Prueba manual del 05 §5: un pago saliente por encima del
tope del grant es rechazado por el proveedor.

---

## Fase 4 — Cobro automático

**Objetivo:** que cada ingreso del solicitante pague al prestamista una
sola vez, en la proporción acordada, sin pasarse del total, con el servicio
corriendo cada 5 segundos (flujo 4.4). Es la fase que sostiene la regla 1.

- **Tests antes del código, en `repayment.ts`**, función pura
  `dueFromIncoming(payment, observed, loan)`: los seis del 05 §5, vistos
  fallar:
  - Mismo `receivedAmount` en dos ciclos → una sola cuota.
  - Ingreso que crece en dos partes → dos cuotas por la diferencia.
  - El pago entrante del desembolso → ninguna cuota.
  - Pagos anteriores a `disbursed_at` → ninguna cuota.
  - La cuota que superaría `total_due` se recorta al saldo exacto y el
    préstamo pasa a `pagado`.
  - Dos ciclos concurrentes sobre el mismo préstamo, desde dos procesos
    reales → las mismas cuotas que uno solo (test sobre un archivo temporal
    con `withTransaction()`).
- Ciclo en `apps/cron`: cada `CRON_INTERVAL_MS` sin solapamiento; por cada
  préstamo `activo`, lista los pagos entrantes del solicitante con el
  token de `borrower_grants`, paginando solo hasta `disbursed_at`
  (reutiliza `listHistory` con `since`), y por cada ingreso nuevo abre
  **una transacción** (`withTransaction()`, bajo el lock del archivo): lee
  `processed_amount`, calcula, adelanta `processed_amount`, inserta la
  cuota `pendiente`; fuera de la transacción crea el pago entrante en la
  billetera del prestamista, cotiza desde la del solicitante y crea el pago
  saliente; marca `pagada` o `fallida`. Una cuota `fallida` se reintenta
  tal cual, nunca se recalcula.
- Al llegar `repaid_amount` a `total_due`: `pagado`, devuelve
  `committed_amount` al cupo, y el próximo score de esa billetera suma 1 en
  `pagados`.
- La pantalla "Préstamo recibido" muestra `repaid_amount` en vivo.

**Verificación:** `pnpm test` pasa con los seis tests y el umbral; con el
servicio corriendo en una máquina propia, se envía un pago de prueba a la
billetera B desde una tercera billetera y en menos de 15 s el prestamista A
recibe el 20 %; se envía el mismo pago en partes y se cobran dos cuotas
por la diferencia; al saldar, el préstamo queda `pagado` y el cupo vuelve.
Reiniciar el servicio a mitad de camino no produce cuotas repetidas.

---

## Fase 5 — Demo y entrega

**Objetivo:** que un juez pueda entender, probar y verificar Merit sin que
nadie se lo explique.

- Reemplazar `README.md` por el contenido de `PROJECT_README.template.md`:
  qué es, cómo correrlo (`.env`, `tunnel`, `dev`, `seed:history`),
  variables, cómo probar con billeteras de prueba, arquitectura (el
  diagrama del 05 §2) y los enlaces a la landing en Vercel y a la app.
- Datos de demo: billeteras A (prestamista), B (solicitante con historial
  sembrado) y C (quien le paga a B), con un guion de 3 minutos escrito en
  `spec/demo.md` y ensayado dos veces.
- Video de la demo, si el hackathon lo pide.
- Revisar `03_bounties.md`: cada requisito de cada track con su evidencia
  (enlace al código o a la pantalla).
- `spec/feedback/`: pasar en limpio lo anotado sobre la red de prueba y el
  SDK durante las fases 0–4.
- Versión al mergear a `main`, según la cadencia del `CHANGELOG.md`: minor,
  porque cierra una fase del plan.
- `08_roadmap.md` con lo del 04 §7, lo que se recortó y el paso a Postgres
  y a un hosting propio cuando la API y el cobro dejen de compartir disco.

**Verificación:** una persona ajena al equipo sigue el README en una
máquina limpia y completa el guion de la demo sin preguntar nada; el
despliegue de `main` en Vercel responde; Lighthouse SEO sigue en 100.

---

## Orden y recortes

Se corta desde atrás, en este orden:

1. Video y `08_roadmap.md` (fase 5): el README y la demo en vivo bastan.
2. Rotación automática de tokens (fase 3): en la demo los tokens duran lo
   suficiente; se documenta y se pide el grant de nuevo si vence.
3. `seed:history` como script (fase 2): se siembra a mano desde la interfaz
   de la billetera de prueba.
4. Pantalla "Cupo activo" con datos en vivo (fase 3): se muestra el estado
   del callback y se remite al home.
5. `/como-funciona` y `/seguridad` (fase 1): el kit ya trae metadata, OG,
   `manifest`, `robots` y `sitemap`, así que lo que se recorta son las
   páginas de contenido, no el SEO de la landing.
6. Estado `vencido` de la oferta a los 15 minutos (fase 2): la oferta se
   recalcula al tomar el préstamo de todos modos.

**Nunca se corta:**

- Los seis tests de `repayment.ts` y el `limits.debitAmount` en los grants
  de cupo y de cobro (regla 1, 05 §5).
- El score calculado desde el historial real leído con el grant del
  solicitante (fase 2): es el producto.
- El desembolso de billetera a billetera (fase 3): sin él no hay demo.
- Historial de commits diario, README y despliegue público (fase 5): es lo
  que el juez verifica directamente.

---

## Riesgos

| Riesgo | Se sabe el | Si se materializa |
| ------ | ---------- | -------------------- |
| El proveedor no concede `list-all` sobre pagos de la billetera de otro (05 §10) | 2026-10-17, compuerta de la fase 0 | Plan B del 05 §10: el score usa solo lo que Merit ve y el cobro escucha los pagos entrantes que Merit creó. Se corrigen 04 §4.2 y 05 §6 ese día. |
| La fecha de cierre real es anterior al 29 de octubre | Al confirmar el marco, fase 0 | Se aplica "Orden y recortes" en orden; las fases 2 y 4 no se acortan en verificación. |
| Billeteras de prueba nuevas sin historial | 2026-10-20, al empezar la fase 2 | `seed:history` o siembra manual antes de probar el score. |
| Los tokens vencen antes de usarse (`expires_in` corto) | 2026-10-17, anotado en la compuerta | Rotación con `manage_url` (fase 3); si no hay tiempo, re-pedir el grant en la demo. |
| La cotización trae comisión y el cupo no alcanza | 2026-10-24, primer desembolso real | Reservar con el `debitAmount` de la cotización, no con el principal; si aun así no alcanza, el préstamo pasa a `fallido` con mensaje claro. |
| El listado de pagos entrantes crece y el ciclo de 5 s toca límites de tasa | 2026-10-26, con el servicio corriendo horas | Paginar solo hasta `disbursed_at` y guardar el último cursor visto por préstamo. |
| Lighthouse no llega a SEO 100 por algo del hosting (headers, redirecciones) | 2026-10-19, en el preview del PR de la fase 1 | Se corrige en `next.config.ts` o en Vercel; si no es corregible, se documenta la causa en el CHANGELOG con la captura. |
| Dos personas tocando `packages/core` a la vez | Durante la fase 2 | Una persona en `score.ts`/API, la otra en `db/` y `open-payments/`; se mergea por PR pequeños cada día. |
| La demo depende de la laptop encendida y del túnel | En cada ensayo de la fase 5 | Ensayar con el túnel levantado desde cero; la landing en Vercel sigue viva aunque la app no. |
| Dos procesos escriben `data/merit.json` a la vez | 2026-10-21, test de dos procesos del almacén | Si el lock falla en macOS, se cambia a un único proceso con el ciclo dentro de Next.js (`instrumentation.ts`). |
