# 07 — Plan de trabajo

> **Alcance de este documento:** cómo se construye lo definido en los documentos anteriores — fases, orden, verificación y recortes.
> **Depende de:** [05 — Stack y arquitectura](./05_stack-y-arquitectura.md) · [06 — Tecnologías](./06_tecnologias.md)

> **Este documento es también la traza del proyecto.** Lo que ya está hecho y verificado va ~~tachado~~. Una fase solo se tacha completa cuando su verificación pasó de verdad, no cuando el código existe.

---

## Marco

- **Dónde vive:** un solo monorepo pnpm, `merit/`, con `apps/web` (Next.js;
  la landing en Vercel y la app completa en la máquina de la demo tras un
  Cloudflare Tunnel), `apps/cron` (el servicio de cobro) y `packages/core`
  (almacén, cliente Open Payments, score y cuotas). El estado vive en `data/merit.json`, un archivo JSON con lock entre
  procesos (05 §1). `apps/api/fetch_wallet.js/` era un **PoC** de lectura
  de historial; la fase 2 lo absorbió en `packages/core` y lo borró.
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
- **Compuerta `list-all`.** Con la billetera de Merit como cliente y una
  billetera de prueba **distinta** como solicitante, que tenga al menos tres
  pagos entrantes y uno saliente creados por fuera de Merit, aprobar el grant
  de lectura y comprobar que el historial vuelve con esos pagos. El PoC que
  lo hacía se absorbió en `packages/core` (fase 2), así que hoy la compuerta
  se cierra con el flujo real: `/borrowing` → **Analizar mis movimientos** →
  aprobar → la `score_request` en `data/merit.json` queda `approved` con un
  `monthlyIncome` > 0. Comprobación previa del 2026-10-17 con las
  credenciales del `.env`: las cuatro billeteras resuelven, pero el pedido de
  grant falla con `invalid signature` (la llave no corresponde al `KEY_ID`
  registrado en la billetera de Merit); hay que regenerar la llave en
  *Settings → Developer keys* y pegar `KEY_ID` y PEM juntos.
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

**Verificación:** ~~`pnpm lint && pnpm typecheck && pnpm build` en limpio
(2026-10-16).~~ El historial leído con el grant devuelve pagos que Merit no
creó, y el resultado (sí/no) queda escrito en esta sección con fecha.
**Compuerta: pendiente de credenciales válidas.**

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
  `render.js`) y `spec/definicion/09_marca-y-seo.md`.~~
- ~~La parte web del kit: `apps/web/public/` (favicon, iconos,
  `og-image.png`), `apps/web/src/lib/site.ts` y `apps/web/src/app/`
  (`globals.css`, `layout.tsx`, `metadata.tsx`, `manifest.ts`, `robots.ts`,
  `sitemap.ts`).~~
- ~~El `09_marca-y-seo.md` en el índice de `spec/README.md`, con su "Depende
  de" apuntando al 02 y al 04.~~
- ~~**Reconciliar el 09 con el 04 y el 05** (2026-10-16): score 300–1000 con
  las bandas Bajo/Regular/Bueno/Excelente; cobro como 20 % de cada ingreso,
  sin pool ni cuotas mensuales; estados del 04 §6; rutas `/lending` y
  `/borrowing`; botones **Aportar liquidez** (Señal) y **Pedir préstamo**
  (Mérito) con "Lending"/"Borrowing" solo como etiqueta, y el 04 §4–§5
  actualizado en consecuencia; `site.ts` usa `VERCEL_PROJECT_PRODUCTION_URL`
  en Vercel y `APP_URL` en la máquina de la demo, sin `NEXT_PUBLIC_SITE_URL`.~~

**Estilos:**

- ~~`globals.css` del kit: tokens `@theme`, radios, `.wordmark`, `.num`,
  `.label`, `.skeleton`. Tema oscuro único (09 §3).~~
- ~~Fuentes con `next/font/google`: Outfit, DM Sans y JetBrains Mono. Geist
  fuera.~~
- ~~Componentes en `src/components/` con sus estados en el comentario de
  cabecera: `Button` (Mérito, Señal, secundario, deshabilitado con la razón
  escrita, cargando), `Field`, `Card`, `Skeleton`, `Status` (prefijo mono),
  `ScoreRing`, `Details`, `Amount`, `WalletAddress`, `AuthorizationCard`
  (09 §7), `SiteHeader`, `SiteFooter` y `StateSwitcher`.~~
