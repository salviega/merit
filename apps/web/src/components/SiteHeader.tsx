import Link from "next/link";
import { appHref } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-divisor">
      <nav
        aria-label="Principal"
        className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link href="/" className="wordmark text-2xl text-hueso hover:text-hueso" aria-label="merit, inicio">
          merit
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/como-funciona" className="hidden text-niebla hover:text-hueso sm:inline">
            Cómo funciona
          </Link>
          <Link href={appHref("/lending")} className="text-senal hover:text-senal">
            Aportar liquidez
          </Link>
          <Link href={appHref("/borrowing")} className="text-lavanda">
            Pedir préstamo
          </Link>
        </div>
      </nav>
    </header>
  );
}
