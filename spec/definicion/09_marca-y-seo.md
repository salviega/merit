# 09 — Marca, interfaz y SEO

> **Alcance:** cómo se ve, cómo habla y cómo se encuentra merit: marca, reglas de interfaz y SEO. Queda resuelto **antes** del plan de trabajo, para que ninguna fase tenga que inventar un color, un texto o una etiqueta `<title>`.
> **Depende de:** `docs/01-producto.md` · `docs/09-ui.md` del paquete de handoff.

---

## 1. Origen del kit

El brandbook se diseñó el 16 de octubre de 2026 a partir de dos referencias: la landing de belo (fondo oscuro, violeta, acento neón, detalles de terminal) y el deseo de un logo en minúsculas con la misma letra redonda. El kit de archivos se armó ese mismo día siguiendo la estructura del kit de OddsFlow (`brand/` + `apps/web/public/` + `site.ts` + metadata/manifest/robots/sitemap), que ya había resuelto la lección de los alias de Vercel y del `noindex`.

Decisiones al armar el kit:

- **Wordmark contorneado a paths.** Outfit Bold, minúsculas, tracking −5,5 %, punto de 0,17 em apoyado en la línea base. Generado con HarfBuzz + fontTools desde el woff2 oficial (`brand/generate.py`), así que se ve igual sin la fuente instalada y el punto queda siempre en la misma posición relativa.
- **Punto merit:** violeta sobre claro, lima sobre oscuro. El isotipo conserva el punto lima en ambos fondos.
- **Íconos:** `icon-16.png` es el isotipo simplificado (solo la "m", sin punto) porque a 16 px el punto se vuelve ruido. `icon-180.png` y `icon-maskable-512.png` van a sangre (sin esquinas: iOS y Android recortan ellos).
- **OG image:** titular "Crédito que se gana.", subtítulo con la tesis del contexto y el sello `powered by Open Payments`; anillo de score 720 a la derecha.
- **Fuentes por `next/font/google`:** sin petición en tiempo de ejecución al navegador y sin salto de diseño. Los woff2 en `brand/fonts/` son para el generador y para quien no pueda usar `next/font`.

---

## 2. Símbolo y logo

**Qué significa.** "merit" en minúsculas porque habla de tú; el punto al final es una cuota pagada a tiempo, la unidad mínima de mérito. Se acumula: cada punto sube el score y el cupo.

| Archivo | Uso |
| --- | --- |
| `brand/logo.svg` / `logo-dark.svg` | Wordmark. `-dark` sobre fondos oscuros |
| `brand/mark.svg` / `mark-dark.svg` | Isotipo (64 × 64) |
| `brand/lockup.svg` / `lockup-dark.svg` | Isotipo + wordmark |
| `apps/web/public/favicon.svg` | Isotipo, para la pestaña |
| `apps/web/public/icon-16.png` | Isotipo simplificado (sin punto) para 16 px |

**Espacio y tamaño mínimo:** margen igual a la altura de la "m"; 72 px de ancho el wordmark, 24 px el isotipo (16 px con el ícono simplificado).

**Lo que no se hace:** mayúsculas o inicial capital; degradados, sombras o contornos; cambiar la forma o el color del punto; estirar, rotar o reespaciar; el logo sobre imágenes sin capa de contraste; logos de terceros fuera de sus botones oficiales.

---

## 3. Color

| Rol | Hex | Uso |
| --- | --- | --- |
| **Noche** | `#0A0A0F` | Fondo principal; texto sobre superficies claras |
| **Grafito** | `#15151D` | Tarjetas y superficies |
| **Línea** | `#26262F` | Bordes y divisores (`#3A3A46` en controles) |
| **Hueso** | `#F5F5F7` | Texto sobre fondo oscuro |
| **Niebla** | `#A1A1AE` | Texto secundario |
| **Mérito** | `#6E4BFF` | Acción principal, foco, selección |
| **Lavanda** | `#A898FF` | Violeta para texto sobre oscuro: enlaces, etiquetas |
| **Señal** | `#C6F432` | Confirmación: éxito, punto merit, wallet vinculada |
| **Ámbar** | `#FFB547` | Advertencia, pago próximo |
| **Coral** | `#FF5C7A` | Error, mora |
| **Papel** | `#F6F5F1` | Documentos institucionales; fondo claro |

