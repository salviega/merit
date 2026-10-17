# 06 — Tecnologías del stack

> **Alcance de este documento:** el inventario concreto — qué se instala, para qué sirve cada pieza y qué se descartó.
> **Depende de:** [05 — Stack y arquitectura](./05_stack-y-arquitectura.md)
> ⚠️ Las versiones son la referencia al momento de escribir (**2026-10-16**). **Confirmar la estable vigente al instalar**; lo que no debe cambiar es la elección, no el número.

---

## 1. Base

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| Node.js | 22 (`.nvmrc`) | Runtime de las dos apps, en local, en CI y en Vercel. |
| pnpm | 12.3.4 | Gestor de paquetes y workspaces del monorepo. |
| TypeScript | 7.0.2 (`apps/cron`), ^5 (`apps/web`) | Tipos en todo el código. Unificar la versión al crear `packages/core`. |

---

## 2. Datos

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| Archivo JSON (`data/merit.json`) | — | Almacén compartido por la web y el servicio de cobro, en la misma máquina. Ignorado por git. |
| `proper-lockfile` | 4.1.2 | Lock entre procesos sobre el archivo: una sola transacción escribe a la vez. |
| `write-file-atomic` | 7.0.0 | Escritura temporal + `rename`: el archivo nunca queda a medias. |
| `zod` | 4.6.7 | Esquema del documento completo; se valida al leer y antes de escribir. |

---

## 3. Interfaz

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| Next.js | 16.4.x | Páginas y route handlers `/api` en `apps/web`. |
| React | 19.3.x | Componentes del home, Lending y el widget de Borrowing. |
| Tailwind CSS | 4.3.x | Estilos. |

---

## 4. Formularios y validación

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| `zod` | 4.6.7 | Valida los cuerpos de la API, las variables de entorno y las respuestas de Open Payments que se guardan. |

Los formularios usan las acciones de React 19, sin librería de formularios:
son tres campos en total.

---

## 5. Utilidades

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| `@interledger/open-payments` | 7.4.0 | Cliente autenticado: firma los pedidos, pide y continúa grants, crea pagos entrantes, cotizaciones y pagos salientes, lista pagos y rota tokens. |

---

## 6. Desarrollo y calidad

| Tecnología | Versión | Para qué |
| ---------- | ------- | -------- |
| Vitest | 5.0.5 | Pruebas de `packages/core`: score, oferta, cuotas, el almacén (incluida concurrencia entre dos procesos) y el ciclo de cobro contra un archivo temporal. |
| `@vitest/coverage-v8` | 5.0.5 | Cobertura de `packages/core`; el umbral se declara en la config de Vitest, así `pnpm test` falla debajo del piso. |
| ESLint | 9 (`eslint-config-next`) | Lint de `apps/web`. |
| `tsx` | 4.23.15 | Corre `apps/cron` en desarrollo con recarga. |
| GitHub Actions | — | CI en cada pull request: lint, typecheck y build (y `test` cuando exista). |

---

## 7. Servicios externos

| Servicio | Plan | Para qué |
| -------- | ---- | -------- |
| Vercel | Hobby | Hospeda la landing y el SEO de `apps/web` (`/`, `/como-funciona`); sus botones enlazan a `APP_URL`. Despliega `main` a producción. |
| Cloudflare Tunnel (`cloudflared`) | Gratis | Túnel con nombre y hostname fijo hacia el `apps/web` local: la URL pública de las páginas de la app y de los callbacks. Necesita un dominio en Cloudflare. |
| Interledger test wallet (`wallet.interledger-test.dev`) | Gratis | Billeteras de prueba de prestamistas, solicitantes y de Merit, y la llave del cliente. |
| GitHub | Gratis | Repositorio y CI. |

---

## 8. Variables de entorno

| Variable | Dónde se usa | Notas |
| -------- | ------------ | ----- |
| `DATA_FILE` | web, cron | Ruta del archivo JSON. `./data/merit.json` por defecto. |
| `OPEN_PAYMENTS_WALLET_ADDRESS` | web, cron | _Wallet address_ del cliente Merit. |
| `OPEN_PAYMENTS_KEY_ID` | web, cron | Id de la llave del cliente en la billetera de prueba. |
| `OPEN_PAYMENTS_PRIVATE_KEY` | web, cron | **Secreta.** PEM en base64. Reemplaza a `OPEN_PAYMENTS_PRIVATE_KEY_PATH`. |
| `APP_URL` | web | URL pública del `apps/web` local (el hostname del túnel): base de los `interact.finish` de los grants y de los enlaces. |
| `NEXT_PUBLIC_APP_URL` | web (Vercel) | El mismo hostname del túnel, para que los botones de la landing en Vercel lleven a la app. Vacío en local. |
| `CLOUDFLARE_TUNNEL_TOKEN`, `TUNNEL_HOSTNAME` | script `tunnel` | **Secreto** el primero. Token del túnel con nombre y el hostname público enrutado a `localhost:3000`. Sin token, `tunnel` abre un túnel rápido con URL distinta en cada arranque. |
| `SEED_LENDER_WALLET`, `SEED_BORROWER_WALLET`, `SEED_PAYER_WALLET` | script `seed:history` | Billeteras de prueba A, B y C. |
| `SESSION_SECRET` | web | **Secreta.** Firma la cookie de la solicitud de score. |
| `CRON_INTERVAL_MS` | cron | 5000 por defecto. |

---

## 9. Scripts

| Script | Qué hace |
| ------ | -------- |
| `dev` | Corre la web y el servicio de cobro en paralelo. |
| `dev:web` / `dev:cron` | Corre una sola app. |
| `build` | Compila todas las apps. |
| `lint` | Lint de todo el monorepo. |
| `typecheck` | Chequeo de tipos de todo el monorepo. |
| `test` | Corre Vitest con cobertura; el mismo comando falla si no se cumple el umbral. |
| `tunnel` | Corre `cloudflared tunnel run` con el token del túnel con nombre hacia `localhost:3000`. |
| `seed:history` | Siembra historial de pagos entre billeteras de prueba para la demo. |

---

## 10. Lo que se descartó y por qué

| Descartado | En favor de | Por qué |
| ---------- | ----------- | ------- |
| Express en `apps/cron` como API | Route handlers de Next.js | Los callbacks necesitan una URL pública; la web ya la tiene en Vercel. |
| Vercel Cron | Proceso Node con ciclo de 5 s | Vercel Cron no baja de un minuto. |
| Prisma, Drizzle | Almacén JSON propio | Sin ORM que mantener; el esquema es un `zod` del documento completo. |
| Postgres (Neon), SQLite | Archivo JSON con lock | La API y el cobro corren en la misma máquina durante el hackathon; un lock de archivo y escritura atómica bastan para la exclusión mutua, sin servicio que mantener. Postgres vuelve cuando dejen de compartir disco (08). |
| API en Vercel | API en la máquina de la demo tras Cloudflare Tunnel | Vercel no puede compartir el archivo con el servicio de cobro; se queda con la landing. |
| Llave en archivo (`private.key`) | Variable de entorno | En Vercel no hay archivo. |
| Rafiki local | Red de prueba de Interledger | Menos infraestructura, y es la red con la que se va a hacer la demo. |

---

## 11. Pendientes

- Hosting de `apps/web` y `apps/cron` fuera del hackathon, con Postgres.
- El umbral de cobertura de `packages/core`.
