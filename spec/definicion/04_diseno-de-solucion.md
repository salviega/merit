# 04 — Diseño de la solución

> **Alcance de este documento:** diseño de producto — actores, flujos, pantallas, modelo de datos y reglas. **No define stack ni arquitectura técnica.**
> **Depende de:** [01 — Contexto y Problema](./01_contexto-y-problema.md) · [02 — Solución](./02_solucion.md)

---

## 1. Principios de diseño

1. **El dinero nunca pasa por Merit.** Merit no tiene una cuenta donde
   guarde fondos: mueve dinero de billetera a billetera con permisos
   (_grants_) que cada persona aprueba en su propio proveedor. Si una
   funcionalidad exige que Merit custodie dinero, está fuera de diseño.
2. **Cada movimiento tiene un tope que pone el dueño de la plata, no
   Merit.** El prestamista aprueba un máximo y el solicitante aprueba el
   total a pagar (préstamo + interés). El proveedor de la billetera rechaza
   cualquier cobro por encima de eso, aunque Merit se equivoque.
3. **Nada se cobra dos veces.** Cada ingreso del solicitante se descuenta
   una sola vez, y el desembolso del préstamo no cuenta como ingreso.
4. **El formulario no se habilita sin score.** El solicitante no escribe un
   monto hasta que Merit sabe cuánto le puede prestar, así nunca pide algo
   que no se le va a dar.
5. **Una acción principal por pantalla.** El home tiene dos botones, y cada
   pantalla después tiene un solo paso a seguir.

---

## 2. Actores y qué hace cada uno

| Actor | Identidad / cuenta | Qué hace |
| ----- | ------------------ | -------- |
| **Prestamista** | Su dirección de billetera Open Payments (_wallet address_). No crea cuenta en Merit. | Autoriza un cupo: un _grant_ que le permite a Merit sacar de su billetera hasta ese monto cuando haya un préstamo. Recibe los pagos automáticamente. |
| **Solicitante** | Su dirección de billetera Open Payments. No crea cuenta en Merit. | Autoriza que Merit lea el historial de pagos de su billetera, recibe un score y una oferta, toma el préstamo y autoriza el cobro automático. |
| **Merit (cliente Open Payments)** | Su propia _wallet address_ y llave de cliente, registradas en el proveedor. | Pide los grants, calcula el score, desembolsa del prestamista al solicitante y, desde el servicio de cobro, descuenta cada ingreso del solicitante para pagarle al prestamista. |

---

## 3. Modelo de datos

Los montos se guardan siempre en unidades mínimas de la moneda de la
billetera (`value` + `assetCode` + `assetScale`, como los maneja Open
Payments), nunca como decimales.

### Cupo del prestamista (`lender_grants`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `wallet_address` | URL | Billetera del prestamista. |
| `asset_code`, `asset_scale` | texto, entero | Moneda del cupo, la de su billetera. |
| `limit_amount` | entero | Cupo aprobado; es el `debitAmount` del grant. |
| `committed_amount` | entero | Lo ya desembolsado en préstamos. `limit − committed` es lo disponible. |
| `access_token`, `manage_url` | texto | Token del grant de `outgoing-payment` y URL para rotarlo. Secreto. |
| `status` | estado | Ver §6. |

### Solicitud de score (`score_requests`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `wallet_address` | URL | Billetera del solicitante. |
| `continue_url`, `continue_token`, `nonce` | texto | Para continuar el grant cuando vuelva del proveedor. |
| `score` | entero | 300–1000. Vacío hasta que se calcule. |
| `max_amount`, `rate`, `max_interest` | entero, decimal, entero | La oferta: monto máximo en su moneda, tasa y el interés máximo correspondiente. |
| `status` | estado | Ver §6. |

### Préstamo (`loans`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `score_request_id` | referencia | De qué oferta sale. |
| `lender_grant_id` | referencia | Qué cupo lo financia. Un préstamo sale de **un solo** prestamista. |
| `borrower_wallet` | URL | Billetera del solicitante. |
| `principal`, `interest`, `total_due` | entero | `total_due = principal + interest`. Es el tope del grant de cobro. |
| `repaid_amount` | entero | Lo cobrado hasta ahora. El préstamo se paga cuando llega a `total_due`. |
| `repayment_share` | decimal | Porcentaje de cada ingreso que se descuenta. |
| `disbursement_incoming_payment` | URL | El pago con que llegó el préstamo; el cobro lo ignora. |
| `disbursed_at` | fecha | Solo cuentan los ingresos posteriores. |
| `status` | estado | Ver §6. |

