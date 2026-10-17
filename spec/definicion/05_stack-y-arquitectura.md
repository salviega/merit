# 05 — Stack y arquitectura

> **Alcance de este documento:** cómo se construye — decisiones técnicas, arquitectura, dónde vive el estado, permisos, costos y riesgos. **No repite el diseño de producto.**
> **Depende de:** [04 — Diseño de la solución](./04_diseno-de-solucion.md)

---

## 1. Decisiones

| Decisión | Se elige | Se descarta | Por qué |
| -------- | -------- | ----------- | ------- |
| Protocolo de pagos | Open Payments sobre Interledger, con el SDK `@interledger/open-payments` | Custodiar fondos en una cuenta de Merit | Es lo que permite mover dinero entre billeteras de distintos proveedores sin que pase por Merit (04 §1.1). |
| Red de prueba | Billeteras de `wallet.interledger-test.dev` | Montar un Rafiki local | Es la red de prueba pública de Interledger, con proveedor, IdP para aprobar grants y llaves de cliente listas. |
| Dónde viven los endpoints | Route handlers de Next.js en `apps/web`, corriendo en la máquina de la demo | El Express actual de `apps/cron`; desplegar la API en Vercel | La API y el servicio de cobro comparten un archivo JSON, así que tienen que correr en la misma máquina. Vercel solo sirve la landing y el SEO. |
| URL pública de la API | Cloudflare Tunnel con nombre (hostname fijo en un dominio propio en Cloudflare) hacia `localhost:3000` | ngrok (dominio fijo del plan gratuito); túnel rápido de cloudflared (URL distinta en cada arranque) | Los callbacks de los grants necesitan una URL pública; con hostname fijo `APP_URL` se configura una vez. |
| Servicio de cobro | Proceso Node de larga duración en `apps/cron`, con un ciclo cada 5 s | Vercel Cron | Vercel Cron corre como mínimo cada minuto; el cobro cada 5 s necesita un proceso vivo. |
| Base de datos | Un archivo JSON local (`data/merit.json`) con lock entre procesos y escritura atómica | Postgres en Neon, SQLite | Todo corre en una máquina durante el hackathon y no hay servicio que mantener. El lock de archivo y la escritura atómica dan la exclusión mutua que el cobro necesita; se acepta el riesgo de que la demo dependa de esa máquina. |
| Acceso a datos | Almacén propio en `packages/core/db`: esquema `zod` del documento y `withTransaction()` sobre `proper-lockfile` + `write-file-atomic` | Un ORM | El documento entero se valida al leer y al escribir, y cada mutación ocurre bajo un lock que las dos apps respetan. |
| Lógica compartida | Paquete `packages/core`: cliente Open Payments, score, oferta, cálculo de cuotas, esquema | Duplicar en cada app | La web y el cobro usan el mismo cálculo; las funciones puras se prueban sin red. |
| Llave privada del cliente | Contenido PEM en una variable de entorno (base64) | Archivo `private.key` | En Vercel no hay archivo; el mismo formato sirve para las dos apps. |
| Moneda del préstamo | Prestamista y solicitante en la misma moneda | Cruzar monedas | Ver 04 §7. La cotización ya lo soportaría; lo que falta es estimar la oferta. |

---

## 2. Arquitectura

```
 Navegador ──► Vercel: apps/web solo landing y SEO (/, /como-funciona)
     │              └─ botones "Aportar liquidez" / "Pedir préstamo" → APP_URL
     ▼
 Cloudflare Tunnel (hostname fijo) ──► apps/web (Next.js en la máquina de la demo)
                            ├─ páginas: lending, borrowing
                            └─ /api/*: grants, callbacks, score, desembolso
                                   │              │
                                   ▼              ▼
                           data/merit.json ◄── apps/cron (proceso Node, cada 5 s)
                           (lock + escritura         │
                            atómica)                 │
                                   ▲                 │
                                   └── packages/core ┘   (las dos apps lo importan)
                                              │
                                              ▼
                     Servidores Open Payments de cada billetera
                     (auth server: grants · resource server: pagos, cotizaciones)
```

