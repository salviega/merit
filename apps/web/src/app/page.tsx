import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { appHref, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  alternates: { canonical: "/" },
};

// Figures from spec/definicion/01_contexto-y-problema.md, rendered on the
// server so they are in the initial HTML.
const figures = [
  { value: "96,5 %", label: "de los adultos en Colombia tiene una cuenta formal" },
  { value: "36,6 %", label: "tiene crédito; solo el 5,8 % un microcrédito" },
  { value: "1 de 5", label: "de quienes consiguen crédito lo hace por vías no reguladas" },
  { value: "US$13.098 M", label: "en remesas en 2025: liquidez que podría prestarse" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20">
      <section className="flex flex-col gap-6">
        <p className="label text-lavanda">powered by Open Payments</p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-7xl">
          Crédito que se gana<span className="text-senal">.</span>
        </h1>
        <p className="max-w-2xl text-lg text-niebla sm:text-xl">
          Microcrédito de billetera a billetera. Tus pagos se vuelven historial,
          tu historial se vuelve crédito, y cada cuota pagada sube tu cupo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={appHref("/lending")} tone="senal">
            Aportar liquidez
          </Button>
          <Button href={appHref("/borrowing")} tone="merito">
            Pedir préstamo
          </Button>
        </div>
      </section>

      <section aria-labelledby="cifras" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="cifras" className="sr-only">
          Por qué merit
        </h2>
        {figures.map((f) => (
          <Card key={f.value} compact>
            <p className="num font-display text-3xl font-bold leading-none">{f.value}</p>
            <p className="mt-3 text-sm text-niebla">{f.label}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card eyebrow="Lending" title="Si tienes dinero disponible">
          <ol className="flex flex-col gap-3 text-niebla">
            <li>
              <strong className="text-hueso">Autorizas un cupo</strong> desde tu wallet, en
              tu moneda, desde cualquier país.
            </li>
            <li>
              <strong className="text-hueso">El dinero no sale</strong> hasta que alguien
              lo pide. merit nunca lo guarda.
            </li>
            <li>
              <strong className="text-hueso">Lo recuperas solo</strong>: cada ingreso de
              quien pidió paga una parte, directo a tu wallet.
            </li>
          </ol>
          <div className="mt-6">
            <Button href={appHref("/lending")} tone="senal">
              Aportar liquidez
            </Button>
          </div>
        </Card>
        <Card eyebrow="Borrowing" title="Si necesitas un préstamo">
          <ol className="flex flex-col gap-3 text-niebla">
            <li>
              <strong className="text-hueso">Vinculas tu wallet</strong> y autorizas que
              merit lea tus movimientos. Sin papeles ni historial bancario.
            </li>
            <li>
              <strong className="text-hueso">Recibes tu score merit</strong> y un cupo. Si
              lo tomas, el dinero llega de inmediato.
            </li>
            <li>
              <strong className="text-hueso">Pagas cuando te entra plata</strong>: un
              porcentaje de cada ingreso, nunca más que el total acordado.
            </li>
          </ol>
          <div className="mt-6">
            <Button href={appHref("/borrowing")} tone="merito">
              Pedir préstamo
            </Button>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-3 border-t border-divisor pt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          El dinero nunca pasa por merit
        </h2>
        <p className="max-w-2xl text-niebla">
          Cada movimiento va de una wallet a otra con un permiso que su dueño
          aprueba en su propio proveedor, con un tope que pone él. merit no tiene
          una cuenta donde guardar fondos.{" "}
          <Link href="/como-funciona">Cómo funciona, paso a paso.</Link>
        </p>
      </section>
    </main>
  );
}
