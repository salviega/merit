# 06 — Tecnologías del stack

> **Alcance de este documento:** el inventario concreto — qué se instala, para qué sirve cada pieza y qué se descartó.
> **Depende de:** [05 — Stack y arquitectura](./05_stack-y-arquitectura.md)
> ⚠️ Las versiones son la referencia al momento de escribir (**[fecha]**). **Confirmar la estable vigente al instalar**; lo que no debe cambiar es la elección, no el número.
>
> <!-- Diferencia con el 05: el 05 dice POR QUÉ se eligió algo; este
>      documento dice QUÉ es exactamente, con versión, y PARA QUÉ sirve cada
>      pieza. Organiza las secciones por capa/necesidad, no por orden de
>      instalación. Borra o renombra las que no apliquen a tu stack. -->

---

## 1. Base

<!-- Runtime, lenguaje, gestor de paquetes — lo que hace falta antes de
     cualquier otra elección. -->

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

---

## 2. Datos

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

---

## 3. Interfaz

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

---

## 4. Formularios y validación

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

---

## 5. Utilidades

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

---

## 6. Desarrollo y calidad

<!-- Lint, formato, pruebas, CI. Esta sección es la que le da soporte
     concreto al ritual de commit de AGENTS.md — cada herramienta nombrada
     aquí debería aparecer también como un paso de ese ritual. -->

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| _—_        | _—_     | _—_      |

<!-- [ADAPTAR] Si defines un umbral de cubrimiento en AGENTS.md, la
     herramienta que lo mide va aquí (`@vitest/coverage-v8`, `pytest-cov`,
     `nyc`, `go test -cover`, lo que corresponda) — y una frase de CÓMO se
     hace cumplir. La idea que vale para cualquier stack: el umbral se
     declara en la config del test runner (no en un script aparte), así el
     mismo comando de pruebas falla si no se cumple — nunca un paso extra de
     "correr tests, luego revisar el %". -->

---

## 7. Servicios externos

<!-- APIs, hosting, cualquier cosa que no sea una librería que instalas sino
     un servicio del que dependes. Anota el plan (gratis/pago) — es lo que
     alimenta la tabla de costos del 05. -->

| Servicio | Plan | Para qué |
| -------- | ---- | -------- |
| _—_      | _—_  | _—_      |

---

## 8. Variables de entorno

<!-- Todas, con dónde se usan y una nota si algo es sensible (nunca el valor
     real, obviamente). Si un secreto no debe vivir en un `.env` (por
     ejemplo, porque hay una llave caliente de verdad en juego), dilo aquí. -->

| Variable | Dónde se usa | Notas |
| -------- | ------------ | ----- |
| `_—_`    | _—_          | _—_   |

---

## 9. Scripts

| Script | Qué hace |
| ------ | -------- |
| `test` | Corre las pruebas[; si hay umbral de cubrimiento, con el flag de cubrimiento del runner — el mismo comando falla si no se cumple] |
| `_—_`  | _—_      |

---

## 10. Lo que se descartó y por qué

<!-- La tabla más valiosa del documento a mediano plazo: evita que alguien
     reconsidere una alternativa que ya se evaluó y se descartó por un motivo
     concreto. -->

| Descartado | En favor de | Por qué |
| ---------- | ------------ | ------- |
| _—_        | _—_          | _—_     |

---

## 11. Pendientes

- _—_