### Grant de cobro del solicitante (`borrower_grants`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `loan_id` | referencia | Un grant por préstamo. |
| `access_token`, `manage_url` | texto | Grant de `outgoing-payment` (tope `total_due`) más lectura de sus ingresos. Secreto. |

### Ingreso observado (`observed_incoming_payments`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `loan_id`, `incoming_payment_id` | referencia, URL | Únicos juntos. |
| `processed_amount` | entero | Hasta cuánto de su `receivedAmount` ya se descontó. Un ingreso puede recibir dinero en varias partes. |

### Cuota cobrada (`repayments`)

| Campo | Tipo | Notas |
| ----- | ---- | ----- |
| `loan_id` | referencia | |
| `source_incoming_payment` | URL | Qué ingreso la originó. |
| `amount` | entero | Lo debitado al solicitante. |
| `outgoing_payment_id` | URL | El pago real hacia el prestamista. |
| `status` | estado | `pendiente`, `pagada`, `fallida`. |

---

## 4. Flujos

### 4.1 Prestamista: poner un cupo

1. En el home, da click en **Lending**.
2. En la página de Lending escribe su _wallet address_ y el cupo, en la
   moneda de su billetera.
3. Da click en **Autorizar cupo**. Merit pide un grant de
   `outgoing-payment` con `debitAmount` igual al cupo y lo redirige a su
   proveedor.
4. En su proveedor ve el monto y aprueba.
5. Vuelve a Merit (callback). Merit continúa el grant, guarda el token y
   el cupo queda `activo`. Ve: "Tu cupo de X está disponible. El dinero no
   sale de tu billetera hasta que se preste".

### 4.2 Solicitante: score y oferta

1. En el home, da click en **Borrowing**. Se abre el widget de préstamo.
   El formulario de monto está **bloqueado**.
2. Escribe su _wallet address_ y da click en **Analizar**.
3. Merit pide un grant de lectura de su historial (`incoming-payment` y
   `outgoing-payment` con `list-all`/`read-all`) y lo redirige a su
   proveedor.
4. Aprueba en su proveedor y vuelve a Merit. El callback le pasa el control
   al backend, que lee el historial y calcula el score.
