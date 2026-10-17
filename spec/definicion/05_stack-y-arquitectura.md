# 05 — Stack y arquitectura

> **Alcance de este documento:** cómo se construye — decisiones técnicas, arquitectura, dónde vive el estado, permisos, costos y riesgos. **No repite el diseño de producto.**
> **Depende de:** [04 — Diseño de la solución](./04_diseno-de-solucion.md)[ · 03 — Bounties](./03_bounties.md)
>
> <!-- Borra la referencia al 03 si no existe. Este documento es el más
>      específico del stack real — a diferencia del 04, aquí SÍ se nombra la
>      tecnología concreta cuando la decisión ya está tomada (el inventario
>      exhaustivo con versiones va en el 06). -->

---

## 1. Decisiones

<!-- Una tabla, no prosa: decisión | qué se elige | qué se descarta | por qué.
     El "por qué" es lo que hace esto útil dentro de tres días cuando alguien
     (tú) se pregunte "¿por qué no usamos X?" — la respuesta ya está escrita
     y no hay que reconstruirla de memoria. -->

| Decisión | Se elige | Se descarta | Por qué |
| -------- | -------- | ------------ | ------- |
| _Decisión_ | _elección_ | _alternativa_ | _motivo_ |

---

## 2. Arquitectura

<!-- Un diagrama (ASCII está bien) de qué corre dónde y cómo se hablan las
     piezas. Incluye una frase de "cómo se hablan" y otra de "qué NO habla
     con qué" — el segundo punto suele ser tan importante como el primero
     para demostrar que los límites de seguridad/permiso son reales. -->

```
_diagrama de arquitectura_
```

**Cómo se hablan:** _—_

**Qué no habla con qué:** _—_

---

## 3. Estructura del proyecto

<!-- El árbol de carpetas real (o el que planeas). Si es un monorepo, explica
     en una frase por qué esa división. -->

```
_árbol de carpetas_
```

---

## 4. Dónde vive el estado

<!-- Adapta el título a tu caso: puede ser "Base de datos" (si tienes una),
     "Dónde vive el estado" (si es un sistema distribuido/onchain sin base de
     datos propia), o algo distinto. Una tabla de "qué dato, dónde vive,
     cómo se lee" suele ser más útil que un esquema completo aquí — el
     esquema exacto puede vivir en el código o en un ORM/migraciones. -->

| Dato | Fuente de verdad | Cómo se lee |
| ---- | ------------------ | ------------ |
| _dato_ | _dónde vive_ | _cómo se consulta_ |

---

## 5. [Nombra aquí la regla que no puede fallar]

<!-- Dale un nombre real a esta sección, no la dejes como "regla crítica" -
     en Moor era "Solo la Ledger mueve capital, y la posición no se deshace
     sola"; en tu proyecto puede ser "Nadie ve el dato de otro usuario" o
     "El inventario nunca queda negativo". Todo proyecto tiene AL MENOS una
     de estas: identifícala explícitamente y di cómo se garantiza (no "se
     valida en el frontend" — eso no es una garantía) y cómo se verifica con
     una prueba que intente romperla. -->

_El invariante del sistema y cómo se garantiza, no en el frontend sino donde
de verdad no se puede evadir._

**Cómo se verifica:** _la prueba que intenta romperlo, y qué se espera que
pase._

---

## 6. [Nombra aquí el cálculo o consulta central]

<!-- Si tu proyecto tiene una búsqueda, un cálculo o una derivación que es EL
     corazón técnico (una búsqueda por cercanía geográfica, un cálculo de
     precio, un estado derivado de eventos), documéntalo aquí con las
     entradas, la fórmula/algoritmo y de dónde sale cada entrada. Si no hay
     tal cosa, borra esta sección. -->

_Cómo se resuelve la operación central del sistema._

---

## 7. Autenticación y permisos

<!-- Quién puede leer y escribir qué, y DÓNDE se hace cumplir (nunca solo
     "en un componente" — eso no es enforcement). Una tabla por cada
     "superficie" de permisos si hay más de una (por ejemplo: la API, la base
     de datos, un contrato). -->

| Quién | Puede | No puede |
| ----- | ----- | -------- |
| _rol/actor_ | _acciones_ | _lo prohibido_ |

---

## 8. Trabajos automáticos

<!-- Qué corre solo, cada cuánto, y qué pasa si falla — cron jobs, workers,
     agentes, listeners de eventos. Si no hay ninguno, borra esta sección. -->

| Proceso | Cada cuánto | Qué hace | Si falla |
| ------- | ----------- | -------- | -------- |
| _proceso_ | _cadencia_ | _qué hace_ | _consecuencia_ |

---

## 9. Costos

<!-- Qué cuesta correr esto durante el hackathon y qué cuesta a partir de qué
     volumen deja de ser gratis. Útil para no descubrir a mitad de la demo
     que algo dejó de ser gratuito. -->

| Concepto | Costo | Nota |
| -------- | ----- | ---- |
| _servicio_ | _$/gratis_ | _condición_ |

---

## 10. Riesgos técnicos

<!-- Ordenados por cuánto daño hacen si se materializan. Cada uno con un
     plan B explícito, no solo "esperamos que funcione". Esta tabla es la
     que alimenta la sección de riesgos del 07 (con fechas de cuándo se sabe
     cada uno). -->

| Riesgo | Qué pasa | Qué se hace |
| ------ | -------- | ------------ |
| _riesgo_ | _consecuencia_ | _mitigación / plan B_ |

---

## 11. Pendientes

- _—_
