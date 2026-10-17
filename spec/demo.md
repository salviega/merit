# Guion de la demo (3 minutos)

> **Alcance:** qué se muestra, en qué orden y qué se dice, con tres
> billeteras de la red de prueba. Se ensaya dos veces antes de la entrega
> (07, fase 5). Si la red de prueba falla en vivo, cada pantalla se muestra
> con `?state=` (sección "Plan B").

## Antes de empezar (10 minutos antes)

1. `.env` lleno: credenciales de merit, `SESSION_SECRET`, `APP_URL`, y las
   tres billeteras: **A** prestamista (`SEED_LENDER_WALLET`), **B**
   solicitante (`SEED_BORROWER_WALLET`), **C** quien le paga a B
   (`SEED_PAYER_WALLET`). B y C tienen que ser billeteras **distintas**.
2. Tres terminales: `pnpm dev:web`, `pnpm dev:cron`, y si se aprueba desde
   otro dispositivo, `pnpm tunnel` (con `APP_URL` apuntando al túnel).
3. B con historial: `pnpm seed:history` (seis pagos de C a B, uno de B a C;
   dos aprobaciones en la billetera de prueba).
4. Sesión abierta en `wallet.interledger-test.dev` con acceso a A, B y C.
5. `data/merit.json` limpio o conocido; la landing en Vercel cargada en otra
   pestaña para la tarjeta de vista previa.

## El guion

**0:00 — La tesis (landing).** "En Colombia casi todos tienen cuenta, pocos
tienen crédito, y uno de cada cinco lo busca por fuera. merit conecta el
dinero disponible con quien no tiene historial, de billetera a billetera,
sin que el dinero pase por nosotros." Mostrar los dos botones.

**0:30 — El prestamista (A).** Click en **Aportar liquidez**. Escribir la
wallet de A y un cupo. Señalar la tarjeta de autorización: qué se mueve, qué
no pasa, qué se puede deshacer. **Enviar y autorizar en mi wallet** → en el
proveedor se ve el tope exacto → aprobar → vuelve a "Cupo activo": cupo,
disponible, comprometido. "El dinero sigue en su billetera."

**1:15 — El solicitante (B).** Click en **Pedir préstamo**. El formulario de
monto está bloqueado y dice por qué. Escribir la wallet de B →
**Analizar mis movimientos** → en el proveedor se ve que es solo lectura →
aprobar → "Analizando…" → score con banda, cupo, interés. "Solo con los
movimientos de su billetera. El permiso de lectura ya se revocó."

**1:50 — El préstamo.** Escribir un monto dentro del cupo. Se ve el total a
pagar y el 20 % de cada ingreso. **Pedir $X** → en el proveedor se ve el tope
igual al total a pagar → aprobar → "Enviando el dinero…" → "El dinero está
en tu wallet". Mostrar en la billetera de B que llegó y en "Cupo activo" de A
que el comprometido subió.

**2:30 — El cobro automático.** Desde C, enviar un pago a B desde la interfaz
de la billetera de prueba. En menos de 15 segundos, en la pantalla de B sube
"Pagado" y en la terminal del servicio aparece la cuota. "Paga cuando le
entra plata, en proporción, y nunca más que el total que autorizó: ese tope
lo hace cumplir su proveedor, no nosotros."

**2:55 — Cierre.** "Cada préstamo pagado sube el score y abre montos
mayores. Todo el código y la especificación están en el repo, con un PR por
fase."

## Qué no decir

- "Transacción", "grant", "payment pointer", "débito recurrente": se habla
  como el 09 §6 (wallet address, autorizar en mi wallet, cuota pagada,
  cobro automático).
- Montos con decimales ni jerga del protocolo en pantalla: lo técnico está
  detrás de "Detalles".

## Plan B

Si la red de prueba no responde, cada pantalla se recorre con datos de
ejemplo: `/lending?state=form|authorizing|active|revoked` y
`/borrowing?state=locked|analyzing|offer|rejected|expired|active`. Los
estados son los mismos del 04 §6; se dice que son datos de ejemplo.

## Después de la demo

Las URLs de los pagos y grants reales de la red de prueba van al
`CHANGELOG.md` (su cabecera fija la convención) y, si algo sorprendió del
proveedor, a `spec/feedback/01_interledger.md`.
