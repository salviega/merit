"use client";

import { useState } from "react";
import { Amount } from "@/components/Amount";
import { AuthorizationCard } from "@/components/AuthorizationCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Details } from "@/components/Details";
import { Field } from "@/components/Field";
import { ScoreRing } from "@/components/ScoreRing";
import { Skeleton } from "@/components/Skeleton";
import { StateSwitcher, useExampleState } from "@/components/StateSwitcher";
import { Status } from "@/components/Status";
import { WalletAddress } from "@/components/WalletAddress";
import { cop, exampleBorrower, exampleLoan } from "@/lib/examples";
import { formatAmount, formatPercent } from "@/lib/format";

// Widget states (04 §4.2–4.3, 04 §6 "Estados de la solicitud de score"):
//   locked    → wallet address; the amount form is disabled until there is a score (04 §1.4)
//   analyzing → reading the history, computing the score (analizando)
//   offer     → score, max amount, rate, max interest; the form unlocks (aprobado)
//   rejected  → the score is under 500: it says so, no form (rechazado)
//   expired   → 15 minutes passed without taking the loan (vencido)
//   active    → the loan arrived: received, total due, share, repaid (activo)
const states = ["locked", "analyzing", "offer", "rejected", "expired", "active"] as const;
const labels = {
  locked: "bloqueado",
  analyzing: "analizando",
  offer: "oferta",
  rejected: "rechazado",
  expired: "vencido",
  active: "préstamo recibido",
};

export function BorrowingView() {
  const state = useExampleState(states, "locked");
  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="label text-lavanda">Borrowing</p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
          Pedir préstamo
        </h1>
        <p className="text-niebla">
          Vinculas tu wallet, merit mira tus movimientos y te dice cuánto te
          puede prestar. Sin historial bancario.
        </p>
      </header>

      {state === "locked" && <Locked />}
      {state === "analyzing" && <Analyzing />}
      {state === "offer" && <Offer />}
      {state === "rejected" && <Rejected />}
      {state === "expired" && <Expired />}
      {state === "active" && <Active />}

      <StateSwitcher states={states} labels={labels} current={state} />
    </>
  );
}

function Locked() {
  const [wallet, setWallet] = useState("");
  const walletOk = /^https:\/\/\S+\/\S+$/.test(wallet);
  return (
    <>
      <Card title="Vincula tu wallet">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <Field
            id="wallet"
            label="Tu wallet address"
            placeholder="https://ilp.interledger-test.dev/juan"
            inputMode="url"
            autoComplete="off"
            mono
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            hint="merit leerá tus pagos recibidos y enviados de los últimos 90 días. Solo lectura, y el permiso se revoca al terminar."
          />
          <AuthorizationCard
            moves="Nada. Es un permiso de lectura."
            willHappen="Tu proveedor te pedirá autorizar que merit lea tu historial de pagos."
            wontHappen="merit no puede mover dinero con este permiso."
            undo="El permiso se revoca solo al calcular el score; también puedes revocarlo en tu wallet."
          />
          <Button
            type="submit"
            disabled={!walletOk}
            reason={
              walletOk
                ? undefined
                : "Escribe tu wallet address completa, por ejemplo https://ilp.interledger-test.dev/juan."
            }
          >
            Analizar mis movimientos
          </Button>
        </form>
      </Card>
      <AmountForm locked />
    </>
  );
}

function Analyzing() {
  return (
    <>
      <Card title="Analizando tus movimientos…">
        <Status kind="info">Leyendo tus pagos de los últimos 90 días.</Status>
        <div className="mt-6 flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <p className="mt-6 text-sm text-niebla">Suele tardar menos de un minuto.</p>
      </Card>
      <AmountForm locked />
    </>
  );
}

function Offer() {
  const b = exampleBorrower;
  return (
    <>
      <Card eyebrow="Tu score merit" title="Tienes un cupo">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <ScoreRing score={b.score} />
          <dl className="grid flex-1 gap-4 sm:grid-cols-3">
            <Figure label="Cupo" value={formatAmount(b.maxAmount)} tone="text-senal" />
            <Figure label="Interés" value={formatPercent(b.rate, 0)} />
            <Figure label="Interés máximo" value={formatAmount(b.maxInterest)} />
          </dl>
        </div>
        <p className="mt-6 text-sm text-niebla">
          Calculado con la regularidad y el volumen de tus ingresos de los últimos
          90 días. La oferta vale 15 minutos.
        </p>
      </Card>
      <AmountForm />
    </>
  );
}

function Rejected() {
  return (
    <Card title="Todavía no podemos prestarte">
      <Status kind="warn">
        Tu score merit es 460 · Bajo. Hace falta más historial de ingresos en tu
        wallet.
      </Status>
      <p className="mt-4 text-niebla">
        El score sube con ingresos regulares: en cuántas de las últimas 13
        semanas recibiste dinero y cuánto de eso se queda. Vuelve a analizar
        cuando tengas más movimientos.
      </p>
      <div className="mt-6">
        <Button href="/borrowing" tone="secondary">
          Volver a empezar
        </Button>
      </div>
    </Card>
  );
}

