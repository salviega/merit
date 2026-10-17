import type { Metadata, Viewport } from "next";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: site.titleTemplate },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title: site.title,
    description: site.description,
    images: [
      {
        url: site.ogImage.path,
        width: site.ogImage.width,
        height: site.ogImage.height,
        alt: site.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [site.ogImage.path],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-180.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
};

/** For pages that depend on the wallet state (lending, borrowing). */
export const privatePageRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function JsonLd() {
  const sameAs = Object.values(site.social).filter(Boolean);
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: site.language,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
    image: absoluteUrl(site.ogImage.path),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