- ~~Pantallas, cada una con una acción principal (04 §1.5): `/` (landing
  con las cifras del 01 en el servidor, **Aportar liquidez** y **Pedir
  préstamo** hacia `NEXT_PUBLIC_APP_URL`), `/como-funciona`, `/lending`
  (formulario, tarjeta de autorización, autorizando, cupo activo, revocado)
  y `/borrowing` (bloqueado, analizando, oferta, rechazado, vencido,
  préstamo recibido). Los estados salen de `src/lib/examples.ts` y se eligen
  con `?state=` hasta la fase 2.~~
- ~~`formatAmount`, `formatPercent`, `abbreviateWallet` y `scoreBand` en
  `src/lib/format.ts` (09 §5), con `tabular-nums` en todo monto.~~
- ~~Playground y SVG de ejemplo eliminados.~~
- Revisar en 390 px y 1440 px con _wallet addresses_ largas y montos de
  siete cifras; foco visible y objetivos de 44 px (AA).

**SEO:**

- ~~`metadata.tsx` del kit como `metadata` del `layout`: título `merit —
  Crédito que se gana`, plantilla `%s — merit`, descripción de `site.ts`,
  `metadataBase`, Open Graph y X con `og-image.png`, iconos, `manifest`,
  `robots` indexable, canonical; `<html lang="es">`; `JsonLd`
  (`WebApplication`, `FinanceApplication`).~~
- ~~`/lending` y `/borrowing` con `privatePageRobots` (`noindex`, sin
  `Disallow`); `sitemap.ts` con `/` y `/como-funciona`.~~
- ~~`/como-funciona` como página de contenido indexable. `/seguridad` queda
  para recortes.~~
- Fijar `NEXT_PUBLIC_APP_URL` en Vercel al hostname del túnel antes de
  compartir enlaces (09 §10).

**Verificación:** ~~`pnpm build` sin avisos; el HTML inicial de `/` trae
`<title>`, descripción, `og:image` absoluto, canonical, `robots` y el
JSON-LD, con un solo `h1`; `/lending` y `/borrowing` llevan `noindex`;
`/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` y `/og-image.png`
responden (comprobado con `next start` + `curl`, 2026-10-16).~~ Pendiente
sobre el preview de Vercel del PR de la fase: Lighthouse **SEO 100** y
**Accesibilidad ≥ 95** en `/`, `/lending` y `/borrowing`; la URL pegada en
WhatsApp y en un validador de Open Graph muestra la tarjeta; Rich Results
Test sin errores; las siete pantallas recorridas con `?state=` en 390 px y
1440 px; captura de cada pantalla en el `CHANGELOG.md`.

---

## Fase 2 — Núcleo: `packages/core`, almacén JSON, historial y score

**Objetivo:** que un solicitante real de la red de prueba autorice la
lectura de su billetera y vea su score y su oferta en el widget (flujo 4.2
completo), con el cálculo probado sin red.

**`packages/core` y datos:**

- ~~Crear `packages/core` (TypeScript unificado) con `db/`, `open-payments/`,
  `score.ts` y `amount.ts`, más Vitest con `@vitest/coverage-v8` y el
  umbral (85 %) en la config, de modo que `pnpm test` falle debajo de él.~~
- ~~Almacén JSON en `db/`: esquema `zod` del documento con las seis
  colecciones del 04 §3 y `withTransaction()` sobre `proper-lockfile` +
  `write-file-atomic`, que rechaza duplicar `(loan_id,
  incoming_payment_id)`. Tests primero, vistos fallar: una transacción que
  lanza no toca el archivo; un documento inválido no se escribe; el
  duplicado falla; 25 transacciones concurrentes en un proceso y 3 × 15 en
  tres procesos reales no pierden ninguna escritura.~~

**Historial del solicitante, a partir del PoC `apps/api/fetch_wallet.js`.**
El PoC ya resolvió lo difícil; se trasladó a `packages/core` y se corrigió
lo que lo hacía un prototipo:

