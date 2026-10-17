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
| PostgreSQL (Neon) | Servicio | Base compartida por la web y el servicio de cobro. |
| `drizzle-orm` | 0.45.4 | Esquema y consultas tipadas, transacciones y `FOR UPDATE` del cobro. |
| `drizzle-kit` | 0.31.11 | Genera y aplica las migraciones. |
| `@neondatabase/serverless` | 1.2.0 | Driver de Postgres para Neon, desde Vercel y desde Node. |

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
| Vitest | 5.0.5 | Pruebas de `packages/core`: score, oferta, cuotas y el ciclo de cobro contra una base de prueba. |
| `@vitest/coverage-v8` | 5.0.5 | Cobertura de `packages/core`; el umbral se declara en la config de Vitest, así `pnpm test` falla debajo del piso. |
| ESLint | 9 (`eslint-config-next`) | Lint de `apps/web`. |
| `tsx` | 4.23.15 | Corre `apps/cron` en desarrollo con recarga. |
| GitHub Actions | — | CI en cada pull request: lint, typecheck y build (y `test` cuando exista). |

---

## 7. Servicios externos

| Servicio | Plan | Para qué |
| -------- | ---- | -------- |
| Vercel | Hobby | Hospeda `apps/web` y sus `/api`; da la URL pública de los callbacks. Despliega `main` a producción. |
| Neon (vía Vercel Marketplace) | Gratis | Postgres. |
| Interledger test wallet (`wallet.interledger-test.dev`) | Gratis | Billeteras de prueba de prestamistas, solicitantes y de Merit, y la llave del cliente. |
| GitHub | Gratis | Repositorio y CI. |

---

## 8. Variables de entorno

| Variable | Dónde se usa | Notas |
| -------- | ------------ | ----- |
| `DATABASE_URL` | web, cron | Secreta. La crea la integración de Neon en Vercel. |
| `OPEN_PAYMENTS_WALLET_ADDRESS` | web, cron | _Wallet address_ del cliente Merit. |
| `OPEN_PAYMENTS_KEY_ID` | web, cron | Id de la llave del cliente en la billetera de prueba. |
| `OPEN_PAYMENTS_PRIVATE_KEY` | web, cron | **Secreta.** PEM en base64. Reemplaza a `OPEN_PAYMENTS_PRIVATE_KEY_PATH`. |
| `APP_URL` | web | URL pública de la web: base de los `interact.finish` de los grants. |
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
| `db:generate` / `db:migrate` | Genera y aplica migraciones de Drizzle. |
| `seed:history` | Siembra historial de pagos entre billeteras de prueba para la demo. |

---

## 10. Lo que se descartó y por qué

| Descartado | En favor de | Por qué |
| ---------- | ----------- | ------- |
| Express en `apps/cron` como API | Route handlers de Next.js | Los callbacks necesitan una URL pública; la web ya la tiene en Vercel. |
| Vercel Cron | Proceso Node con ciclo de 5 s | Vercel Cron no baja de un minuto. |
| Prisma | Drizzle | Sin motor binario y con el esquema en TypeScript plano para dos apps. |
| SQLite / Vercel KV | Postgres (Neon) | Hacen falta transacciones, bloqueos de fila y `UNIQUE` para no cobrar dos veces, desde dos procesos distintos. |
| Llave en archivo (`private.key`) | Variable de entorno | En Vercel no hay archivo. |
| Rafiki local | Red de prueba de Interledger | Menos infraestructura, y es la red con la que se va a hacer la demo. |

---

## 11. Pendientes

- Hosting de `apps/cron` fuera del hackathon.
- El umbral de cobertura de `packages/core`.
