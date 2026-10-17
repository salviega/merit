# 01 — Feedback: Interledger Foundation (Open Payments)

> **Alcance de este documento:** bitácora viva de lo que Interledger documenta o promete sobre Open Payments —el estándar, el SDK `@interledger/open-payments` y la red de prueba `wallet.interledger-test.dev`—, frente a lo que encontramos al construir. Se actualiza el día que algo aparece, no al final.
> **Depende de:** [05 — Stack y arquitectura](../definicion/05_stack-y-arquitectura.md) · [07 — Plan de trabajo](../definicion/07_plan-de-trabajo.md)

Stack en uso: `@interledger/open-payments` 7.4.0 (Node 22); billeteras y
llave de cliente en `wallet.interledger-test.dev`.

---

## Lo que funcionó bien

_Se llena mientras se construye._

---

## Bitácora

Pendiente la **compuerta `list-all`** de la fase 0 del
[07](../definicion/07_plan-de-trabajo.md): si el proveedor de prueba
devuelve, con un grant interactivo de solo lectura, los pagos de una
billetera que Merit no creó. Se anota el resultado, qué campos vinieron en
cada pago, cómo paginó y el `expires_in` del token.

### 2026-10-16 — El `hash` del callback: "sin padding" en la guía, con padding en Rafiki

**Documentado / prometido:** la guía de verificación del hash
(`openpayments.dev/identity/hash-verification/`) dice que el digest SHA-256
se codifica "using Base64 with no padding"; su propio ejemplo de código usa
`digest('base64')`, que en Node sí lleva padding.

**Encontrado:** el servidor de autorización de Rafiki (`packages/auth/src/
interaction/routes.ts`, `handleFinishableGrant`) calcula
`sha-256(clientNonce\ninteractNonce\ninteractRef\ngrantRequestUrl)` y lo
emite con `digest('base64')`, es decir, **con** padding y alfabeto estándar.
La guía y la implementación de referencia no coinciden en el detalle que
decide si la comparación pasa.

**Evidencia:** `packages/core/src/open-payments/interaction.ts` normaliza
padding y alfabeto url-safe antes de comparar, y
`interaction.test.ts` fija el cálculo. Falta confirmarlo contra un callback
real de la red de prueba (fase 2 del 07).

**Impacto en el proyecto:** ninguno en tiempo, pero una implementación
literal de la guía ("sin padding") rechazaría todos los callbacks del
proveedor de prueba.

**Reportado:** pendiente.

### 2026-10-17 — `invalid signature` no dice qué llave ni qué billetera

**Documentado / prometido:** el cliente autenticado firma cada pedido con
la llave privada y el `keyId` registrados en la billetera del cliente; el
error de firma debería permitir saber cuál de los dos no coincide.

**Encontrado:** con una llave PEM válida (Ed25519, PKCS#8) y un `KEY_ID`
que no le corresponde, `client.grant.request()` falla con `Error making
Open Payments POST request` y `description: "invalid signature"`, sin decir
qué `keyId` se buscó, en qué billetera, ni si el JWKS se pudo leer. Las
lecturas públicas (`walletAddress.get`) funcionan igual, así que el fallo
solo aparece al primer `POST`.

**Evidencia:** comprobación de solo lectura del 2026-10-17 desde la raíz
del repo con las credenciales del `.env` (billetera de Merit
`https://ilp.interledger-test.dev/e1f3ab6d`).

**Impacto en el proyecto:** media hora para descartar la codificación
base64 del PEM antes de concluir que el `KEY_ID` no corresponde. Una nota
para la guía de errores del SDK.

**Reportado:** pendiente.

### 2026-10-16 — `PaginationArgs` exige `wallet-address` aunque `list()` ya lo recibe

**Documentado / prometido:** `client.incomingPayment.list(args, pagination)`
recibe `walletAddress` en `args`; el PoC en JavaScript paginaba con
`{ first, cursor }` sin problema.

**Encontrado:** en TypeScript, `PaginationArgs` (`ForwardPagination`) hace
obligatorio `"wallet-address"` también en el segundo argumento, así que
`{ first: 100 }` no compila (`TS2345`). Hay que repetir la dirección.

**Evidencia:** `@interledger/open-payments@7.4.0`, `dist/types.d.ts`
líneas 28–35; `packages/core/src/open-payments/history.ts` (`Pagination`).

**Impacto en el proyecto:** diez minutos. Una nota, no un hallazgo.

**Reportado:** pendiente.

<!--
### AAAA-MM-DD — Título corto del hallazgo

**Documentado / prometido:** qué dice el README, la guía o el tipo de la SDK.

**Encontrado:** qué pasó de verdad.

**Evidencia:** archivo:línea, comando exacto, mensaje de error completo.

**Impacto en el proyecto:** ¿cambió una decisión? ¿costó horas? ¿fue una
sorpresa sin consecuencia?

**Reportado:** enlace al issue/PR si se abrió, o "pendiente".
-->

---

## Resumen

| # | Área | Se documentaba | Se encontró | Severidad | Reportado |
| - | ---- | --------------- | ----------- | --------- | --------- |
| — | —    | —                | —           | —         | —         |

## Reportes abiertos

- [ ] —
