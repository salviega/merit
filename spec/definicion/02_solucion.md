# 02 — Solución

> **Alcance de este documento:** qué es el proyecto y qué obtiene cada actor. **No define pantallas ni stack.**
> **Depende de:** [01 — Contexto y Problema](./01_contexto-y-problema.md)

---

## Qué es

Merit es una plataforma de microcrédito: personas y entidades financieras
ponen cupos de liquidez, y Merit los presta a quienes lo necesitan, con
desembolso y cobro automáticos de billetera a billetera.

Es el canal que conecta el dinero disponible con quien necesita crédito.
Hay dos actores: el **prestamista**, una persona o entidad que pone un cupo,
y el **solicitante**, que pide un préstamo sin tener historial bancario.
Para el solicitante, la alternativa hoy es el crédito no regulado. Para el
prestamista, no prestar. Todo funciona sobre Interledger y Open Payments,
entre billeteras de distintos proveedores y sin que el dinero pase por una
cuenta de Merit.

## Cómo funciona

### Para el prestamista

Autoriza un cupo desde su billetera, desde cualquier país y en cualquier
moneda. El dinero no sale de su cuenta hasta que se presta. Cuando se
presta, recupera lo prestado a medida que el solicitante paga, sin tener
que cobrarle él mismo.

### Para el solicitante

Pide un préstamo sin necesitar historial bancario. Merit analiza los
movimientos de su billetera, genera un score y, si lo aprueba, el dinero
llega de inmediato.

El cobro es automático: cada vez que el solicitante recibe dinero, se
descuenta un porcentaje para pagarle al prestamista hasta saldar la deuda.
Paga cuando le entra plata y en proporción a lo que recibe. Cada préstamo
pagado sube su score y le abre montos mayores.

## Qué resuelve

- **Score a partir de los movimientos de la billetera:** cierra la barrera
  del historial y los documentos que el sistema exige y la mayoría no tiene,
  la razón por la que 1 de cada 5 acude a vías no reguladas.
- **Cupos autorizados desde la billetera, en cualquier país y moneda:** le
  da al dinero disponible, incluida la liquidez del exterior, una forma de
  llegar a quien necesita crédito.
- **Cobro automático como porcentaje de cada ingreso:** le quita al
  prestamista el problema de cobrar, y al solicitante le ajusta el pago a lo
  que efectivamente recibe.
- **Score que sube con cada préstamo pagado:** convierte el buen
  comportamiento en acceso a montos mayores, el historial que hoy no existe.

## Alcance inicial

_Por definir: territorio, monedas, tipo de billetera y montos de la primera
versión._
