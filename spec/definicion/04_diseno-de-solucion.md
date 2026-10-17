# 04 — Diseño de la solución

> **Alcance de este documento:** diseño de producto — actores, flujos, pantallas, modelo de datos y reglas. **No define stack ni arquitectura técnica.**
> **Depende de:** [01 — Contexto y Problema](./01_contexto-y-problema.md) · [02 — Solución](./02_solucion.md)[ · 03 — Bounties](./03_bounties.md)
>
> <!-- Borra la referencia al 03 en la línea de arriba si no existe. Este es
>      el documento más largo del set: aquí es donde el proyecto deja de ser
>      una idea y se vuelve algo que se puede construir sin más preguntas. -->

---

## 1. Principios de diseño

<!-- 3-6 reglas que ordenan TODAS las decisiones de diseño que siguen. No son
     features, son criterios: cuando dudes entre dos formas de hacer algo,
     estos principios deberían decidir. Escríbelos concretos, no genéricos
     ("simple y rápido" no sirve; "una acción principal por pantalla" sí). -->

1. **_Principio._** _Qué implica en la práctica._
2. **_Principio._** _Qué implica en la práctica._

---

## 2. Actores y qué hace cada uno

<!-- Una fila por tipo de actor real (no por rol de base de datos). Si dos
     "roles" hacen exactamente lo mismo salvo un permiso, probablemente son
     un solo actor con un flag, no dos actores. -->

| Actor       | Identidad / cuenta | Qué hace |
| ----------- | ------------------- | -------- |
| **_Actor_** | _cómo se identifica_ | _acciones_ |

---

## 3. Modelo de datos

<!-- Una tabla por entidad. No repitas el esquema técnico exacto (eso es el
     05) — esto es "qué campos importan al producto y por qué", en lenguaje
     de negocio. Si un campo necesita una nota sobre por qué es obligatorio o
     por qué tiene ese formato, ponla en la columna Notas. -->

### _Entidad principal_

| Campo    | Tipo   | Notas   |
| -------- | ------ | ------- |
| `_campo_` | _tipo_ | _notas_ |

---

## 4. Flujos

<!-- Uno por cada camino que un actor recorre de principio a fin. Numera los
     pasos; sé literal sobre qué ve y qué firma/confirma en cada uno — este
     es el documento del que sale directamente el guion de la demo. -->

### 4.1 _Flujo del actor 1_

1. _Paso._
2. _Paso._

### 4.2 _Flujo del actor 2_

1. _Paso._

---

## 5. Pantallas

<!-- Lista de pantallas con su acción principal — una por pantalla. Si una
     pantalla tiene dos acciones principales que compiten, probablemente son
     dos pantallas. -->

| Pantalla | Qué muestra | Acción principal |
| -------- | ----------- | ----------------- |
| **_Pantalla_** | _qué muestra_ | _acción_ |

---

## 6. Reglas de negocio

<!-- Estados, transiciones y qué está prohibido — lo que el sistema debe
     hacer cumplir, no una sugerencia de la interfaz. Si una regla es
     realmente crítica (dinero, datos sensibles, algo irreversible), dilo
     explícitamente aquí Y en la sección 5 del 05 — las dos vistas (producto
     y técnica) de la misma regla. -->

_Estados, transiciones y qué está prohibido._

**Estados** (si el objeto principal tiene un ciclo de vida):

| Estado | Cuándo |
| ------ | ------ |
| `_estado_` | _condición_ |

---

## 7. Qué queda fuera de esta versión

<!-- Lo descartado A PROPÓSITO, con el motivo. Esto es lo que evita que
     alguien reintroduzca algo que ya se decidió no hacer, sin saber por qué
     se descartó. Lo que aquí se descarta y quieres retomar después va al 08
     (roadmap), si existe. -->

- _Lo que se descarta y por qué._

---

## 8. Decisiones tomadas y pendientes

**Tomadas:**

- _—_

**Pendientes:**

- _—_