| Se tomó del PoC (`server.js`) | A dónde fue | Qué cambió |
| ----------------------------- | ----------- | ---------- |
| Grant de solo lectura: `incoming-payment` y `outgoing-payment` con `list`, `list-all`, `read`, `read-all`, `identifier = walletAddress.id`, sin `create`; `interact.start = ['redirect']` y `finish` con `nonce` | `open-payments/grants.ts` → `historyGrantRequest(wallet, finish)` (puro, con test) | Igual. El `finish.uri` sale de `APP_URL` + `/api/callbacks/score`. |
| `/callback`: `grant.continue` con `interact_ref` e `isFinalizedGrant` | `GET /api/callbacks/score` + `completeScoreCallback()` en `apps/web/src/lib/score-flow.ts` | Antes de continuar se **verifica el `hash`** (`open-payments/interaction.ts`: sha-256 de nonce, nonce del servidor, `interact_ref` y URL del grant). El estado pendiente es la fila de `score_requests`, identificada por la cookie `httpOnly` firmada (05 §4). |
| `listAll(resource)`: paginación con `first: 100` y `cursor` hasta `hasNextPage = false` | `open-payments/history.ts` → `listHistory(client, wallet, token, { since })` | Se corta al llegar a pagos anteriores a `since` (90 días); devuelve `{ incoming, outgoing }` tipados. Test con un cliente falso: tres páginas, corte por fecha, filtros. |
| Columnas del CSV: `receivedAmount` / `sentAmount`, `completed`, `failed` | Entradas del score | Entrantes **completados** por `receivedAmount`; salientes **no fallidos** por `debitAmount` (05 §6). |
| `/revoke`: `token.revoke` con `manage_url` | `open-payments/tokens.ts` | El token de historial se revoca al terminar el score y se borra de la fila. |
| Express, `dotenv`, `private.key`, estado en memoria | Eliminados | Route handlers de Next.js, `.env` de la raíz, el almacén JSON. ~~La carpeta `apps/api/` se borró.~~ |

**Score y oferta (test primero):**

- ~~`score.ts`: `scoreFromHistory(history, { now, repaidLoans })` y
  `offerFor(score, I, availableLimit?)` con la tabla de tramos del 05 §6 en
  `SCORE_PARAMS`. Tests vistos fallar: billetera vacía → 300; un solo ingreso
  → `regularidad` 1/13; 13 semanas → 1; salidas > entradas → `neto` 0;
  actividad tope en 20; `pagados` suma 25 con tope 100; ventana de 90 días e
  `I` = suma/3; score en [300, 1000]; tramos 20/35/50 % y 8/6/4 %; nunca más
  que el cupo disponible; sin cupo (0) → rechazado.~~
- ~~`POST /api/score`: valida la _wallet address_ (`https://…` o `$…`),
  crea la `score_request` (`pending_grant`), pide el grant y devuelve
  `{ redirect }` con la cookie firmada.~~
- ~~Callback: verifica `hash`, continúa el grant, pasa a `analyzing`,
  redirige a `/borrowing` y calcula después de responder (`after()`): lee 90
  días, score, oferta, revoca el token, guarda `approved` o `rejected`.~~
- ~~`GET /api/score`: estado y oferta de la solicitud de la cookie (nunca el
  token); marca `expired` a los 15 minutos. El widget hace polling cada 2 s
  mientras esté `pending_grant` o `analyzing`; `?state=` sigue mostrando los
  estados de ejemplo.~~
- ~~Si no hay ningún cupo activo en la moneda, la oferta se calcula solo por
  tramo y se guarda `quotaAvailable = false`; el widget lo dice en la razón
  del botón. El tope real del cupo se aplica al tomar el préstamo (fase 3).~~
- ~~`seed:history` (`scripts/seed-history.ts`): C paga N veces a B y B una
  vez a C, con un solo grant interactivo por billetera pagadora.~~

**Verificación:** ~~`pnpm test` pasa con el umbral (35 tests, cobertura
> 85 %); `pnpm typecheck`, `pnpm lint` y `pnpm build` limpios; con `next
start`, `GET /api/score` sin cookie responde `{ "status": "none" }`, un
cuerpo inválido responde 400 con el mensaje en español, y el callback sin
cookie redirige a `/borrowing?error=session` (2026-10-16).~~ **Pendiente,
necesita el `.env` con las credenciales de Merit y la billetera B
sembrada:** con el túnel arriba, B aprueba el grant en
`wallet.interledger-test.dev`, vuelve, ve "Analizando…" y luego un score ≥
500 con monto máximo, tasa e interés; una billetera sin historial ve
"rechazado"; en `data/merit.json` la `score_request` quedó `approved` sin
`accessToken`, y un segundo uso del token revocado falla. Ese mismo
recorrido cierra la compuerta `list-all` de la fase 0 y confirma el `hash`
contra un callback real.

---

## Fase 3 — Cupo del prestamista, préstamo y desembolso

**Objetivo:** que un prestamista autorice un cupo y un solicitante con
oferta reciba el dinero en su billetera (flujos 4.1 y 4.3), con el dinero
yendo directo del uno al otro.

