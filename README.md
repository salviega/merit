# Kit de arranque para proyectos de hackathon

Plantilla reutilizable extraída de [Moor](../moor) (ETHOnline, septiembre de 2026)
y generalizada para cualquier hackathon, cualquier stack. No es código: es la
**documentación, la disciplina de commits y las plantillas de proceso** que
hicieron que ese proyecto llegara ordenado al día de la entrega — separadas de
todo lo específico de blockchain/Ledger/1inch/ENS que tenía Moor.

## Cómo usarlo

1. Copia esta carpeta completa a `hackathons/<nombre-del-proyecto-nuevo>/`.
2. Antes de escribir nada, resuelve el **checklist de arranque** de abajo — cambia
   qué archivos aplican.
3. Llena los documentos de `spec/definicion/` **en orden**: cada uno asume el
   anterior, y el 01 y el 02 son los que desbloquean todo lo demás.
4. Adapta `AGENTS.md`, `CHANGELOG.md` y `.github/PULL_REQUEST_TEMPLATE.md` al
   stack real — tienen notas `[ADAPTAR]` en los sitios donde el contenido de
   Moor era específico de contratos y hardware wallets.
5. Llena `LICENSE` (año y titular; MIT es el default) y deja
   `PROJECT_README.template.md` a un lado hasta tener algo real que mostrar —
   entonces reemplaza este `README.md` con su contenido.
6. Recorta el `.gitignore` a las secciones de tu stack real — viene con
   varias (Node, Python, Foundry, Hardhat) para que borres las que no usas
   en vez de escribirlo desde cero.
7. Borra las notas de instrucción (los bloques `> **Cómo llenarlo:**` y
   similares) a medida que las lees y aplicas — no deberían sobrevivir hasta la
   entrega.
8. Cuando reemplaces este `README.md` por el de `PROJECT_README.template.md`,
   el kit ya se usó — este archivo no debe confundirse con la documentación
   del proyecto.

## Checklist de arranque (decide esto primero)

- [ ] **¿El hackathon tiene bounties de sponsors por tramos** (premios
      separados por empresa/track, cada uno con sus propios requisitos)? Si no,
      borra `spec/definicion/03_bounties.md` y `spec/feedback/`, y renumera el
      resto (04→03, 05→04, …).
- [ ] **¿Vas a construir un agente de IA que actúa por su cuenta?** Si no,
      borra la sección "El agente" de `AGENTS.md`.
- [ ] **¿Hay un componente que no puede fallar** (dinero, datos personales,
      una acción irreversible)? Es la sección 5 de `05_stack-y-arquitectura.md`
      — dale nombre propio, no la dejes como placeholder genérico.
- [ ] **¿En qué idioma va el código, la interfaz y el README público?**
      ¿Y la documentación de `spec/`? No tienen que coincidir — Moor tenía
      `spec/` en español y todo lo demás en inglés porque los jueces leían
      inglés. Decídelo en el propio `AGENTS.md`, sección *Language*.
- [ ] **¿Cuántas personas construyen y hasta cuándo?** Eso fija el calendario
      del `07_plan-de-trabajo.md` — no lo copies de Moor, ahí decía 8 días y
      una persona porque esa era la realidad de ese hackathon.
- [ ] **¿Hay una fecha de corte de submissions?** Ponla en el marco del 07 el
      primer día, no al final.

## Mapa de archivos

| Archivo | Para qué sirve | ¿Siempre aplica? |
| --- | --- | --- |
| `spec/README.md` | Índice de la documentación: qué documento leer según quién seas | Sí |
| `spec/definicion/01_contexto-y-problema.md` | Qué pasa y por qué duele, sin proponer nada todavía | Sí |
| `spec/definicion/02_solucion.md` | Qué es el proyecto y qué hace cada actor | Sí |
| `spec/definicion/03_bounties.md` | A qué premios se presenta y qué exige cada uno | Solo si hay bounties de sponsors |
| `spec/definicion/04_diseno-de-solucion.md` | Actores, flujos, pantallas, modelo de datos, reglas | Sí |
| `spec/definicion/05_stack-y-arquitectura.md` | Decisiones técnicas, arquitectura, la regla que no puede fallar, riesgos | Sí |
| `spec/definicion/06_tecnologias.md` | Inventario concreto: qué se instala y para qué | Sí |
| `spec/definicion/07_plan-de-trabajo.md` | Fases de construcción, calendario, qué se recorta si falta tiempo | Sí |
| `spec/definicion/08_roadmap.md` | Lo que no entra en este hackathon y sí en el siguiente | Opcional |
| `spec/feedback/` | Bitácora viva de lo que cada sponsor documenta vs. lo que hay de verdad | Solo si hay sponsors cuya tecnología usas |
| `AGENTS.md` | Reglas del repositorio: ritual de commit, seguridad, convenciones de stack | Sí |
| `CLAUDE.md` | Puntero a `AGENTS.md` para el harness de Claude Code | Sí, si usas Claude Code |
| `CHANGELOG.md` | Registro de cambios, formato Keep a Changelog + SemVer | Sí |
| `.github/PULL_REQUEST_TEMPLATE.md` | Plantilla de PR con checklist del ritual | Sí, si usas GitHub |
| `.githooks/commit-msg` | Valida Conventional Commits (sh puro, sin runtime). Actívalo con `git config core.hooksPath .githooks` | Sí |
| `.claude/settings.local.json` | Permisos locales de Claude Code, vacío — se llena solo | Sí, si usas Claude Code |
| `LICENSE` | Plantilla MIT — cambia año y titular, o la licencia entera | Sí |
| `PROJECT_README.template.md` | El README público que verá un juez; reemplaza a este `README.md` cuando haya algo que mostrar | Sí |
| `.gitignore` | Genérico, con secciones por stack — borra las que no apliquen | Sí |

## Qué hace a este patrón funcionar

Cuatro ideas, no atadas a blockchain ni a ningún stack:

1. **Los documentos de `spec/` forman una cadena de dependencia explícita.**
   Cada uno dice de qué depende y qué NO cubre. Nadie repite ni contradice al
   anterior, y se puede leer solo el 01 y el 02 para entender el proyecto sin
   tragarse los siete restantes.
2. **El plan de trabajo es también la traza del proyecto.** Lo hecho se
   ~~tacha~~, y solo cuando la verificación pasó de verdad — no cuando el
   código existe.
3. **El ritual de commit no es una sugerencia.** Pruebas antes que código,
   documentación que se revisa por obsolescencia en cada commit, un
   CHANGELOG que crece con la rama y no de memoria al final.
4. **El feedback a terceros se escribe en caliente.** El día que algo de una
   SDK o una API sorprende, se anota con la evidencia a mano — no se
   reconstruye de memoria la noche antes de entregar.
