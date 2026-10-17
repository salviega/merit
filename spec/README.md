# [Nombre del proyecto] — Documentación

<!-- Cómo llenar este archivo: es el índice, no el contenido. Una frase que
     defina el proyecto (el "elevator pitch"), y un párrafo de contexto: qué
     se hace hoy sin esto y en qué lo convierte este proyecto. Se escribe al
     final, cuando el 01 y el 02 ya existen — es un resumen de ellos, no al
     revés. -->

Merit es microcrédito de billetera a billetera: personas y entidades ponen
cupos de liquidez, y Merit los presta a quien no tiene historial bancario,
con desembolso y cobro automáticos sobre Interledger Open Payments.

Hoy, quien necesita crédito y no tiene historial lo busca por fuera del
sistema (1 de cada 5, en Colombia), y quien tiene dinero disponible no tiene
cómo prestarlo midiendo el riesgo ni cobrando sin perseguir al deudor. Merit
calcula un score con los movimientos de la billetera, presta de la billetera
del prestamista a la del solicitante sin tocar el dinero, y cobra un
porcentaje de cada ingreso hasta saldar la deuda.

---

## Definición del proyecto

<!-- Numera los documentos que uses. 03 (bounties) y 08 (roadmap) son
     opcionales — bórralos de la tabla y renumera si no aplican. El orden
     importa: cada documento asume el anterior, así que no lo cambies sin
     ajustar también los "Depende de" de cada archivo. -->

Documentos, en orden. Cada uno asume el anterior.

| #   | Documento                 | De qué trata                                                          |
| --- | -------------------------- | ---------------------------------------------------------------------- |
| [01](./definicion/01_contexto-y-problema.md) | **Contexto y problema**   | Qué está pasando, cómo se resuelve hoy y por qué eso falla            |
| [02](./definicion/02_solucion.md)            | **Solución**              | Qué es el proyecto y qué hace cada actor                              |
| [03](./definicion/03_bounties.md)            | **Bounties** _(opcional)_ | A qué premios se presenta y qué exige cada uno                        |
| [04](./definicion/04_diseno-de-solucion.md)  | **Diseño de la solución** | Actores, flujos, pantallas, modelo de datos y reglas de negocio       |
| [05](./definicion/05_stack-y-arquitectura.md)| **Stack y arquitectura**  | Decisiones técnicas, arquitectura, la regla que no puede fallar        |
| [06](./definicion/06_tecnologias.md)         | **Tecnologías**           | Qué se instala, para qué sirve cada pieza y qué se descartó           |
| [07](./definicion/07_plan-de-trabajo.md)     | **Plan de trabajo**       | Fases de construcción, cómo se verifica cada una y qué se recorta      |
| [08](./definicion/08_roadmap.md)             | **Roadmap** _(opcional)_  | Lo que no entra en este hackathon y sí en el siguiente                |
| [09](./definicion/09_marca-y-seo.md)         | **Marca, interfaz y SEO** | Colores, tipografía, voz, reglas de interfaz y cómo se encuentra la web |

**Por dónde empezar según quién seas:** para entender el proyecto, el 01 y el
02 bastan. Para trabajar en producto, el 04. Para escribir código, el 05 y el
06. Para saber qué sigue ahora mismo, el 07.

---

## Decisiones ya tomadas

<!-- Lista corta, de alto nivel, de las decisiones que ya no están en
     discusión — la razón de tenerla aquí es que alguien que abre el repo por
     primera vez no debería tener que leer los ocho documentos para saber si
     "usamos X o Y" ya se decidió. Actualízala cuando una decisión grande se
     cierre; no dupliques el detalle, que vive en el documento correspondiente. -->

- Identidad = _wallet address_; autorización = grant aprobado en el proveedor.
  Sin cuentas ni login (04 §8).
- El dinero nunca pasa por Merit; cada movimiento tiene un tope que pone el
  dueño de la billetera (`limits.debitAmount`) (04 §1).
- Un préstamo, un prestamista, una moneda; interés fijo sobre el capital;
  cobro como 20 % de cada ingreso (04 §8, 05 §6).
- Estado en un archivo JSON local con lock entre procesos; la API y el cobro
  corren en la máquina de la demo detrás de un túnel; Vercel sirve solo la
  landing (05 §1, decidido el 2026-10-16).
- Marca y textos del 09: minúsculas, "Aportar liquidez" / "Pedir préstamo",
  tema oscuro, español con tuteo.
- Los bounties del hackathon no son un motor del proyecto; el 03 queda como
  plantilla.

---

## Feedback a los sponsors

<!-- Borra esta sección entera si no hay sponsors cuya tecnología estés
     evaluando/documentando. Si la hay, mantenla: es el enlace de entrada a
     `feedback/`. -->

[`feedback/`](./feedback/) es una bitácora viva de lo que cada sponsor
documenta o promete frente a lo que encontramos al construir — se actualiza
mientras se avanza, no al final.

---

## Estado

<!-- Esta sección es la que más cambia. Una frase de dónde va la
     documentación, una frase de en qué fase de construcción está el
     proyecto (enlaza a la fase activa del 07), y qué pendiente bloquea algo
     si lo hay. -->

**Documentación:** los nueve documentos escritos; el 07 es la traza.
**Construcción:** las seis fases del [07](./definicion/07_plan-de-trabajo.md)
construidas y verificadas en local (75 tests, lint, typecheck, build); queda
el recorrido en vivo sobre la red de prueba con aprobaciones reales, descrito
en la *Verificación* de cada fase y en el [guion de la demo](./demo.md).
**Bloquea:** credenciales del cliente Open Payments válidas y una billetera
prestamista en la misma moneda que la del solicitante.