**Cómo se hablan:** el navegador habla con `apps/web` a través del túnel.
`apps/web` y `apps/cron` leen y escriben el mismo archivo JSON bajo lock y,
como el cliente Open Payments de Merit (firmando cada pedido con su llave),
hablan con los servidores de las billeteras. El proveedor de la billetera
devuelve al usuario a `apps/web` por el callback del grant, en `APP_URL`.
La misma app Next.js desplegada en Vercel no toca el archivo: sirve la
landing con la tarjeta de vista previa y enlaza a `APP_URL`.

**Qué no habla con qué:** el navegador nunca ve un token de acceso ni la
llave del cliente; solo recibe la URL del proveedor a donde redirigir.
`apps/web` y `apps/cron` no se llaman entre sí: se coordinan por el
archivo. Ninguna pieza mueve dinero sin un grant vigente del dueño de la
billetera.

---

## 3. Estructura del proyecto

```
merit/
├─ apps/
│  ├─ web/               Next.js 16: páginas + route handlers /api
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ page.tsx              landing (Aportar liquidez / Pedir préstamo)
│  │     │  ├─ como-funciona/
│  │     │  ├─ lending/              formulario y cupo activo
│  │     │  ├─ borrowing/            widget: analizar, oferta, préstamo
│  │     │  └─ api/
│  │     │     ├─ score/             POST: inicia el grant del historial; GET: estado
│  │     │     ├─ lenders/           POST: inicia el grant del cupo (fase 3)
│  │     │     ├─ loans/             POST: reserva cupo e inicia el grant de cobro (fase 3)
│  │     │     └─ callbacks/<kind>/  vuelta del proveedor (score | lender | loan)
│  │     ├─ components/              Button, Field, Card, ScoreRing, … (09 §7)
│  │     └─ lib/                     env, store, session (cookie), score-flow, site, format
│  └─ cron/              servicio de cobro: ciclo cada 5 s, sin HTTP
├─ packages/
│  └─ core/src/
│     ├─ db/             esquema zod del documento y almacén JSON con lock
│     ├─ open-payments/  cliente autenticado, grants, historial, hash, tokens
│     ├─ score.ts        historial → score y oferta (puro)
│     ├─ repayment.ts    ingresos → cuotas (puro, fase 4)
│     └─ amount.ts       aritmética en unidades mínimas (bigint)
├─ scripts/              tunnel.mjs, seed-history.ts
├─ brand/                logos, tokens, fuentes
├─ data/                 merit.json (ignorado por git)
└─ spec/
```

Es un monorepo pnpm porque las dos apps comparten el esquema, el cliente y
los cálculos; separarlos en repos duplicaría justo lo que no puede
diferir entre lo que se ofrece y lo que se cobra.

---

## 4. Dónde vive el estado

| Dato | Fuente de verdad | Cómo se lee |
| ---- | ---------------- | ----------- |
| Saldos y movimientos reales | La billetera de cada usuario, en su proveedor | Resource server de Open Payments, con un token vigente. |
| Topes de lo que Merit puede debitar | El grant, en el auth server del proveedor | No se lee: el proveedor lo hace cumplir al crear el pago saliente. |
| Cupos, préstamos, cuotas, ingresos observados | `data/merit.json` (colecciones del 04 §3) | `packages/core/db`, siempre bajo lock para escribir. |
| Tokens de acceso y URLs de rotación | `data/merit.json`, solo servidor | Nunca salen hacia el navegador ni al repo. |
| Solicitud de score en curso del navegador | Cookie `httpOnly` firmada con el id de `score_requests` | Route handlers de `apps/web`. |

---

## 5. Merit nunca cobra de más ni dos veces

El invariante: **para cada préstamo, lo debitado al solicitante nunca
supera `total_due`, y cada unidad recibida en un pago entrante se descuenta
a lo sumo una vez.**

Cómo se garantiza, de afuera hacia adentro:

1. **En el proveedor.** El grant de cobro tiene `limits.debitAmount =
   total_due`. Si Merit intentara cobrar más, el proveedor rechaza el pago
   saliente. Es la única capa que no depende del código de Merit.
