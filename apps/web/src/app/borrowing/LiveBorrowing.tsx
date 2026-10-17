"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Amount } from "@/components/Amount";
import { AuthorizationCard } from "@/components/AuthorizationCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Details } from "@/components/Details";
import { Field } from "@/components/Field";
import { ScoreRing } from "@/components/ScoreRing";
import { Skeleton } from "@/components/Skeleton";
import { Status } from "@/components/Status";
import { WalletAddress } from "@/components/WalletAddress";
import { formatAmount, formatPercent, type Amount as AmountValue } from "@/lib/format";

// The real flows 4.2 and 4.3 against /api/score and /api/loans. The browser
// only ever sees the provider's redirect URLs and the summaries of its own
// request and loan.

type ScoreSummary =
  | { status: "none" }
  | {
      status: "pending_grant" | "analyzing" | "approved" | "rejected" | "expired";
      walletAddress: string;
      assetCode: string;
      assetScale: number;
      score?: number;
      maxAmount?: string;
      ratePercent?: number;
      maxInterest?: string;
      repaymentShare?: number;
      quotaAvailable?: boolean;
      expiresAt?: string;
    };

type LoanSummary =
  | { status: "none" }
  | {
      status: "pending_grant" | "disbursing" | "active" | "paid" | "failed";
      borrowerWallet: string;
      assetCode: string;
      assetScale: number;
      principal: string;
      interest: string;
      totalDue: string;
      repaidAmount: string;
      repaymentShare: number;
      disbursementIncomingPayment?: string;
      disbursedAt?: string;
    };

type Active = Exclude<ScoreSummary, { status: "none" }>;
type ActiveLoan = Exclude<LoanSummary, { status: "none" }>;

const errors: Record<string, string> = {
  session: "No encontramos tu solicitud en este navegador. Empieza de nuevo.",
  declined: "No autorizaste la lectura en tu wallet. Sin ella no podemos calcular tu score.",
  loan_declined: "No autorizaste el cobro en tu wallet. El préstamo no se tomó y tu oferta sigue ahí.",
  invalid: "La vuelta desde tu wallet no coincide con lo que pedimos. Por seguridad, empieza de nuevo.",
  callback: "Tu wallet no respondió como esperábamos. Intenta de nuevo en un momento.",
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

async function postJson(url: string, body: unknown): Promise<{ redirect?: string; error?: string }> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return (await res.json().catch(() => ({ error: errors.callback }))) as { redirect?: string; error?: string };
}