**Contraste (WCAG 2.x):**

| Par | Contraste | Sirve para |
| --- | --- | --- |
| Hueso / Noche | 18,14 | Todo |
| Niebla / Noche | 7,74 | Todo |
| Niebla / Grafito | 7,11 | Todo |
| Lavanda / Noche | 8,09 | Todo |
| Noche / Señal | 15,41 | Todo (texto del botón lima) |
| Blanco / Mérito | 5,11 | Todo (botón primario) |
| Ámbar / Noche | 11,24 | Todo |
| Coral / Noche | 6,64 | Todo |
| Deshabilitado `#8A8A96` / Línea | 4,40 | Solo el texto del botón deshabilitado (texto grande o acompañado de la razón escrita). **No texto de cuerpo** |

**Reglas:**

1. **Violeta actúa, lima confirma.** Mérito es la acción principal de la pantalla; Señal aparece cuando algo quedó hecho (wallet vinculada, cuota pagada, aporte recibido). El botón "Aportar liquidez" en la landing y en el formulario usa Señal porque es el camino del lender; "Pedir préstamo" usa Mérito.
2. **Los estados llevan palabra.** Prefijo mono `[OK]`, `[ ! ]`, `[ x ]` o etiqueta de banda; nunca solo color.
3. **Los errores explican.** Texto Hueso, borde Coral, qué pasó y qué hacer. "Monto supera tu cupo" en el botón deshabilitado, no un botón gris mudo.
4. **Proporción:** Noche 60 · Grafito 20 · Hueso 10 · Mérito 7 · Señal 3.

Los tokens viven en `apps/web/src/app/globals.css` (`bg-noche`, `text-niebla`, `border-linea`, `bg-merito`, `bg-senal`, etc.) y en `brand/tokens.json`.

---

## 4. Tipografía

| Familia | Pesos | Uso |
| --- | --- | --- |
| **Outfit** | 500 · 600 · 700 | Wordmark, titulares, cifras grandes |
| **DM Sans** | 400 · 500 · 700 | Cuerpo, formularios, botones |
| **JetBrains Mono** | 400 · 500 | Montos, wallet addresses, estados, etiquetas |

Escala: Display 56/60 −3 % · H1 36/40 −2 % · H2 24/30 · Cuerpo 16/24 · Dato 22 tabular · Etiqueta 12 MAYÚS +14 %.

Las tres son SIL OFL. La web las carga con `next/font/google` como `--font-outfit`, `--font-dm-sans` y `--font-jetbrains-mono`. **`tabular-nums` en todo monto, score y saldo.**

---

## 5. Números

| Qué | Formato | Ejemplo |
| --- | --- | --- |
| Monto | COP, agrupación `es-CO`, sin decimales en UI, símbolo siempre | `$300.000` |
| Monto con moneda explícita | En resúmenes y comprobantes | `$1.000.000 COP` |
| Cuota | monto × número | `$53.197 × 6` |
| Tasa | Mensual, un decimal, coma decimal | `1,8 %` |
| Score | Entero + banda | `720 · BUENO` |
| Wallet address | Abreviada `$host/path` en mono; completa en "Detalles" | `$wallet.ejemplo/ana` |
| Porcentajes de contexto | Un decimal, coma decimal, espacio antes de % | `96,5 %` |
| Pendiente de definir | Marcador entre corchetes, nunca un cero | `[APY]`, `[N] días` |

Internamente todo monto es `bigint` en unidades menores + `assetCode` + `assetScale`; la UI convierte con la escala que devuelve la wallet address.

---