2. **En el almacén, en una sola transacción por cuota:** `withTransaction()`
   toma el lock del archivo (ningún otro proceso escribe mientras tanto),
   lee `processed_amount` del pago entrante (la pareja `(loan_id,
   incoming_payment_id)` es única y el almacén rechaza duplicarla), calcula
   la cuota con `repayment.ts`, adelanta `processed_amount`, inserta la
   cuota `pendiente` y escribe el archivo de forma atómica antes de llamar
   al proveedor. Si el pago saliente falla, la cuota queda `fallida` y se
   reintenta esa misma cuota; no se recalcula desde el ingreso.
3. **El desembolso queda fuera.** El cálculo descarta el pago entrante del
   desembolso y todo lo creado antes de `disbursed_at`.

Lo mismo, del lado del prestamista: el grant del cupo tiene `debitAmount =
limit_amount`, y `committed_amount` se reserva en la misma transacción que
crea el préstamo.

**Cómo se verifica:** pruebas de `repayment.ts` y del ciclo de cobro, escritas
antes que el código:

- Un ingreso visto en dos ciclos seguidos con el mismo `receivedAmount`
  genera una sola cuota.
- Un ingreso que crece en dos partes genera dos cuotas, por la diferencia
  de cada una.
- El pago entrante del desembolso no genera cuota.
- Si la suma de cuotas llegaría a superar `total_due`, la última se recorta
  al saldo exacto y el préstamo pasa a `pagado`.
- Dos ciclos concurrentes sobre el mismo préstamo, desde dos procesos
  distintos, producen las mismas cuotas que uno solo.
- Prueba manual en la red de prueba: intentar un pago saliente por encima
  del tope del grant y ver que el proveedor lo rechaza.

---

## 6. Score y oferta

Entradas, leídas con el grant del historial (últimos 90 días,
`GET /incoming-payments` y `GET /outgoing-payments` con `wallet-address`,
paginando con `cursor`/`first`):

- `I`: ingreso mensual promedio = suma de `receivedAmount` de los pagos
  entrantes / 3.
- `regularidad`: semanas con al menos un ingreso / 13.
- `actividad`: `min(1, número de pagos entrantes / 20)`.
- `neto`: `clamp((entradas − salidas) / entradas, 0, 1)`, con las salidas
  como suma de `debitAmount` de los pagos salientes.
- `pagados`: préstamos de Merit `pagados` por esta billetera.

Score (300–1000):

```
score = 300 + 300·regularidad + 200·actividad + 200·neto + min(100, 25·pagados)
```

Oferta por tramo:

| Score | Monto máximo (sobre `I`) | Tasa (sobre el capital) |
| ----- | ------------------------ | ----------------------- |
| < 500 | rechazado | — |
| 500–649 | 20% | 8% |
| 650–799 | 35% | 6% |
| ≥ 800 | 50% | 4% |

- `max_amount = min(tramo · I, mayor disponible de un cupo activo en la
  misma moneda)`.
- `max_interest = max_amount · tasa`.
- `repayment_share` = 20% de cada ingreso para todos los tramos.

Estos números son la versión 1 y viven en una sola constante de
`packages/core`; calibrarlos es un pendiente del 04 §8.

---

## 7. Autenticación y permisos

**Superficie Open Payments** (lo que el proveedor hace cumplir):

| Grant | Lo pide | Sobre | Acceso | Interacción |
| ----- | ------- | ----- | ------ | ----------- |
| Cupo | Merit | Billetera del prestamista | `outgoing-payment: create, read`, `limits.debitAmount = cupo` | Sí, el prestamista aprueba |
| Historial | Merit | Billetera del solicitante | `incoming-payment: list-all, read-all`; `outgoing-payment: list-all, read-all` | Sí, el solicitante aprueba |
| Cobro | Merit | Billetera del solicitante | `outgoing-payment: create, read`, `limits.debitAmount = total_due`; `incoming-payment: list-all, read-all` | Sí, el solicitante aprueba |
| Pago entrante | Merit | Billetera de quien recibe | `incoming-payment: create, read` | No |
| Cotización | Merit | Billetera de quien paga | `quote: create, read` | No |

Cada grant interactivo usa `interact.finish` con un `nonce`. En el
callback se verifica el `hash` que devuelve el proveedor antes de continuar
el grant.

**Superficie de la API de `apps/web`:**

