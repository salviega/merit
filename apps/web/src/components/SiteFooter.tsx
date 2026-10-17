import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-divisor">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-niebla sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="wordmark text-lg text-hueso">merit</span>
          <span className="label ml-3">powered by Open Payments</span>
        </p>
        <div className="flex gap-4">
          <Link href="/como-funciona">Cómo funciona</Link>
          {site.social.repo && (
            <a href={site.social.repo} rel="noreferrer" target="_blank">
              Código
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