5. Mientras tanto, el widget muestra un estado de carga ("Analizando tus
   movimientos…").
6. El widget muestra el resultado: score, **monto máximo** en su moneda,
   **tasa** e **interés máximo**. El formulario se desbloquea, con el monto
   limitado a ese máximo. Si el score no alcanza, lo dice y no hay
   formulario.

### 4.3 Solicitante: tomar el préstamo

1. Elige el monto (≤ máximo) y ve el total a pagar y el porcentaje que se
   descuenta de cada ingreso.
2. Da click en **Tomar préstamo**. Merit reserva un cupo de prestamista que
   alcance, pide un grant de `outgoing-payment` sobre la billetera del
   solicitante con `debitAmount = principal + interés`, y lo redirige a su
   proveedor.
3. Aprueba en su proveedor y vuelve a Merit.
4. El callback continúa el grant, lo guarda en `borrower_grants` y
   **desembolsa**: crea un pago entrante en la billetera del solicitante,
   cotiza desde la del prestamista y crea el pago saliente con el grant del
   prestamista.
5. Ve: "Recibiste X. Se descontará el N% de cada ingreso hasta pagar Y".

### 4.4 Cobro automático (servicio de cobro, cada 5 segundos)

1. Recorre los préstamos `activos`.
2. Para cada uno, lista los pagos entrantes de la billetera del solicitante
   (`GET /incoming-payments?wallet-address=…`).
3. Por cada pago creado después del desembolso, que no sea el desembolso,
   calcula lo nuevo: `receivedAmount − processed_amount`.
4. Si hay algo nuevo, la cuota es `min(nuevo × repayment_share,
   total_due − repaid_amount)`.
5. Crea un pago entrante en la billetera del prestamista, cotiza desde la
   del solicitante por la cuota y crea el pago saliente con el grant del
   solicitante.
6. Actualiza `processed_amount` y `repaid_amount`. Si `repaid_amount`
   llega a `total_due`, el préstamo pasa a `pagado` y le devuelve el cupo
   al prestamista.

---

## 5. Pantallas

| Pantalla | Qué muestra | Acción principal |
| -------- | ----------- | ---------------- |
| **Home** | Qué es Merit, en una línea. | **Lending** o **Borrowing** (dos caminos, uno por actor). |
| **Lending** | Formulario: _wallet address_ y cupo. | **Autorizar cupo** → proveedor. |
| **Cupo activo** | Cupo, disponible y comprometido. | Volver al home. |
| **Borrowing (widget)** | _Wallet address_ y formulario de monto bloqueado. | **Analizar** → proveedor. |
| **Analizando** | Estado de carga mientras se calcula el score. | — (espera). |
| **Oferta** | Score, monto máximo, tasa, interés máximo; formulario desbloqueado. | **Tomar préstamo** → proveedor. |
| **Préstamo recibido** | Monto recibido, total a pagar, porcentaje por ingreso, lo pagado. | Volver al home. |

---

## 6. Reglas de negocio

- **El cobro nunca supera `total_due`.** Lo asegura el tope del grant en el
  proveedor del solicitante, y además Merit no crea una cuota mayor al
  saldo.
- **Un ingreso no se descuenta dos veces.** `processed_amount` por pago
  entrante es la única fuente de "qué ya se cobró".
- **El desembolso no es un ingreso.** El pago entrante del desembolso y
  todo lo anterior a `disbursed_at` quedan fuera.
- **Un préstamo no excede el disponible del cupo.** Se reserva
  (`committed_amount`) antes de desembolsar; si la cotización sale mayor al
  disponible, no se desembolsa.
- **La oferta caduca.** Un score sirve 15 minutos para tomar el préstamo;
  después hay que analizar de nuevo.
- **Un solicitante tiene a lo sumo un préstamo activo.**

**Estados del préstamo:**

| Estado | Cuándo |
| ------ | ------ |
| `pendiente_grant` | Eligió monto; está en su proveedor aprobando el cobro. Cupo reservado. |
| `desembolsando` | Grant aprobado; se está creando el pago del prestamista. |
| `activo` | El dinero llegó; el servicio de cobro lo vigila. |
| `pagado` | `repaid_amount = total_due`. Cupo devuelto. |
| `fallido` | El grant se rechazó o el desembolso falló. Reserva liberada. |

**Estados del cupo:** `pendiente` (en el proveedor) → `activo` →
`agotado` (disponible = 0) / `revocado` (el grant dejó de funcionar).

**Estados de la solicitud de score:** `pendiente_grant` → `analizando` →
`aprobado` / `rechazado` → `vencido` (pasaron 15 minutos).

---

## 7. Qué queda fuera de esta versión

- **Préstamos entre monedas distintas.** El MVP solo junta un solicitante
  con prestamistas de la misma moneda. Open Payments cotiza entre monedas,
  pero el monto máximo de la oferta tendría que estimarse con una
  cotización por cada moneda; queda para el roadmap.
- **Un préstamo financiado por varios prestamistas.** Un préstamo sale de
  un solo cupo, así cada cuota tiene un solo destino.
- **Cuentas, login y panel del prestamista.** La identidad es la _wallet
  address_ y la autorización es el grant; un panel con el historial de sus
  préstamos queda para después.
- **Mora, plazos y cobro judicial.** No hay fecha de vencimiento: se paga
  con un porcentaje de cada ingreso. Lo que pasa si nunca entra plata queda
  para después.
- **Score con datos fuera de la billetera.** Solo se usa el historial de
  Open Payments de la billetera.

---

## 8. Decisiones tomadas y pendientes

**Tomadas:**

- Identidad = _wallet address_; autorización = grant aprobado en el
  proveedor.
- Un préstamo, un prestamista, una moneda.
- Interés fijo sobre el capital (no anual), porque no hay plazo: se paga
  con un porcentaje de cada ingreso.
- El "historial" del score son los pagos entrantes y salientes de Open
  Payments de la billetera, no todo el libro contable de la cuenta.

**Pendientes:**

- Calibrar los parámetros del score y de la oferta (05 §6): umbrales, tasa
  por tramo, porcentaje por ingreso.
- Qué pasa con un cupo cuyo token ya no rota (¿se avisa al prestamista?).
- Cuánto historial mínimo hace falta para dar score, y qué se le muestra a
  quien no lo tiene.