## 6. Voz y textos

Español, tuteo, frases cortas, sin letra pequeña. La marca siempre en minúsculas: "merit". Palabras de lo que hace el usuario, no del protocolo.

| Se dice | No se dice |
| --- | --- |
| Aportar liquidez · Pedir préstamo | Invertir · Solicitar crédito · Lending/Borrowing (solo como etiqueta mono) |
| Wallet address | Dirección, payment pointer, cuenta |
| Vincular wallet | Conectar wallet (no hay firma de wallet cripto) |
| Autorizar en mi wallet | Firmar, aprobar grant, dar consentimiento |
| Cuota pagada · Cobro automático | Transacción exitosa · Débito recurrente |
| Tu score merit · Tu cupo | Puntaje crediticio · Línea de crédito |
| Aporte recibido | Depósito confirmado |

**Botones con verbo y objeto:**

| Momento | Botón |
| --- | --- |
| Landing, lender | `Aportar liquidez` |
| Landing, borrower | `Pedir préstamo` |
| Vincular | `Vincular wallet` |
| Pedir | `Pedir $300.000` |
| Enviar aporte | `Enviar y autorizar en mi wallet` |
| Depositar | `Depositar en el pool` |
| WhatsApp | `Aprobar crédito` · `Rechazar` · `Autorizar en mi wallet` |

**Errores:** qué pasó y qué hacer. "El monto supera tu cupo disponible de $500.000. Baja el monto o paga tu cuota pendiente para subirlo." No "Error 400". Sin signos de exclamación: es dinero.

---

## 7. Reglas de interfaz

**El estado es el producto.** Antes de construir cada componente se listan sus estados:

| Objeto | Estados |
| --- | --- |
| Wallet | Sin vincular · resolviendo · encontrada (nombre, moneda, proveedor) · moneda no soportada · URL inválida |
| Aporte (lender) | Creado · esperando autorización en la wallet · pagando · recibido · fallido · expirado |
| Oferta (borrower) | Enviada a WhatsApp · aprobada · rechazada · vencida |
| Crédito | Autorizado · desembolsando · activo · pagado · en mora · cancelado |
| Cuota | Programada · cobrando · pagada · fallida · atrasada |
| Datos | Cargando (skeleton) · vacío (qué es y cómo empezar) · error de red (reintentar) · desactualizado (hace cuánto) |

**El momento de autorizar es el pico de cada flujo.** Antes de enviar al usuario a su wallet, sin scroll y sin jerga:

| Autorización | Qué se mueve | Qué va a pasar | Qué **no** pasa | Qué se puede deshacer |
| --- | --- | --- | --- | --- |
| Aporte de liquidez | Tu dinero, una vez | El pool recibe el monto y empieza a generar rendimiento | merit no puede volver a cobrar sin otra autorización | Retiro con aviso de [N] días |
| Cobro de cuotas | Una cuota al mes, N meses | Cada mes se cobra la cuota desde tu wallet | merit no puede cobrar más que la cuota ni más veces que las pactadas | Revocable en tu wallet; el crédito queda en mora |

"Automático" se explica con el límite: "una cuota al mes, seis veces, nunca más que $53.197".

**Lo técnico está a un clic.** URLs completas de wallet, IDs de pago y referencias van detrás de "Detalles".

**Piso de accesibilidad:** AA (§3), foco visible Mérito, objetivos de 44 px, nada que dependa solo del color. Se revisa en 390 px y 1440 px, con wallet addresses largas y montos de siete cifras.

**Se rechaza:** spinners a pantalla completa, modales sobre modales, información necesaria en tooltips, botón destructivo junto al principal, errores en toasts que desaparecen, botones deshabilitados sin razón escrita, "Vincular wallet" como pantalla vacía.

---

## 8. SEO

**Qué se busca.** Primero, la **vista previa del enlace**: jurados, aliados y usuarios ven merit como tarjeta en WhatsApp, X o LinkedIn antes que como sitio. Después, que "microcrédito con billetera digital", "crédito sin historial Colombia" y "Open Payments microcrédito" lleven a la landing.

