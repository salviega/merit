# 05 — Stack y arquitectura

> **Alcance de este documento:** cómo se construye — decisiones técnicas, arquitectura, dónde vive el estado, permisos, costos y riesgos. **No repite el diseño de producto.**
> **Depende de:** [04 — Diseño de la solución](./04_diseno-de-solucion.md)

---

## 1. Decisiones

| Decisión | Se elige | Se descarta | Por qué |
| -------- | -------- | ----------- | ------- |
| Protocolo de pagos | Open Payments sobre Interledger, con el SDK `@interledger/open-payments` | Custodiar fondos en una cuenta de Merit | Es lo que permite mover dinero entre billeteras de distintos proveedores sin que pase por Merit (04 §1.1). |
| Red de prueba | Billeteras de `wallet.interledger-test.dev` | Montar un Rafiki local | Es la red de prueba pública de Interledger, con proveedor, IdP para aprobar grants y llaves de cliente listas. |
| Dónde viven los endpoints | Route handlers de Next.js en `apps/web` | El Express actual de `apps/cron` | Los callbacks de los grants necesitan una URL pública y estable; Vercel la da con el despliegue de la web, sin otro servicio que mantener. |
| Servicio de cobro | Proceso Node de larga duración en `apps/cron`, con un ciclo cada 5 s | Vercel Cron | Vercel Cron corre como mínimo cada minuto; el cobro cada 5 s necesita un proceso vivo. |
| Base de datos | Postgres en Neon (Vercel Marketplace) | SQLite, KV | La comparten la web (en Vercel) y el servicio de cobro (fuera de Vercel), y el cobro necesita transacciones y restricciones `UNIQUE` para no cobrar dos veces. |
| Acceso a datos | Drizzle ORM + drizzle-kit | Prisma, SQL a mano | Esquema en TypeScript compartido entre las dos apps, sin motor binario. |
| Lógica compartida | Paquete `packages/core`: cliente Open Payments, score, oferta, cálculo de cuotas, esquema | Duplicar en cada app | La web y el cobro usan el mismo cálculo; las funciones puras se prueban sin red. |
| Llave privada del cliente | Contenido PEM en una variable de entorno (base64) | Archivo `private.key` | En Vercel no hay archivo; el mismo formato sirve para las dos apps. |
| Moneda del préstamo | Prestamista y solicitante en la misma moneda | Cruzar monedas | Ver 04 §7. La cotización ya lo soportaría; lo que falta es estimar la oferta. |

---

## 2. Arquitectura

```
 Navegador ──► apps/web (Next.js en Vercel)
                 ├─ páginas: home, lending, borrowing
                 └─ /api/*: grants, callbacks, score, desembolso
                        │              │
                        ▼              ▼
                   Postgres (Neon) ◄── apps/cron (proceso Node, cada 5 s)
                        ▲                    │
                        │                    │
                        └─── packages/core ──┘   (las dos apps lo importan)
                                   │
                                   ▼
          Servidores Open Payments de cada billetera
          (auth server: grants · resource server: pagos, cotizaciones)
```

**Cómo se hablan:** el navegador solo habla con `apps/web`. `apps/web` y
`apps/cron` hablan con Postgres y, como el cliente Open Payments de Merit
(firmando cada pedido con su llave), con los servidores de las billeteras.
El proveedor de la billetera devuelve al usuario a `apps/web` por el
callback del grant.

**Qué no habla con qué:** el navegador nunca ve un token de acceso ni la
llave del cliente; solo recibe la URL del proveedor a donde redirigir.
`apps/web` y `apps/cron` no se llaman entre sí: se coordinan por la base de
datos. Ninguna pieza mueve dinero sin un grant vigente del dueño de la
billetera.

---

## 3. Estructura del proyecto

