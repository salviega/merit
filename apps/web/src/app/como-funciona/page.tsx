import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { appHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Cómo merit convierte los movimientos de tu wallet en un score, cómo llega el préstamo y cómo se paga solo con un porcentaje de cada ingreso.",
  alternates: { canonical: "/como-funciona" },
};

export default function ComoFunciona() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-4">
        <p className="label text-lavanda">Cómo funciona</p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          De wallet a wallet, con permisos que tú apruebas
        </h1>
        <p className="text-lg text-niebla">
          merit conecta a quien tiene dinero disponible con quien necesita un
          préstamo y no tiene historial bancario. Todo corre sobre Interledger
          Open Payments, entre wallets de distintos proveedores.
        </p>
      </header>

      <Card eyebrow="Lending" title="Aportar liquidez">
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-niebla">
          <li>Escribes tu wallet address y el cupo que quieres prestar, en la moneda de tu wallet.</li>
          <li>Tu proveedor te muestra el monto y lo autorizas. Ese es el tope: merit no puede sacar más.</li>
          <li>El dinero sigue en tu wallet hasta que alguien toma un préstamo con tu cupo.</li>
          <li>Cada vez que esa persona recibe un ingreso, una parte llega directo a tu wallet, hasta recuperar lo prestado más el interés.</li>
        </ol>
      </Card>

      <Card eyebrow="Borrowing" title="Pedir préstamo">
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-niebla">
          <li>Vinculas tu wallet y autorizas que merit lea tus pagos recibidos y enviados de los últimos 90 días. Solo lectura.</li>
          <li>merit calcula tu score merit (300 a 1000) con la regularidad y el volumen de tus ingresos, y te muestra un cupo, una tasa y el interés máximo.</li>
          <li>Eliges cuánto pedir, hasta el cupo. Ves el total a pagar y el porcentaje que se descontará de cada ingreso.</li>
          <li>Autorizas el cobro en tu wallet, con el total a pagar como tope. El dinero llega de inmediato desde la wallet de quien aportó.</li>
          <li>Pagas cuando te entra plata: el 20 % de cada ingreso, hasta completar el total. Nunca más que eso, nunca dos veces el mismo ingreso.</li>
        </ol>
      </Card>

      <Card eyebrow="Score" title="Qué mira el score">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-niebla">
          <li>Regularidad: en cuántas de las últimas 13 semanas recibiste dinero.</li>
          <li>Actividad: cuántos pagos recibiste.</li>
          <li>Neto: cuánto de lo que entra se queda.</li>
          <li>Préstamos pagados en merit: cada uno suma, y abre montos mayores.</li>
        </ul>
        <p className="mt-4 text-niebla">
          Solo cuenta lo que pasa por tu wallet de Open Payments. Nada más.
        </p>
      </Card>

      <Card eyebrow="Seguridad" title="Lo que merit no puede hacer">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-niebla">
          <li>Guardar tu dinero: no hay una cuenta de merit por donde pase.</li>
          <li>Cobrar más que el tope que autorizaste: tu proveedor rechaza cualquier cobro por encima.</li>
          <li>Cobrar dos veces el mismo ingreso.</li>
          <li>Seguir leyendo tu wallet después del score: el permiso de lectura se revoca al calcularlo.</li>
        </ul>
        <p className="mt-4 text-niebla">
          Y tú puedes revocar cualquier permiso desde tu wallet, cuando quieras.
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href={appHref("/lending")} tone="senal">
          Aportar liquidez
        </Button>
        <Button href={appHref("/borrowing")} tone="merito">
          Pedir préstamo
        </Button>
      </div>
    </main>
  );
}
