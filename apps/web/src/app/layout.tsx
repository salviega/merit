import type { ReactNode } from "react";
import { DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { JsonLd, metadata, viewport } from "./metadata";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export { metadata, viewport };

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${dmSans.variable} ${mono.variable} h-full`}
    >
      <head>
        <JsonLd />
      </head>
      <body className="flex min-h-full flex-col bg-noche text-hueso">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
