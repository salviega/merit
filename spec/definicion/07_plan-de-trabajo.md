# 07 — Plan de trabajo

> **Alcance de este documento:** cómo se construye lo definido en los documentos anteriores — fases, orden, verificación y recortes.
> **Depende de:** [05 — Stack y arquitectura](./05_stack-y-arquitectura.md) · [06 — Tecnologías](./06_tecnologias.md)

> **Este documento es también la traza del proyecto.** Lo que ya está hecho y verificado va ~~tachado~~. Una fase solo se tacha completa cuando su verificación pasó de verdad, no cuando el código existe.
>
> <!-- Esa última frase es la regla más importante del documento: no taches
>      nada por "ya lo escribí", solo por "ya lo vi funcionar". -->

---

## Marco

<!-- Cuatro datos que cambian TODO el plan y que casi nunca están en la spec
     de producto: fecha de cierre real, cuántas personas construyen (define
     si las fases van en serie o en paralelo), en qué se despliega cada fase,
     y de dónde se parte (repo vacío, algo ya hecho, etc.). No los copies de
     otro proyecto — pregúntalos o decídelos el primer día. -->

_Dónde vive el proyecto (monorepo/repos separados), fecha de cierre real,
cuántas personas construyen, punto de partida._

Cada fase termina **desplegada/demostrable y verificable**. Si el tiempo se
acaba en cualquier punto, lo que hay ya sirve.

**Reglas que atraviesan todas las fases**, no negociables por velocidad:

<!-- Estas reglas son las que hacen que el ritual de AGENTS.md tenga sentido
     en el contexto de ESTE proyecto. Al menos una de ellas debería nombrar
     la regla crítica del 05 §5 explícitamente. -->

1. _—_
2. _—_
3. _—_

El detalle operativo —qué se corre antes de cada commit y en qué orden— vive
en el [`AGENTS.md`](../../AGENTS.md) del repositorio; el registro de cada
cambio, en el [`CHANGELOG.md`](../../CHANGELOG.md).

### Calendario

<!-- Una fila por fase, con fechas reales — no "fase 1, fase 2" sin fecha.
     Esto es lo que hace el plan accionable en vez de aspiracional. -->

| Fase | Qué | Días | Fechas |
| ---- | --- | ---- | ------ |
| 0    | _andamiaje_ | _—_ | _—_ |

---

## Fase 0 — Andamiaje

<!-- Repite esta plantilla por cada fase. El patrón: Objetivo (una frase),
     una lista de qué se hace, y una línea de Verificación que se pueda
     ejecutar de verdad (no "revisar que funcione" sino el comando exacto o
     la acción exacta que lo prueba). Si una fase tiene una decisión que
     puede bifurcar el plan (una "compuerta"), dilo explícito con fecha. -->

**Objetivo:** _—_

- _—_

**Verificación:** _—_

---

## Fase 1 — [Nombre]

**Objetivo:** _—_

- _—_

**Verificación:** _—_

---

## Orden y recortes

<!-- La lista de qué se corta PRIMERO si el tiempo se acaba, en orden — y,
     por separado, lo que NUNCA se corta pase lo que pase (normalmente: la
     regla crítica del 05 §5, y cualquier cosa que un juez vaya a verificar
     directamente). Decide esto AHORA, no a mitad de una noche sin dormir. -->

Se corta desde atrás, en este orden:

1. _—_

**Nunca se corta:** _—_

---

## Riesgos

<!-- Reutiliza la tabla del 05 §10, pero añade CUÁNDO SE SABE cada uno — la
     fecha en la que, si el riesgo se materializó, ya lo sabrías. Eso
     convierte una lista de preocupaciones en un plan con puntos de decisión
     reales. -->

| Riesgo | Se sabe el | Si se materializa |
| ------ | ---------- | -------------------- |
| _—_    | _—_        | _—_                   |