| Quién | Puede | No puede |
| ----- | ----- | -------- |
| Cualquier visitante | Iniciar un cupo o un análisis para una _wallet address_ | Nada más sin aprobar el grant en el proveedor de esa billetera. |
| Navegador con la cookie de una solicitud | Ver su estado y oferta, y tomar el préstamo dentro de la oferta | Ver otra solicitud, cambiar la tasa o pasar el máximo (se recalcula en el servidor). |
| `apps/cron` | Leer préstamos activos y crear cuotas | Nada que no esté en la base: no expone HTTP. |

---

## 8. Trabajos automáticos

| Proceso | Cada cuánto | Qué hace | Si falla |
| ------- | ----------- | -------- | -------- |
| Ciclo de cobro (`apps/cron`) | 5 s, sin solapamiento (el siguiente ciclo espera al anterior) | 04 §4.4: lista ingresos de cada préstamo activo y crea las cuotas. | El préstamo no se cobra mientras esté caído. Al volver, los ingresos pendientes siguen ahí y se cobran: no se pierde nada, solo se atrasa. |
| Rotación de tokens | Antes de usar un token vencido | `POST` a `manage_url` para rotar y guarda el nuevo token. | Si el proveedor la rechaza, el cupo pasa a `revocado` o el préstamo queda sin cobro, y se registra. |

---

## 9. Costos

| Concepto | Costo | Nota |
| -------- | ----- | ---- |
| Vercel (landing) | Gratis | Plan Hobby. |
| Cloudflare Tunnel | Gratis | Túnel con nombre; necesita un dominio en Cloudflare. |
| Red de prueba de Interledger | Gratis | Dinero de prueba. |
| API y servicio de cobro | Gratis | En el MVP corren en una máquina propia, con el archivo JSON al lado. |

---

## 10. Riesgos técnicos

| Riesgo | Qué pasa | Qué se hace |
| ------ | -------- | ----------- |
| El proveedor no concede `list-all` sobre los pagos de la billetera de otro | Sin historial no hay score, y sin leer ingresos no hay cobro: rompe el producto. | Probarlo primero, antes de construir nada más (07). Plan B: el score usa solo `list` de lo que Merit ve, y el cobro escucha los pagos entrantes que Merit mismo creó en la billetera del solicitante. |
| Billeteras de prueba nuevas sin historial | Todos los scores salen en el mínimo y la demo no muestra oferta. | Script que siembra historial con pagos entre billeteras de prueba. |
| Los tokens vencen (`expires_in`) | El cobro y el desembolso fallan con un token viejo. | Rotar con `manage_url` antes de cada uso; probar con un token de verdad vencido. |
| El listado sin filtro de fecha crece | Cada ciclo de 5 s lee más páginas y se acerca a límites de tasa. | Paginar solo hasta llegar a pagos anteriores a `disbursed_at`; guardar el último cursor visto. |
| Comisiones en la cotización | `debitAmount` sale mayor que el principal y el cupo no alcanza. | Reservar con el `debitAmount` de la cotización, no con el principal. |
| La demo depende de una máquina encendida y del túnel | Si la laptop se apaga o el túnel cae, los callbacks no llegan y el cobro se detiene. | Asumido: la demo se hace con la máquina delante. Vercel sigue sirviendo la landing. Postgres queda en el roadmap para cuando la API deje de correr en una máquina. |
| Dos procesos escriben el mismo archivo JSON | Sin exclusión mutua, una escritura pisa a la otra y se pierde una cuota o se cobra dos veces. | Todo escribe por `withTransaction()` (lock de archivo + escritura atómica) y hay un test con dos procesos reales. |
| Ingresos que no pasan por Open Payments (depósitos, recargas) | No aparecen en el listado: ni suman al score ni se cobran. | Asumido y escrito en el 04 §8; la demo usa pagos entre billeteras. |

---

## 11. Pendientes

- Dónde corren `apps/web` y `apps/cron` después del hackathon (Railway, Fly,
  una VM), y pasar el almacén a Postgres cuando dejen de compartir disco.
- ~~Mover los endpoints de `apps/cron` (Express) a `apps/web` y dejar
  `apps/cron` solo con el ciclo de cobro.~~ Hecho en la fase 3 del 07.
- Confirmar en la red de prueba qué grants piden interacción y qué duración
  tienen sus tokens.
