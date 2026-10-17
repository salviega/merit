# merit — brand kit

Quick reference. The full rationale (contrast figures, UI rules, SEO) lives in
[`spec/09_marca-y-seo.md`](../spec/09_marca-y-seo.md).

## The mark

The brand is the lowercase wordmark **"merit"** followed by the **merit dot**: a
lime circle resting on the baseline. Every dot is one installment paid on time,
the smallest unit of merit. The isotype is the letter **"m"** with the dot on a
violet rounded tile (corner radius 27 % of the side).

- `logo.svg` / `logo-dark.svg` — wordmark only. `-dark` on dark backgrounds
- `mark.svg` / `mark-dark.svg` — isotype only (64 × 64)
- `lockup.svg` / `lockup-dark.svg` — isotype + wordmark, horizontal
- `og-image.svg` — source of `apps/web/public/og-image.png` (1200 × 630)
- `apps/web/public/favicon.svg` — isotype, for the tab
- `apps/web/public/icon-16.png` — simplified isotype (no dot) for 16 px

On light surfaces the wordmark is Noche with a Mérito (violet) dot; on dark
surfaces it is Hueso with a Señal (lime) dot. The isotype keeps its lime dot
everywhere. All text is outlined to paths: the files render without the fonts.

## Colour

| Role          | Hex       | Use                                                       |
| ------------- | --------- | --------------------------------------------------------- |
| Noche         | `#0A0A0F` | Main background (60 %); text on light surfaces            |
| Grafito       | `#15151D` | Cards and surfaces (20 %)                                 |
| Línea         | `#26262F` | Borders and dividers (`#3A3A46` on controls)              |
| Hueso         | `#F5F5F7` | Text on dark surfaces (10 %)                              |
| Niebla        | `#A1A1AE` | Secondary text                                            |
| Mérito        | `#6E4BFF` | Primary action, focus, selection (7 %); white text on it  |
| Lavanda       | `#A898FF` | Violet for text on dark: links, labels                    |
| Señal         | `#C6F432` | Confirmation: success, merit dot, linked wallet (3 %)     |
| Ámbar         | `#FFB547` | Warning, upcoming payment                                 |
| Coral         | `#FF5C7A` | Error, late payment                                       |
| Papel         | `#F6F5F1` | Institutional documents; light background                 |

Violet acts, lime confirms. Señal is never a button for a destructive or
irreversible action, and Ámbar/Coral are never decoration. Status always ships
with a word or a mono prefix (`[OK]`, `[ ! ]`, `[ x ]`), never colour alone.
Score bands: Bajo (coral) · Regular (ámbar) · Bueno (señal) · Excelente
(lavanda), always with the label.

## Type

- **Outfit** 500/600/700 — wordmark, headlines, big figures
- **DM Sans** 400/500/700 — body, forms, buttons
- **JetBrains Mono** 400/500 — amounts, wallet addresses, states, labels

Wordmark: Outfit Bold, lowercase, tracking −5.5 %, dot = 0.17 em. Every amount,
score and wallet address is set in mono with `tabular-nums`. All three fonts are
SIL OFL (`fonts/*-OFL.txt`); `fonts/` holds the latin woff2 subsets.

## Amounts and addresses

- Amounts in COP, `es-CO` grouping, no decimals in the UI: `$300.000`.
  Internally `bigint` minor units + `assetCode` + `assetScale` (COP · 2).
- Wallet addresses abbreviated as `$host/path` in mono: `$wallet.ejemplo/ana`.
- Score: integer 300–850 + band label.

## Clear space

Leave around the wordmark a margin equal to the x-height of the "m" (the dot's
diameter × 4 is a good proxy). Minimum sizes: wordmark 72 px wide, isotype
24 px (16 px with the simplified icon).

## What not to do

- Do not set "merit" in capitals or title case
- Do not add gradients, shadows or outlines
- Do not change the dot's shape or colour, or detach it from the baseline
- Do not stretch, rotate or re-space the letters
- Do not place the logo over images without a contrast layer
- Do not use third-party logos (Google, WhatsApp, wallets) except their official buttons

## Voice

Spanish, informal "tú", short sentences, no fine print. Buttons say verb + object.

| Say                               | Not                                   |
| --------------------------------- | ------------------------------------- |
| Aportar liquidez / Pedir préstamo | Invertir / Solicitar crédito          |
| Wallet address                    | Dirección, payment pointer, cuenta    |
| Autorizar en mi wallet            | Firmar, aprobar grant, consent        |
| Cuota pagada                      | Transacción exitosa                   |
| Tu score merit                    | Puntaje crediticio, rating            |
| Cobro automático                  | Débito recurrente, outgoing payment   |

## Files

```
brand/   logo.svg logo-dark.svg mark.svg mark-dark.svg lockup.svg lockup-dark.svg
         og-image.svg tokens.json fonts/ generate.py render.js
apps/web/public/   favicon.svg favicon.ico icon-{16,32,48,180,192,512}.png
                   icon-maskable-512.png og-image.png
apps/web/src/lib/site.ts            the one place title, description and OG copy live
apps/web/src/app/                   metadata.tsx manifest.ts robots.ts sitemap.ts globals.css layout.tsx
```

To regenerate every SVG and PNG after a change (fonts from `@fontsource/*`):

```sh
python3 -I brand/generate.py <fontsource_dir> .
NODE_PATH=<node_modules with playwright> node brand/render.js .
```