- ~~`POST /api/lenders` + `lending-flow.ts`: grant de `outgoing-payment` con
  `create, read` y `limits.debitAmount = cupo` sobre la billetera del
  prestamista (`quotaGrantRequest`, con test), `interact.finish` y `nonce`;
  fila `lender_grants` en `pending`. Callback `lender`: verifica `hash`,
  continúa, guarda `access_token` y `manage_url`, pasa a `active`. `GET
  /api/lenders` da cupo, disponible y comprometido (nunca el token); la
  página de Lending corre el flujo real y `?state=` sigue mostrando los
  estados de ejemplo.~~
- ~~`POST /api/loans` + `loan-flow.ts`: cookie + oferta vigente, recalcula el
  máximo en el servidor con el cupo disponible ahora (05 §7), reserva
  `committed_amount` del cupo activo más grande en la misma moneda **en la
  misma transacción** que crea el préstamo (`reserveQuota`, con tests:
  elige el mayor, rechaza si ninguno alcanza, marca `exhausted`, nunca sobre
  un cupo `pending` o `revoked`), y pide el grant de cobro sobre la billetera
  del solicitante (`outgoing-payment: create, read` con `limits.debitAmount
  = total_due` + `incoming-payment: list-all, read-all`). Si el grant falla,
  el préstamo queda `failed` y la reserva se libera.~~
- ~~Callback `loan`: verifica `hash`, continúa el grant → `borrower_grants`;
  `disbursing`; responde y desembolsa después (`after()`): pago entrante en
  la billetera del solicitante, cotización desde la del prestamista,
  **reserva también la diferencia si el `debitAmount` de la cotización
  supera el principal** (05 §10) o falla, y pago saliente con el token del
  prestamista (`payQuote`). Guarda `disbursement_incoming_payment`,
  `disbursement_outgoing_payment` y `disbursed_at`; `active`. Si algo falla:
  `failed`, reserva liberada, y si el proveedor rechazó el token, el cupo
  pasa a `revoked`.~~
- ~~Rotación de tokens: `withFreshToken()` usa el token, y si el proveedor
  responde 401/403 rota una vez por `manage_url` y reintenta; el token nuevo
  se guarda. Tests: acepta, rota y reintenta, no rota ante otros errores,
  propaga una rotación rechazada.~~
- ~~Un solicitante con un préstamo `pending_grant`, `disbursing` o `active`
  no puede tomar otro (04 §6).~~
- ~~El widget muestra el préstamo: esperando autorización, enviando el
  dinero, recibido (total, pagado, falta) y pagado; un préstamo fallido
  vuelve a la oferta con el aviso.~~
- ~~`apps/cron` sin Express (05 §11): solo el ciclo cada `CRON_INTERVAL_MS`
  sin solapamiento, que hoy lee el almacén y cuenta los préstamos activos;
  la fase 4 le pone el cobro. Corre con `tsx` sobre el `.env` de la raíz.~~

**Verificación:** ~~`pnpm test` (63 tests, 97 % líneas / 89 % ramas),
`pnpm typecheck`, `pnpm lint` y `pnpm build` limpios; con `next start` y
`curl`, `GET /api/lenders` y `GET /api/loans` sin cookie responden `none`,
`POST /api/loans` sin cookie responde 401, y `POST /api/lenders` con cuerpo
inválido responde 400 (2026-10-16).~~ **Pendiente, necesita el `.env` y las
billeteras de prueba:** la billetera A autoriza un cupo, la billetera B toma
un préstamo dentro de su oferta y su saldo sube en el monto exacto mientras
el de A baja por el `debitAmount` de la cotización; `committed_amount` de A
refleja el préstamo; "Cupo activo" muestra el disponible nuevo. Prueba
manual del 05 §5: un pago saliente por encima del tope del grant es
rechazado por el proveedor.

---

## Fase 4 — Cobro automático

**Objetivo:** que cada ingreso del solicitante pague al prestamista una
sola vez, en la proporción acordada, sin pasarse del total, con el servicio
corriendo cada 5 segundos (flujo 4.4). Es la fase que sostiene la regla 1.

- ~~**Tests antes del código, en `repayment.ts`**, funciones puras
  `dueFromIncoming(payment, loan, processed)` y `planRepayment(doc, loanId,
  payment)`: los seis del 05 §5, vistos fallar (2026-10-17):~~
  - ~~Mismo `receivedAmount` en dos ciclos → una sola cuota.~~
  - ~~Ingreso que crece en dos partes → dos cuotas por la diferencia.~~
  - ~~El pago entrante del desembolso → ninguna cuota.~~
  - ~~Pagos anteriores a `disbursed_at` → ninguna cuota.~~
  - ~~La cuota que superaría `total_due` se recorta al saldo exacto, el
    préstamo pasa a `paid` y la reserva vuelve al cupo.~~
  - ~~Tres procesos reales aplicando los mismos ingresos sobre un archivo
    con `withTransaction()` → las mismas tres cuotas que uno solo.~~