**Una sola fuente.** `apps/web/src/lib/site.ts` tiene nombre, título, descripción, palabras clave e imagen OG. `metadata.tsx`, `manifest.ts`, `robots.ts` y `sitemap.ts` leen de ahí.

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Título y descripción | `metadata.tsx` | `merit — Crédito que se gana`; plantilla `%s — merit`. Descripción de 148 caracteres |
| Open Graph y X | `metadata.tsx` + `public/og-image.png` | Tarjeta 1200 × 630 con "Crédito que se gana." |
| Datos estructurados | `metadata.tsx` (`JsonLd`) | `WebApplication`, `FinanceApplication`, `isAccessibleForFree`, redes en `sameAs` cuando existan |
| Canonical | `metadata.tsx` | `alternates.canonical` |
| Íconos y PWA | `metadata.tsx` + `manifest.ts` | favicon SVG e ICO, apple-touch 180, manifest 192/512 + maskable |
| `robots.txt` | `robots.ts` | Todo rastreable, con el sitemap |
| `sitemap.xml` | `sitemap.ts` | `/`, `/como-funciona`, `/seguridad` |

**Qué se indexa y qué no:**

| Ruta | Indexable | Por qué |
| --- | --- | --- |
| `/` (landing) | Sí | La portada: tesis, cifras, dos botones |
| `/como-funciona`, `/seguridad` | Sí | Contenido propio |
| `/app`, `/lender/*`, `/borrower/*`, `/admin`, `/autorizacion/*` | No (`privatePageRobots`) | Dependen de la sesión: vacías para un buscador |

Las páginas privadas llevan `noindex` en la meta, **no** `Disallow` en `robots.txt`.

**Rendimiento, que también es SEO:** fuentes con `next/font` (sin salto de diseño), landing renderizada en el servidor con las cifras ya en el HTML, `tabular-nums` para que los números no muevan el diseño.

**Cómo se verifica:**

- Lighthouse, categoría SEO: 100 en `/`.
- `view-source` de `/`: `<title>`, `<meta name="description">`, `og:image` absoluto y el JSON-LD en el HTML inicial.
- Vista previa real: pegar la URL en WhatsApp y en X; validar en un validador de Open Graph.
- Rich Results Test de Google sobre el JSON-LD: sin errores.
- `/robots.txt`, `/sitemap.xml` y `/manifest.webmanifest` responden.

---

## 9. Dónde vive cada cosa

| Qué | Dónde |
| --- | --- |
| Fuentes de diseño (SVG), tokens, generador | `brand/` (`README.md` en inglés) |
| Lo que sirve la web | `apps/web/public/` |
| Tokens de color y fuente | `apps/web/src/app/globals.css` |
| Texto y datos de SEO | `apps/web/src/lib/site.ts` |
| Metadata, manifest, robots, sitemap, layout | `apps/web/src/app/` |

---

## 10. Pendientes

- **Dominio.** El playground vive en `merit-ten-rust.vercel.app`. Fijar `NEXT_PUBLIC_SITE_URL` al dominio de producción antes de compartir enlaces: `site.ts` cae a `VERCEL_PROJECT_PRODUCTION_URL` y nunca a un alias de preview (que pide login y rompe la tarjeta).
- **Redes y repo.** Completar `site.social` cuando existan; el JSON-LD los toma solo.
- **Botón de Google.** Usar el botón oficial de Google Identity Services; los mockups llevan un placeholder.
- **Plantillas de WhatsApp.** El copy del tablero "Aprobación por WhatsApp" es la base para enviar a aprobación de Meta.
- **Rutas Borrowing.** El botón "Pedir préstamo" de la landing todavía no tiene pantallas; el flujo (monto → plazo → WhatsApp → wallet) está especificado en `docs/03-flujos.md` del handoff.
