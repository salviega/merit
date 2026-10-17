"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthorizationCard } from "@/components/AuthorizationCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { ScoreRing } from "@/components/ScoreRing";
import { Skeleton } from "@/components/Skeleton";
import { Status } from "@/components/Status";
import { WalletAddress } from "@/components/WalletAddress";
import { formatAmount, formatPercent, type Amount } from "@/lib/format";

// The real flow 4.2 against /api/score. The browser only ever sees the
// provider's redirect URL and the summary of its own request.

type Summary =
  | { status: "none" }
  | {
      status: "pending_grant" | "analyzing" | "approved" | "rejected" | "expired";
      walletAddress: string;
      assetCode: string;
      assetScale: number;
      score?: number;
      monthlyIncome?: string;
      maxAmount?: string;
      ratePercent?: number;
      maxInterest?: string;
      repaymentShare?: number;
      quotaAvailable?: boolean;
      expiresAt?: string;
    };

type ActiveSummary = Exclude<Summary, { status: "none" }>;

const errors: Record<string, string> = {
  session: "No encontramos tu solicitud en este navegador. Empieza de nuevo.",
  declined: "No autorizaste la lectura en tu wallet. Sin ella no podemos calcular tu score.",
  invalid: "La vuelta desde tu wallet no coincide con lo que pedimos. Por seguridad, empieza de nuevo.",
  callback: "Tu wallet no respondió como esperábamos. Intenta de nuevo en un momento.",
};

export function LiveBorrowing() {
  const params = useSearchParams();
  const [summary, setSummary] = useState<Summary | "loading">("loading");
  const [error, setError] = useState<string | undefined>(() => {
    const code = params.get("error");
    return code ? (errors[code] ?? errors.callback) : undefined;
  });

  const refresh = useCallback(
    () =>
      fetch("/api/score", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<Summary>) : null))
        .then((data) => {
          if (data) setSummary(data);
        })
        .catch(() => undefined),
    [],
  );

  const status = summary === "loading" ? undefined : summary.status;
  useEffect(() => {
    // First load, then poll while the borrower is at their provider or the
    // score is being computed.
    const polling = status === "analyzing" || status === "pending_grant";
    if (status !== undefined && !polling) return;
    const timer = setInterval(refresh, status === undefined ? 400 : 2000);
    return () => clearInterval(timer);
  }, [status, refresh]);

  if (summary === "loading") {
    return (
      <Card title="Pedir préstamo">
        <Skeleton className="h-6 w-2/3" />
      </Card>
    );
  }

  const start = async (walletAddress: string) => {
    setError(undefined);
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    const data = (await res.json()) as { redirect?: string; error?: string };
    if (!res.ok || !data.redirect) {
      setError(data.error ?? errors.callback);
      return;
    }
    window.location.assign(data.redirect);
  };

  switch (summary.status) {
    case "none":
    case "pending_grant":
      return (
        <>
          <WalletForm onSubmit={start} error={error} resuming={summary.status === "pending_grant"} />
          <AmountForm locked lockedReason="Primero analiza tu wallet: el monto se habilita cuando tengas tu score." />
        </>
      );
    case "analyzing":
      return (
        <>
          <Card title="Analizando tus movimientos…">
            <Status kind="info">Leyendo los pagos de los últimos 90 días de <WalletAddress url={summary.walletAddress} className="text-hueso" />.</Status>
            <div className="mt-6 flex flex-col gap-3" aria-hidden>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <p className="mt-6 text-sm text-niebla">Suele tardar menos de un minuto. El permiso de lectura se revoca al terminar.</p>
          </Card>
          <AmountForm locked lockedReason="Estamos calculando tu score." />
        </>
      );
    case "approved":
      return <Offer summary={summary} />;
    case "rejected":
      return (
        <Card title="Todavía no podemos prestarte">
          <Status kind="warn">
            Tu score merit es {summary.score ?? "—"} · {summary.score !== undefined && summary.score < 500 ? "Bajo" : "sin cupo disponible"}.
          </Status>
          <p className="mt-4 text-niebla">
            {summary.score !== undefined && summary.score >= 500
              ? `Tu score alcanza, pero ahora mismo no hay cupo disponible en ${summary.assetCode}. Vuelve cuando alguien aporte liquidez.`
              : "El score sube con ingresos regulares: en cuántas de las últimas 13 semanas recibiste dinero y cuánto de eso se queda. Vuelve a analizar cuando tengas más movimientos."}
          </p>
          <div className="mt-6">
            <RestartButton onRestart={() => setSummary({ status: "none" })} />
          </div>
        </Card>
      );
    case "expired":
      return (
        <Card title="La oferta venció">
          <Status kind="warn">Pasaron 15 minutos. Analiza tu wallet de nuevo para una oferta nueva.</Status>
          <div className="mt-6">
            <RestartButton onRestart={() => setSummary({ status: "none" })} label="Analizar de nuevo" />
          </div>
        </Card>
      );
  }
}

function RestartButton({ onRestart, label = "Volver a empezar" }: { onRestart: () => void; label?: string }) {
  return (
    <Button tone="secondary" onClick={onRestart}>
      {label}
    </Button>
  );
}