- ~~Ciclo en `apps/cron` (`repay.ts`): cada `CRON_INTERVAL_MS` sin
  solapamiento; por cada préstamo `active`, primero reintenta tal cual las
  cuotas que no se asentaron (hasta 5 intentos, nunca recalculadas), luego
  lista los pagos entrantes del solicitante desde `disbursed_at` con el
  token de `borrower_grants` (`listIncomingSince`, paginando solo hasta esa
  fecha; el token se rota con `withFreshToken` y se guarda), y por cada
  ingreso abre **una transacción** (`planRepayment`: lee `processed_amount`,
  calcula, adelanta `processed_amount`, inserta la cuota `pending`); fuera
  de la transacción crea el pago entrante en la billetera del prestamista,
  cotiza desde la del solicitante y crea el pago saliente con el token del
  solicitante; marca `paid` o `failed` con el error.~~
- ~~Al llegar `repaid_amount` a `total_due`: `paid`, devuelve
  `reserved_amount` al cupo, y el próximo score de esa billetera suma 1 en
  `pagados` (ya contado en `computeScore`).~~
- ~~La pantalla "Préstamo recibido" consulta `GET /api/loans` cada 5 s y
  muestra `repaid_amount`, lo que falta y el porcentaje pagado.~~

**Verificación:** ~~`pnpm test` pasa con los seis tests y el umbral (75
tests, 96 % líneas / 91 % ramas); `pnpm typecheck`, `pnpm lint` y `pnpm
build` limpios; `apps/cron` arranca sobre el `.env` de la raíz, abre el
almacén y se detiene limpio con `SIGTERM` (2026-10-17).~~ **Pendiente, necesita el
`.env` y las billeteras de prueba:** con el servicio corriendo en una
máquina propia, se envía un pago de prueba a la billetera B desde la
billetera C y en menos de 15 s el prestamista A recibe el 20 %; se envía el
mismo pago en partes y se cobran dos cuotas por la diferencia; al saldar, el
préstamo queda `paid` y el cupo vuelve. Reiniciar el servicio a mitad de
camino no produce cuotas repetidas.

---

## Fase 5 — Demo y entrega

**Objetivo:** que un juez pueda entender, probar y verificar Merit sin que
nadie se lo explique.

- ~~Reemplazar `README.md` por el README público: qué es, cómo corre (dos
  modos: aprobar desde el mismo navegador con `APP_URL=http://localhost:3000`
  o desde otro dispositivo con el túnel), `.env`, `dev:web`, `dev:cron`,
  `seed:history`, arquitectura (el diagrama del 05 §2), evidencia (tests, un
  PR por fase, la landing en Vercel) y la seguridad en un párrafo.
  `PROJECT_README.template.md` y el README por defecto de `apps/web`
  eliminados.~~
- ~~Guion de la demo de 3 minutos en `spec/demo.md`: preparación, qué se
  muestra y se dice con A, B y C, qué no se dice (09 §6) y el plan B con
  `?state=`.~~ Ensayarlo dos veces con la red de prueba.
- Video de la demo, si el hackathon lo pide.
- ~~`03_bounties.md`: queda como plantilla (decisión del 2026-10-16).~~
- ~~`spec/feedback/01_interledger.md` en limpio: el padding del `hash`, el
  tipo `PaginationArgs` y el mensaje `invalid signature`.~~
- Versión al mergear a `main`, según la cadencia del `CHANGELOG.md`: minor,
  porque cierra una fase del plan.
- ~~`08_roadmap.md` con lo del 04 §7, las decisiones de infraestructura del
  05, las dos ventanas de inconsistencia conocidas, lo recortado, y el orden
  propuesto: Postgres y host propio primero.~~
- ~~`spec/README.md` con las decisiones tomadas y el estado real.~~

**Verificación:** una persona ajena al equipo sigue el README en una
máquina limpia y completa el guion de la demo sin preguntar nada; el
despliegue de `main` en Vercel responde; Lighthouse SEO sigue en 100.
**Pendiente:** depende del recorrido en vivo (credenciales válidas y una
billetera prestamista en la moneda del solicitante).

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