function Expired() {
  return (
    <Card title="La oferta venció">
      <Status kind="warn">Pasaron 15 minutos. Analiza tu wallet de nuevo para una oferta nueva.</Status>
      <div className="mt-6">
        <Button href="/borrowing">Analizar de nuevo</Button>
      </div>
    </Card>
  );
}

function Active() {
  const l = exampleLoan;
  const hundred = BigInt(100);
  const remaining = cop(
    Number((BigInt(l.totalDue.value) - BigInt(l.repaid.value)) / hundred),
  );
  const progress = Number((BigInt(l.repaid.value) * hundred) / BigInt(l.totalDue.value));
  return (
    <Card eyebrow="Préstamo recibido" title="El dinero está en tu wallet">
      <Status kind="ok">
        Recibiste <Amount amount={l.principal} />. Se descontará el{" "}
        {formatPercent(l.repaymentShare, 0)} de cada ingreso hasta pagar{" "}
        <Amount amount={l.totalDue} />.
      </Status>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Figure label="Total a pagar" value={formatAmount(l.totalDue)} />
        <Figure label="Pagado" value={formatAmount(l.repaid)} tone="text-senal" />
        <Figure label="Falta" value={formatAmount(remaining)} />
      </dl>
      <div className="mt-6" aria-label={`Pagado ${progress} %`}>
        <div className="flex justify-between text-sm text-niebla">
          <span>Pagado</span>
          <span className="num">{progress} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-chip bg-linea">
          <div className="h-full bg-senal" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="mt-6 text-niebla">
        Wallet: <WalletAddress url={exampleBorrower.wallet} className="text-hueso" />
      </p>
      <div className="mt-4">
        <Details>
          <p>wallet: {exampleBorrower.wallet}</p>
          <p>desembolso: {l.disbursementPayment}</p>
        </Details>
      </div>
      <div className="mt-6">
        <Button href="/" tone="secondary">
          Volver al inicio
        </Button>
      </div>
    </Card>
  );
}

// The amount form. Locked until there is a score (04 §1.4): the user never
// asks for something they will not be given. Unlocked, it is capped at the
// offer's maximum and shows the total due and the share of each income.
function AmountForm({ locked = false }: { locked?: boolean }) {
  const b = exampleBorrower;
  const max = Number(BigInt(b.maxAmount.value) / BigInt(100));
  const [amount, setAmount] = useState(locked ? "" : "300000");
  const n = Number(amount || 0);
  const over = n > max;
  const interest = Math.round(n * b.rate);
  const total = n + interest;

  const reason = locked
    ? "Primero analiza tu wallet: el monto se habilita cuando tengas tu score."
    : n <= 0
      ? "Escribe cuánto quieres pedir."
      : over
        ? `El monto supera tu cupo de ${formatAmount(b.maxAmount)}. Baja el monto para continuar.`
        : undefined;

  return (
    <Card title="Cuánto quieres pedir" aria-disabled={locked || undefined}>
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <Field
          id="amount"
          label="Monto"
          placeholder={locked ? "—" : String(max)}
          inputMode="numeric"
          suffix="COP"
          mono
          disabled={locked}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          hint={locked ? "Se habilita con tu score." : `Hasta ${formatAmount(b.maxAmount)}.`}
          error={!locked && over ? `El monto supera tu cupo de ${formatAmount(b.maxAmount)}.` : undefined}
        />
        {!locked && !over && n > 0 && (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Figure label="Interés" value={formatAmount(cop(interest))} />
              <Figure label="Total a pagar" value={formatAmount(cop(total))} />
              <Figure label="De cada ingreso" value={formatPercent(b.repaymentShare, 0)} />
            </dl>
            <AuthorizationCard
              moves={`Hasta ${formatAmount(cop(total))} en total, desde tu wallet, a medida que recibas ingresos.`}
              willHappen={`Cada vez que te entre dinero, el ${formatPercent(b.repaymentShare, 0)} va a quien te prestó, hasta completar ${formatAmount(cop(total))}.`}
              wontHappen={`merit no puede cobrar más de ${formatAmount(cop(total))} ni descontar dos veces el mismo ingreso.`}
              undo="Puedes revocar la autorización en tu wallet; el préstamo queda pendiente de pago."
            />
          </>
        )}
        <Button type="submit" disabled={Boolean(reason)} reason={reason}>
          {!locked && n > 0 && !over ? `Pedir ${formatAmount(cop(n))}` : "Pedir préstamo"}
        </Button>
      </form>
    </Card>
  );
}

function Figure({ label, value, tone = "text-hueso" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-card-sm border border-linea bg-noche/40 p-4">
      <dt className="label text-niebla">{label}</dt>
      <dd className={`num mt-2 text-xl ${tone}`}>{value}</dd>
    </div>
  );
}