function WalletForm({
  onSubmit,
  error,
  resuming,
}: {
  onSubmit: (wallet: string) => Promise<void>;
  error?: string;
  resuming: boolean;
}) {
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const walletOk = /^(\$|https:\/\/)\S+\/\S+$/.test(wallet.trim());
  return (
    <Card title="Vincula tu wallet">
      {resuming && (
        <Status kind="info" className="mb-6">
          Tenías una autorización pendiente en tu wallet. Si no la terminaste, vuelve a empezar aquí.
        </Status>
      )}
      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(wallet.trim());
          } finally {
            setBusy(false);
          }
        }}
      >
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
          error={error}
        />
        <AuthorizationCard
          moves="Nada. Es un permiso de lectura."
          willHappen="Tu proveedor te pedirá autorizar que merit lea tu historial de pagos."
          wontHappen="merit no puede mover dinero con este permiso."
          undo="El permiso se revoca solo al calcular el score; también puedes revocarlo en tu wallet."
        />
        <Button
          type="submit"
          loading={busy}
          disabled={!walletOk}
          reason={walletOk ? undefined : "Escribe tu wallet address completa, por ejemplo https://ilp.interledger-test.dev/juan."}
        >
          Analizar mis movimientos
        </Button>
      </form>
    </Card>
  );
}

function Offer({ summary }: { summary: ActiveSummary }) {
  const asset = { assetCode: summary.assetCode, assetScale: summary.assetScale };
  const max: Amount = { value: summary.maxAmount ?? "0", ...asset };
  const maxInterest: Amount = { value: summary.maxInterest ?? "0", ...asset };
  return (
    <>
      <Card eyebrow="Tu score merit" title="Tienes un cupo">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <ScoreRing score={summary.score ?? 300} />
          <dl className="grid flex-1 gap-4 sm:grid-cols-3">
            <Figure label="Cupo" value={formatAmount(max)} tone="text-senal" />
            <Figure label="Interés" value={formatPercent((summary.ratePercent ?? 0) / 100, 0)} />
            <Figure label="Interés máximo" value={formatAmount(maxInterest)} />
          </dl>
        </div>
        <p className="mt-6 text-sm text-niebla">
          Calculado con los movimientos de <WalletAddress url={summary.walletAddress} /> de los últimos 90 días.
          {summary.expiresAt && ` La oferta vale hasta las ${new Date(summary.expiresAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`}
        </p>
      </Card>
      <AmountForm
        max={max}
        ratePercent={summary.ratePercent ?? 0}
        repaymentShare={summary.repaymentShare ?? 0.2}
        lockedReason={
          summary.quotaAvailable === false
            ? `No hay cupo disponible en ${summary.assetCode} ahora mismo. Vuelve cuando un prestamista aporte liquidez.`
            : undefined
        }
      />
    </>
  );
}

// The amount form. Locked until there is a score (04 §1.4). Unlocked, it is
// capped at the offer's maximum and shows the total due and the share of each
// income. Taking the loan arrives with the next phase of the plan.
function AmountForm({
  locked = false,
  lockedReason,
  max,
  ratePercent = 0,
  repaymentShare = 0.2,
}: {
  locked?: boolean;
  lockedReason?: string;
  max?: Amount;
  ratePercent?: number;
  repaymentShare?: number;
}) {
  const asset = max ?? { value: "0", assetCode: "COP", assetScale: 2 };
  const unit = BigInt(10) ** BigInt(asset.assetScale);
  const maxWhole = max ? Number(BigInt(max.value) / unit) : 0;
  const [amount, setAmount] = useState("");
  const n = Number(amount || 0);
  const minor = (whole: number): Amount => ({ ...asset, value: (BigInt(Math.round(whole)) * unit).toString() });
  const over = max ? n > maxWhole : false;
  const interest = Math.floor((n * ratePercent) / 100);
  const total = n + interest;
  const disabled = locked || Boolean(lockedReason) || !max;

  const reason = disabled
    ? lockedReason ?? "Primero analiza tu wallet: el monto se habilita cuando tengas tu score."
    : n <= 0
      ? "Escribe cuánto quieres pedir."
      : over
        ? `El monto supera tu cupo de ${formatAmount(max!)}. Baja el monto para continuar.`
        : "Todavía no se puede tomar el préstamo desde aquí.";

  return (
    <Card title="Cuánto quieres pedir" aria-disabled={disabled || undefined}>
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <Field
          id="amount"
          label="Monto"
          placeholder={max ? String(maxWhole) : "—"}
          inputMode="numeric"
          suffix={asset.assetCode}
          mono
          disabled={disabled}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          hint={max ? `Hasta ${formatAmount(max)}.` : "Se habilita con tu score."}
          error={!disabled && over && max ? `El monto supera tu cupo de ${formatAmount(max)}.` : undefined}
        />
        {!disabled && !over && n > 0 && (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Figure label="Interés" value={formatAmount(minor(interest))} />
              <Figure label="Total a pagar" value={formatAmount(minor(total))} />
              <Figure label="De cada ingreso" value={formatPercent(repaymentShare, 0)} />
            </dl>
            <AuthorizationCard
              moves={`Hasta ${formatAmount(minor(total))} en total, desde tu wallet, a medida que recibas ingresos.`}
              willHappen={`Cada vez que te entre dinero, el ${formatPercent(repaymentShare, 0)} va a quien te prestó, hasta completar ${formatAmount(minor(total))}.`}
              wontHappen={`merit no puede cobrar más de ${formatAmount(minor(total))} ni descontar dos veces el mismo ingreso.`}
              undo="Puedes revocar la autorización en tu wallet; el préstamo queda pendiente de pago."
            />
          </>
        )}
        <Button type="submit" disabled reason={reason}>
          {!disabled && n > 0 && !over ? `Pedir ${formatAmount(minor(n))}` : "Pedir préstamo"}
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
