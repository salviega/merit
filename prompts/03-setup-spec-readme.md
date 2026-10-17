# Session 3 — Repo setup, specification, README and this disclosure

- **Tool:** Claude Code, model Claude Opus 5.5 (`claude-opus-5-5`)
- **Who prompted:** Santiago Viana (salviega)
- **Dates:** 2026-10-16 and 2026-10-17
- **Result, by prompt:**
  1. Renamed `apps/api` to `apps/cron`.
  2. Commit hook, CI workflow, `.nvmrc`, `.vercelignore` and the Vercel
     project, copied from the team's previous project; first commits and
     PR #1.
  3. `spec/definicion/01` and `02` from the pitch below (PR #2).
  4. Opened PR #2.
  5. `spec/definicion/04`, `05` and `06` from the design described below,
     after reading the Open Payments OpenAPI specs (PR #3).
  6–9. Commits, merging `main`, lockfile fix, merging PR #9 to deploy the
     frontend.
  10–11. Completed the public `README.md` (PR #11).
  12. This file, `AI_USAGE.md` and the `prompts/` folder.

Prompts are copied verbatim, typos included. Pasted text is kept as it was
pasted.

## Prompt 1

````text
Listo, mitra en apps en api cambíala a cron y a web pero creo que ya está
````

## Prompt 2

````text
Súper haz un commit y pushea a main pero antes básate en home/salviega/hackathons/oddsflow para confirgar todo para hae rleismo formato de commits con la mande que lo hizo rama pr amain etc.. github actions y deplegar a vreserl el website
````

## Prompt 3

````text
--- pasted text ---
Merit
Merit es una plataforma de microcrédito: personas y entidades financieras ponen cupos de liquidez, y Merit los presta a quienes lo necesitan, con desembolso y cobro automáticos de billetera a billetera.

Contexto
Colombia ya resolvió el acceso a cuentas, pero no el acceso al crédito. El 96,5% de los adultos tiene al menos un producto de depósito formal, mientras que solo el 36,6% tiene crédito y apenas el 5,8% tiene un microcrédito [1]. Esto pasa aunque el dinero ya se mueve en digital: en 2025 hubo 22.390 millones de operaciones financieras, y el 81,7% se hizo por canales digitales [1]. Al mismo tiempo, hay liquidez disponible que podría prestarse: solo en remesas, los colombianos en el exterior enviaron US$13.098 millones en 2025 [2].

Problema
Esas dos puntas no se encuentran. Quien necesita crédito no lo consigue porque el sistema sigue exigiendo historial y documentos que la mayoría no tiene, así que lo busca por fuera: 1 de cada 5 personas que acceden a crédito en el país lo hacen por vías no reguladas [3]. Quien tiene dinero no tiene cómo prestarlo a esas personas de forma segura, sin poder medir su riesgo ni cobrarles de forma automática. Hay demanda de crédito y hay dinero disponible, pero no un canal que los conecte.

Solución
Merit es el canal que conecta el dinero disponible con quien necesita crédito. Una persona o entidad autoriza un cupo desde su billetera, desde cualquier país y en cualquier moneda, y el dinero no sale de su cuenta hasta que se presta. Quien solicita un préstamo no necesita historial bancario: Merit analiza los movimientos de su billetera, genera un score y, si lo aprueba, el dinero llega de inmediato. El cobro también es automático: cada vez que el solicitante recibe dinero, se descuenta un porcentaje para pagarle al prestamista hasta saldar la deuda, así que paga cuando le entra plata y en proporción a lo que recibe. Cada préstamo pagado sube su score y le abre montos mayores. Todo funciona sobre Interledger y Open Payments, entre billeteras de distintos proveedores y sin que el dinero pase por una cuenta de Merit.

Fuentes

Banca de las Oportunidades y Superintendencia Financiera de Colombia, Reporte de Inclusión Financiera 2025. Documento oficial: https://www.bancadelasoportunidades.gov.co/sites/default/files/2026-08/bdo_rif2025_24082026.pdf · Resumen en Blu Radio: https://www.bluradio.com/economia/banca-colombiana-data-ia-y-automatizacion-ante-el-reto-del-credito-por-debajo-del-37-so35
Banco de la República, cifras de remesas 2025, vía Portafolio: https://www.portafolio.co/economia/finanzas/remesas-que-recibe-colombia-marcaron-un-nuevo-record-en-el-2025-y-sobrepasaron-de-us-13-000-millones-486888
Banca de las Oportunidades, vía Portafolio: https://www.portafolio.co/economia/finanzas/que-caracteristicas-tienen-los-usuarios-que-recurren-a-creditos-gota-a-gota-587936
--- end of pasted text ---

. Toma esta informacion y diliengo el espec 01 y 02
````

## Prompt 4

````text
Haz el PR
````

## Prompt 5

````text
AHora para el diseñode la soliocn porfor uara donde se enceuntra la info .https://openpayments.dev/overview/getting-started/. https://github.com/interledger/open-payments. Sera un MVp DONDE HAYA UNA VISTA HOME QUE TENGA UN BOTÓN Lending y otro borrowing. en Lening, lo redictiona a una página  donde se va a encontrar con un formulargio grant donde le va permiter al cliente de interleitd merit mover plata en el momentoque encuentre un borrower debe a ver una vase da tos para regsiutra ese grant paa cuando haya un lborrower busque entre el dinero disponible. Luego un borrower le daclick al botón borrowing y le sale un widget donde tiene un formulario para pedir la plat prestada pero estan bloqueados los espacio del form porque primero debe calcular el score credicion así que cuando le de analziar, este le dice al backe que armer un grant donde le va permitr acceder al historial de la ledger de esta wallet (o account) cuando el d aceptar el callback debería mandar esta nformacion a otro enpoint del backend apra que calcule aprti r de ese hisotiral el score credicion y cuanto puede pedir en su moneda. en elf onted se vería un loaign mientras se termide la resputa o el putna del score. diciendo cuanto es lo maxio a que taza y el itntes maxiomo que este peude tomar acorde al ainformacion qeu tenemos en la base da tos de dinero dispolie. cuando el de click atomar lo redirecciona a un grant donde merit puede mover del balnce del borrewe el total de loan + el interes caundo este le entre plata. pte el grant el callback deberia llamar al endpoitn del cliente de interledger para toamr el diner del lender y transferirle inmediante el borrower. HABRA UNA NUEVA TABLA CON LOS GRANTS DE LSO BORRORWES PARA QUE EUN CRON (UN SERVCIO CONSUTLA CAD 5 SEGUDNOS lso incoming de las wallets borrign y si ve que hay un increto le sauqe una procion y se la transdfiera al lender. el cron deberi allamr este enpotin: https://openpayments.dev/apis/#tag/incoming-payment/GET/incoming-payments. cone sto haz el 04 el 05 y el 06
````

## Prompt 6

````text
Haz solo el commit
````

## Prompt 7

````text
Bja los cambios que hay en amin y leuog haz el pr
````

## Prompt 8

````text
Baja los cambios de main y luego haz una cambio chiquituciop para detornarle vercel y actualcie el frontend
````

## Prompt 9

````text
Sí, mergea el PR #9
````

## Prompt 10

````text
Listo ahora, haz el README.md del poreycto ne ingles, osea docuemta lo que haga falta
````

## Prompt 11

````text
Sí, haz el commit y abre el PR y lo cierras
````

## Prompt 12

````text
--- pasted text ---
Imagen 2 — Reglas de uso de IA

1. Se permiten las herramientas de IA
Los participantes pueden usar herramientas de IA (por ejemplo, ChatGPT, Claude, GitHub Copilot, Cursor, Gemini, etc.) durante todo el hackatón. La IA puede usarse para programar frontend y backend, depurar, investigar, diseñar o redactar documentos, si el hackatón lo requiere.

2. Declarar el uso de IA es obligatorio
Cada equipo debe agregar un archivo llamado AI_USAGE.md en la raíz del repositorio de su proyecto en GitHub. Este archivo debe indicar:

Qué herramienta(s) de IA se usaron
Para qué se usaron
En qué parte del proyecto se usaron (archivos, funciones o componentes específicos), o mencionar todo el proyecto si ningún archivo se escribió sin IA
Los archivos específicos en los que se usó poca o ninguna IA, por ejemplo el archivo de servicio de Open Payments

Obligatorio en cada repositorio: AI_USAGE.md y /prompts

Imagen 1 — Ejemplo: AI_USAGE.md
markdown
# AI Usage Disclosure

## Tools Used
- ChatGPT (GPT-4o)
- Claude

## Where and How We Used AI

### 1. Backend - Payment flow (`/src/api/open-payments.ts`)
- Used Claude to scaffold the initial Open Payments flow, creating incoming and
  outgoing payments, as well as quote creation.
- Reviewed and rewrote error handling ourselves after testing revealed the AI's
  version didn't handle grants correctly.

### 2. Frontend - Donation platform UI (`/src/components/Donation.tsx`)
- Used Claude to generate all design and frontend pages and components

### 3. Documentation - README setup instructions
- Used ChatGPT to draft the initial README structure.
- Edited by hand to match our actual setup steps and fix inaccurate install
  commands.

## What We Did Ourselves
- Testing and verification of all AI-suggested code

## Prompt Log
See `/prompts/backend-payments.md` for the full list of prompts used to generate
the open payments flow code.

¿Quieres que arme el AI_USAGE.md y la carpeta /prompts para el proyecto de la hackathon?
--- end of pasted text ---

  HAZ ESTO Y LUEGO EL pr
````