export function LiveBorrowing() {
  const params = useSearchParams();
  const [score, setScore] = useState<ScoreSummary | "loading">("loading");
  const [loan, setLoan] = useState<LoanSummary>({ status: "none" });
  const [error, setError] = useState<string | undefined>(() => {
    const code = params.get("error");
    return code ? (errors[code] ?? errors.callback) : undefined;
  });

  const refresh = useCallback(
    () =>
      Promise.all([getJson<ScoreSummary>("/api/score"), getJson<LoanSummary>("/api/loans")]).then(([s, l]) => {
        if (s) setScore(s);
        if (l) setLoan(l);
      }),
    [],
  );

  const scoreStatus = score === "loading" ? undefined : score.status;
  const polling =
    scoreStatus === undefined ||
    scoreStatus === "analyzing" ||
    scoreStatus === "pending_grant" ||
    loan.status === "pending_grant" ||
    loan.status === "disbursing";
  useEffect(() => {
    // First load, then poll while something is happening at the provider or
    // on the server (score computation, disbursement).
    if (!polling) return;
    const timer = setInterval(refresh, scoreStatus === undefined ? 400 : 2000);
    return () => clearInterval(timer);
  }, [polling, scoreStatus, refresh]);

  if (score === "loading") {
    return (
      <Card title="Pedir préstamo">
        <Skeleton className="h-6 w-2/3" />
      </Card>
    );
  }

  const startScore = async (walletAddress: string) => {
    setError(undefined);
    const data = await postJson("/api/score", { walletAddress });
    if (!data.redirect) return setError(data.error ?? errors.callback);
    window.location.assign(data.redirect);
  };

  const takeLoan = async (amount: string) => {
    setError(undefined);
    const data = await postJson("/api/loans", { amount });
    if (!data.redirect) {
      setError(data.error ?? errors.callback);
      await refresh();
      return;
    }
    window.location.assign(data.redirect);
  };

  // A loan in progress or active takes over the screen.
  if (loan.status === "pending_grant" || loan.status === "disbursing" || loan.status === "active" || loan.status === "paid") {
    return <LoanView loan={loan} />;
  }

  switch (score.status) {
    case "none":
    case "pending_grant":
      return (
        <>
          <WalletForm onSubmit={startScore} error={error} resuming={score.status === "pending_grant"} />
          <AmountForm lockedReason="Primero analiza tu wallet: el monto se habilita cuando tengas tu score." />
        </>
      );
    case "analyzing":
      return (
        <>
          <Card title="Analizando tus movimientos…">
            <Status kind="info">
              Leyendo los pagos de los últimos 90 días de <WalletAddress url={score.walletAddress} className="text-hueso" />.
            </Status>
            <div className="mt-6 flex flex-col gap-3" aria-hidden>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <p className="mt-6 text-sm text-niebla">Suele tardar menos de un minuto. El permiso de lectura se revoca al terminar.</p>
          </Card>
          <AmountForm lockedReason="Estamos calculando tu score." />
        </>
      );
    case "approved":
      return <Offer score={score} failedLoan={loan.status === "failed"} error={error} onTake={takeLoan} />;
    case "rejected":
      return (
        <Card title="Todavía no podemos prestarte">
          <Status kind="warn">
            Tu score merit es {score.score ?? "—"} · {score.score !== undefined && score.score < 500 ? "Bajo" : "sin cupo disponible"}.
          </Status>
          <p className="mt-4 text-niebla">
            {score.score !== undefined && score.score >= 500
              ? `Tu score alcanza, pero ahora mismo no hay cupo disponible en ${score.assetCode}. Vuelve cuando alguien aporte liquidez.`
              : "El score sube con ingresos regulares: en cuántas de las últimas 13 semanas recibiste dinero y cuánto de eso se queda. Vuelve a analizar cuando tengas más movimientos."}
          </p>
          <div className="mt-6">
            <Button tone="secondary" onClick={() => setScore({ status: "none" })}>
              Volver a empezar
            </Button>
          </div>
        </Card>
      );
    case "expired":
      return (
        <Card title="La oferta venció">
          <Status kind="warn">Pasaron 15 minutos. Analiza tu wallet de nuevo para una oferta nueva.</Status>
          <div className="mt-6">
            <Button onClick={() => setScore({ status: "none" })}>Analizar de nuevo</Button>
          </div>
        </Card>
      );
  }
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

function Offer({
  score,
  failedLoan,
  error,
  onTake,
}: {
  score: Active;
  failedLoan: boolean;
  error?: string;
  onTake: (amount: string) => Promise<void>;
}) {
  const asset = { assetCode: score.assetCode, assetScale: score.assetScale };
  const max: AmountValue = { value: score.maxAmount ?? "0", ...asset };
  const maxInterest: AmountValue = { value: score.maxInterest ?? "0", ...asset };
  return (
    <>
      <Card eyebrow="Tu score merit" title="Tienes un cupo">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <ScoreRing score={score.score ?? 300} />
          <dl className="grid flex-1 gap-4 sm:grid-cols-3">
            <Figure label="Cupo" value={formatAmount(max)} tone="text-senal" />
            <Figure label="Interés" value={formatPercent((score.ratePercent ?? 0) / 100, 0)} />
            <Figure label="Interés máximo" value={formatAmount(maxInterest)} />
          </dl>
        </div>
        <p className="mt-6 text-sm text-niebla">
          Calculado con los movimientos de <WalletAddress url={score.walletAddress} /> de los últimos 90 días.
          {score.expiresAt &&
            ` La oferta vale hasta las ${new Date(score.expiresAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}.`}
        </p>
        {failedLoan && (
          <Status kind="warn" className="mt-4">
            El préstamo anterior no se completó. Nada se movió; puedes intentarlo de nuevo.
          </Status>
        )}
      </Card>
      <AmountForm
        max={max}
        ratePercent={score.ratePercent ?? 0}
        repaymentShare={score.repaymentShare ?? 0.2}
        error={error}
        onSubmit={onTake}
        lockedReason={
          score.quotaAvailable === false
            ? `No hay cupo disponible en ${score.assetCode} ahora mismo. Vuelve cuando un prestamista aporte liquidez.`
            : undefined
        }
      />
    </>
  );
}

function LoanView({ loan }: { loan: ActiveLoan }) {
  const asset = { assetCode: loan.assetCode, assetScale: loan.assetScale };
  const amount = (value: string): AmountValue => ({ value, ...asset });
  const remaining = (BigInt(loan.totalDue) - BigInt(loan.repaidAmount)).toString();
  const progress = loan.totalDue === "0" ? 0 : Number((BigInt(loan.repaidAmount) * BigInt(100)) / BigInt(loan.totalDue));

  if (loan.status === "pending_grant") {
    return (
      <Card title="Esperando tu autorización">
        <Status kind="info">
          Abrimos tu wallet para autorizar el cobro de hasta <Amount amount={amount(loan.totalDue)} />. Vuelve aquí cuando termines.
        </Status>
        <p className="mt-4 text-niebla">Si cerraste la pestaña, espera un momento: la pantalla se actualiza sola.</p>
      </Card>
    );
  }
  if (loan.status === "disbursing") {
    return (
      <Card title="Enviando el dinero a tu wallet…">
        <Status kind="info">
          Cotizando y pagando <Amount amount={amount(loan.principal)} /> desde la wallet de quien te presta.
        </Status>
        <div className="mt-6 flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </Card>
    );
  }
  return (
    <Card eyebrow={loan.status === "paid" ? "Préstamo pagado" : "Préstamo recibido"} title={loan.status === "paid" ? "Pagaste todo" : "El dinero está en tu wallet"}>
      <Status kind="ok">
        {loan.status === "paid" ? (
          <>Pagaste <Amount amount={amount(loan.totalDue)} />. Tu score merit sube con este préstamo.</>
        ) : (
          <>
            Recibiste <Amount amount={amount(loan.principal)} />. Se descontará el {formatPercent(loan.repaymentShare, 0)} de cada ingreso hasta pagar{" "}
            <Amount amount={amount(loan.totalDue)} />.
          </>
        )}
      </Status>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Figure label="Total a pagar" value={formatAmount(amount(loan.totalDue))} />
        <Figure label="Pagado" value={formatAmount(amount(loan.repaidAmount))} tone="text-senal" />
        <Figure label="Falta" value={formatAmount(amount(remaining))} />
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
        Wallet: <WalletAddress url={loan.borrowerWallet} className="text-hueso" />
      </p>
      <div className="mt-4">
        <Details>
          <p>wallet: {loan.borrowerWallet}</p>
          {loan.disbursementIncomingPayment && <p>desembolso: {loan.disbursementIncomingPayment}</p>}
          {loan.disbursedAt && <p>recibido: {loan.disbursedAt}</p>}
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

// The amount form. Locked until there is a score (04 §1.4). Unlocked, it is
// capped at the offer's maximum and shows the total due and the share of each
// income before sending the borrower to authorise the repayment grant.
function AmountForm({
  lockedReason,
  max,
  ratePercent = 0,
  repaymentShare = 0.2,
  error,
  onSubmit,
}: {
  lockedReason?: string;
  max?: AmountValue;
  ratePercent?: number;
  repaymentShare?: number;
  error?: string;
  onSubmit?: (amount: string) => Promise<void>;
}) {
  const asset = max ?? { value: "0", assetCode: "COP", assetScale: 2 };
  const unit = BigInt(10) ** BigInt(asset.assetScale);
  const maxWhole = max ? Number(BigInt(max.value) / unit) : 0;
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const n = Number(amount || 0);
  const minor = (whole: number): AmountValue => ({ ...asset, value: (BigInt(Math.round(whole)) * unit).toString() });
  const over = max ? n > maxWhole : false;
  const interest = Math.floor((n * ratePercent) / 100);
  const total = n + interest;
  const locked = Boolean(lockedReason) || !max || !onSubmit;

  const reason = locked
    ? lockedReason ?? "Primero analiza tu wallet: el monto se habilita cuando tengas tu score."
    : n <= 0
      ? "Escribe cuánto quieres pedir."
      : over && max
        ? `El monto supera tu cupo de ${formatAmount(max)}. Baja el monto para continuar.`
        : undefined;

  return (
    <Card title="Cuánto quieres pedir" aria-disabled={locked || undefined}>
      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (reason || !onSubmit) return;
          setBusy(true);
          try {
            await onSubmit(String(n));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          id="amount"
          label="Monto"
          placeholder={max ? String(maxWhole) : "—"}
          inputMode="numeric"
          suffix={asset.assetCode}
          mono
          disabled={locked}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          hint={max ? `Hasta ${formatAmount(max)}.` : "Se habilita con tu score."}
          error={error ?? (!locked && over && max ? `El monto supera tu cupo de ${formatAmount(max)}.` : undefined)}
        />
        {!locked && !over && n > 0 && (
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
        <Button type="submit" loading={busy} disabled={Boolean(reason)} reason={reason}>
          {!locked && n > 0 && !over ? `Pedir ${formatAmount(minor(n))}` : "Pedir préstamo"}
        </Button>
        {!locked && (
          <p className="text-sm text-niebla">Te llevaremos a tu wallet para autorizar el cobro, con el total a pagar como tope, y volverás aquí.</p>
        )}
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