```
merit/
├─ apps/
│  ├─ web/               Next.js 16: páginas + route handlers /api
│  │  └─ src/app/
│  │     ├─ page.tsx                 home (Lending / Borrowing)
│  │     ├─ lending/                 formulario y cupo activo
│  │     ├─ borrowing/               widget: analizar, oferta, préstamo
│  │     └─ api/
│  │        ├─ lenders/              POST: inicia el grant del cupo
│  │        ├─ score/                POST: inicia el grant del historial; GET: estado
│  │        ├─ loans/                POST: reserva cupo e inicia el grant de cobro
│  │        └─ callbacks/[kind]/     vuelta del proveedor (lender | score | loan)
│  └─ cron/              servicio de cobro: ciclo cada 5 s, sin HTTP
├─ packages/
│  └─ core/
│     ├─ db/             esquema Drizzle y migraciones
│     ├─ open-payments/  cliente autenticado, grants, rotación de tokens
│     ├─ score.ts        historial → score y oferta (puro)
│     └─ repayment.ts    ingresos → cuotas (puro)
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
| Cupos, préstamos, cuotas, ingresos observados | Postgres (tablas del 04 §3) | Drizzle desde `packages/core`. |
| Tokens de acceso y URLs de rotación | Postgres, solo servidor | Nunca salen hacia el navegador. |
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
2. **En la base de datos, en una sola transacción por cuota:** se bloquea
   la fila del préstamo (`SELECT … FOR UPDATE`), se lee `processed_amount`
   del pago entrante (fila `UNIQUE (loan_id, incoming_payment_id)`), se
   calcula la cuota con `repayment.ts`, se adelanta `processed_amount` y se
   inserta la cuota `pendiente` antes de llamar al proveedor. Si el pago
   saliente falla, la cuota queda `fallida` y se reintenta esa misma
   cuota; no se recalcula desde el ingreso.
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
- Dos ciclos concurrentes sobre el mismo préstamo producen las mismas
  cuotas que uno solo.
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
| Vercel (web + API) | Gratis | Plan Hobby. |
| Neon Postgres | Gratis | Plan gratuito del Marketplace; alcanza para la demo. |
| Red de prueba de Interledger | Gratis | Dinero de prueba. |
| Servicio de cobro | Gratis | En el MVP corre a mano en una máquina propia. |

---

## 10. Riesgos técnicos

| Riesgo | Qué pasa | Qué se hace |
| ------ | -------- | ----------- |
| El proveedor no concede `list-all` sobre los pagos de la billetera de otro | Sin historial no hay score, y sin leer ingresos no hay cobro: rompe el producto. | Probarlo primero, antes de construir nada más (07). Plan B: el score usa solo `list` de lo que Merit ve, y el cobro escucha los pagos entrantes que Merit mismo creó en la billetera del solicitante. |
| Billeteras de prueba nuevas sin historial | Todos los scores salen en el mínimo y la demo no muestra oferta. | Script que siembra historial con pagos entre billeteras de prueba. |
| Los tokens vencen (`expires_in`) | El cobro y el desembolso fallan con un token viejo. | Rotar con `manage_url` antes de cada uso; probar con un token de verdad vencido. |
| El listado sin filtro de fecha crece | Cada ciclo de 5 s lee más páginas y se acerca a límites de tasa. | Paginar solo hasta llegar a pagos anteriores a `disbursed_at`; guardar el último cursor visto. |
| Comisiones en la cotización | `debitAmount` sale mayor que el principal y el cupo no alcanza. | Reservar con el `debitAmount` de la cotización, no con el principal. |
| Ingresos que no pasan por Open Payments (depósitos, recargas) | No aparecen en el listado: ni suman al score ni se cobran. | Asumido y escrito en el 04 §8; la demo usa pagos entre billeteras. |

---

## 11. Pendientes

- Dónde corre `apps/cron` después del hackathon (Railway, Fly, una VM).
- Mover los endpoints de `apps/cron` (Express) a `apps/web` y dejar
  `apps/cron` solo con el ciclo de cobro.
- Confirmar en la red de prueba qué grants piden interacción y qué duración
  tienen sus tokens.
