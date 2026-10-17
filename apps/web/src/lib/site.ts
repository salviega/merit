// The one place the name, title, description, keywords and OG image live.
// metadata.tsx, manifest.ts, robots.ts and sitemap.ts read from here.

// On Vercel the site is the production domain of the landing, never a preview
// alias (those ask for a login and break the OG card). Locally and on the demo
// machine the site is APP_URL, the public hostname of the tunnel.
// An empty value in .env (a key left blank to fill in later) counts as unset.
const env = (value: string | undefined) => value?.trim() || undefined;

const vercelHost = env(process.env.VERCEL_PROJECT_PRODUCTION_URL);
const vercelUrl = vercelHost ? `https://${vercelHost}` : undefined;

export const site = {
  name: "merit",
  shortName: "merit",
  url: vercelUrl ?? env(process.env.APP_URL) ?? "http://localhost:3000",
  title: "merit — Crédito que se gana",
  titleTemplate: "%s — merit",
  // 148 characters, under the 160 cut.
  description:
    "Microcrédito que convierte tus pagos a tiempo en historial y tu historial en crédito. Aporta liquidez o pide un préstamo. Powered by Open Payments.",
  tagline: "Crédito que se gana.",
  locale: "es_CO",
  language: "es",
  keywords: [
    "microcrédito",
    "crédito digital",
    "score crediticio",
    "inclusión financiera",
    "Open Payments",
    "Interledger",
    "billetera digital",
    "préstamo en línea",
    "Colombia",
    "fintech",
  ],
  ogImage: {
    path: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "merit — Crédito que se gana.",
  },
  themeColor: "#0A0A0F",
  backgroundColor: "#0A0A0F",
  // Public social and repo links. Fill in when they exist; JsonLd picks them up.
  social: {
    x: "",
    repo: "",
  },
  // Routes that depend on the wallet state: noindex in the meta, no Disallow in robots.
  privatePaths: ["/lending", "/borrowing"],
} as const;

export const absoluteUrl = (path = "/") => new URL(path, site.url).toString();

// Where the app pages live. On Vercel the landing links to the tunnel; on the
// demo machine (and locally) the pages are on the same origin.
export const appUrl = env(process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "") ?? "";
export const appHref = (path: "/lending" | "/borrowing") => `${appUrl}${path}`;
