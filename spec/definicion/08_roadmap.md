# 08 — Roadmap

> **Alcance de este documento:** lo que el proyecto **no** hace en esta versión y sí debería hacer después — qué, por qué, qué exige construir. **No es una promesa; es una lista ordenada de las siguientes apuestas.**
> **Depende de:** [04 — Diseño de la solución](./04_diseno-de-solucion.md) · [05 — Stack y arquitectura](./05_stack-y-arquitectura.md) · [07 — Plan de trabajo](./07_plan-de-trabajo.md)

---

## Marco

La primera versión deja limitaciones honestas, escritas en el
[04 §7](./04_diseno-de-solucion.md#7-qué-queda-fuera-de-esta-versión) y en
las decisiones del [05](./05_stack-y-arquitectura.md):

1. **La API y el cobro corren en una sola máquina**, sobre un archivo JSON
   con lock, detrás de un túnel. Fue una decisión de tiempo y de cero
   infraestructura para el hackathon, no de producto: si la laptop se apaga,
   la demo se cae.
2. **Un préstamo, un prestamista, una moneda.** No hay préstamos entre
   monedas ni financiados por varios cupos.
3. **Sin cuentas ni panel.** La identidad es la _wallet address_ y la
   autorización es el grant; el prestamista solo ve su cupo desde el
   navegador donde lo creó (cookie firmada).
4. **Sin mora ni plazos.** Se paga con un porcentaje de cada ingreso; si no
   entra plata, no pasa nada.
5. **El score solo mira la billetera**, y con parámetros de la versión 1 sin
   calibrar.
6. **Dos ventanas de inconsistencia conocidas** en el cobro y el desembolso:
   un proceso que muere entre crear el pago saliente y registrarlo podría
   repetir una cuota (acotado por el tope del grant); y `after()` deja una
   solicitud en `analyzing` o un préstamo en `disbursing` si el proceso cae
   en medio.

---

## 1. Dejar de depender de una máquina

### 1a. Postgres y un host propio

Cambiar `packages/core/db` a Postgres (Neon o similar) con `SELECT … FOR
UPDATE` en lugar del lock de archivo, y desplegar `apps/web` completo (con
`/api`) y `apps/cron` en un host con proceso vivo (Railway, Fly, una VM). El
esquema ya es un documento `zod` con las mismas colecciones; `withTransaction()`
es el único punto de escritura. Exige: migraciones, conexión compartida,
probar los tests de concurrencia contra la base. Tamaño: 2–3 días.

### 1b. Reintentos y colas

Mover el cálculo del score y el desembolso de `after()` a trabajos
persistentes que el ciclo de `apps/cron` recoge si quedaron a medias, con
idempotencia por `incoming payment` (comprobar en el proveedor si la cuota ya
se pagó antes de pagarla otra vez). Cierra la limitación 6. Tamaño: 2 días.

---

## 2. Más de un prestamista y más de una moneda

### 2a. Varios cupos por préstamo

Repartir un préstamo entre cupos y cada cuota entre sus prestamistas en
proporción. Exige: `loan_fundings` (cupo, monto), una cuota por prestamista
por ingreso, y que el tope de cada grant de cupo siga valiendo por separado.
Tamaño: 3 días.

### 2b. Préstamos entre monedas

Open Payments ya cotiza entre monedas; lo que falta es estimar la oferta en
la moneda del solicitante contra cupos en otra, con una cotización por cupo
candidato, y absorber la variación entre oferta y desembolso. Tamaño: 3–4
días, más riesgo de producto (quién asume el cambio).

---

## 3. Cuentas y panel

Login ligero (passkey o correo) que asocie varias _wallet addresses_ y un
panel para el prestamista: cupos, préstamos financiados, cuotas recibidas,
revocar desde merit. Para el solicitante: historial de préstamos y su score
en el tiempo. Tamaño: 4–5 días.

---

## 4. Riesgo y score

- Calibrar `SCORE_PARAMS` con datos reales (04 §8): umbrales, tasa por tramo,
  porcentaje por ingreso.
- Qué pasa si nunca entra plata: avisos al solicitante, un plazo máximo
  informativo, y qué ve el prestamista.
- Señales fuera de la billetera solo con consentimiento explícito; nunca
  historial bancario tradicional, que es justo lo que el solicitante no tiene.

---

## 5. Lo recortado del hackathon que sigue valiendo

- `/seguridad` como página pública (09 §8).
- Lighthouse y la tarjeta de vista previa verificados sobre cada despliegue,
  no a mano.
- `spec/feedback/01_interledger.md` reportado aguas arriba: el padding del
  `hash` y el tipo de `PaginationArgs`.

---

## Orden propuesto

| # | Qué | Desbloquea | Tamaño | Cuándo |
| - | --- | ----------- | ------ | ------ |
| 1 | Postgres y host propio (1a) | Una demo que no depende de una laptop; varias personas probando | 2–3 días | Primero, antes de cualquier usuario real |
| 2 | Reintentos y colas (1b) | Cerrar las dos ventanas de inconsistencia | 2 días | Con el anterior |
| 3 | Cuentas y panel (3) | Que el prestamista vuelva | 4–5 días | Segundo ciclo |
| 4 | Varios cupos por préstamo (2a) | Préstamos mayores que un cupo | 3 días | Segundo ciclo |
| 5 | Calibrar el score (4) | Tasas y montos defendibles | Continuo | Con datos |
| 6 | Entre monedas (2b) | Liquidez del exterior en pesos | 3–4 días | Tercer ciclo |

---

## Lo que no entra en ningún roadmap

- **merit nunca custodia dinero.** No habrá una cuenta de merit por donde
  pase un peso, ni "saldo en merit".
- **Ningún cobro sin un tope que puso el dueño de la billetera** en su propio
  proveedor. Si una funcionalidad necesita un grant sin `limits.debitAmount`,
  no se construye.
- **Ningún ingreso se descuenta dos veces**, pase lo que pase con la
  infraestructura.
- **El historial bancario tradicional no es requisito.** El producto existe
  para quien no lo tiene.
