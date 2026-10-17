"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Amount } from "@/components/Amount";
import { AuthorizationCard } from "@/components/AuthorizationCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Details } from "@/components/Details";
import { Field } from "@/components/Field";
import { Skeleton } from "@/components/Skeleton";
import { Status } from "@/components/Status";
import { WalletAddress } from "@/components/WalletAddress";
import type { Amount as AmountValue } from "@/lib/format";

// The real flow 4.1 against /api/lenders. The browser only ever sees the
// provider's redirect URL and the summary of its own quota.

type Summary =
  | { status: "none" }
  | {
      status: "pending" | "active" | "exhausted" | "revoked";
      walletAddress: string;
      assetCode: string;
      assetScale: number;
      limitAmount: string;
      committedAmount: string;
      availableAmount: string;
      loans: number;
    };

const errors: Record<string, string> = {
  session: "No encontramos tu cupo en este navegador. Empieza de nuevo.",
  declined: "No autorizaste el cupo en tu wallet. Nada se movió.",
  invalid: "La vuelta desde tu wallet no coincide con lo que pedimos. Por seguridad, empieza de nuevo.",
  callback: "Tu wallet no respondió como esperábamos. Intenta de nuevo en un momento.",
};

export function LiveLending() {
  const params = useSearchParams();
  const [summary, setSummary] = useState<Summary | "loading">("loading");
  const [error, setError] = useState<string | undefined>(() => {
    const code = params.get("error");
    return code ? (errors[code] ?? errors.callback) : undefined;
  });
  const [restarted, setRestarted] = useState(false);

  const refresh = useCallback(
    () =>
      fetch("/api/lenders", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<Summary>) : null))
        .then((data) => {
          if (data) setSummary(data);
        })
        .catch(() => undefined),
    [],
  );

  const status = summary === "loading" ? undefined : summary.status;
  useEffect(() => {
    if (status !== undefined && status !== "pending") return;
    const timer = setInterval(refresh, status === undefined ? 400 : 3000);
    return () => clearInterval(timer);
  }, [status, refresh]);

  if (summary === "loading") {
    return (
      <Card title="Tu cupo">
        <Skeleton className="h-6 w-2/3" />
      </Card>
    );
  }

  const start = async (walletAddress: string, amount: string) => {
    setError(undefined);
    const res = await fetch("/api/lenders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress, amount }),
    });
    const data = (await res.json()) as { redirect?: string; error?: string };
    if (!res.ok || !data.redirect) {
      setError(data.error ?? errors.callback);
      return;
    }
    window.location.assign(data.redirect);
  };

  if (summary.status === "none" || summary.status === "pending" || restarted) {
    return <QuotaForm onSubmit={start} error={error} resuming={summary.status === "pending" && !restarted} />;
  }

  const asset = { assetCode: summary.assetCode, assetScale: summary.assetScale };
  const amount = (value: string): AmountValue => ({ value, ...asset });

  if (summary.status === "revoked") {
    return (
      <Card title="La autorización dejó de funcionar">
        <Status kind="error">
          Tu wallet revocó el permiso del cupo de <Amount amount={amount(summary.limitAmount)} />. No se prestará más con él.
        </Status>
        <p className="mt-4 text-niebla">Lo ya prestado sigue volviendo a tu wallet. Para prestar de nuevo, autoriza otro cupo.</p>
        <div className="mt-6">
          <Button tone="senal" onClick={() => setRestarted(true)}>
            Autorizar otro cupo
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card eyebrow={summary.status === "exhausted" ? "Cupo agotado" : "Cupo activo"} title={summary.status === "exhausted" ? "Todo tu cupo está prestado" : "Tu cupo está disponible"}>
      <Status kind="ok">
        Tu cupo de <Amount amount={amount(summary.limitAmount)} /> está autorizado. El dinero no sale de tu wallet hasta que se preste.
      </Status>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Figure label="Cupo" amount={amount(summary.limitAmount)} />
        <Figure label="Disponible" amount={amount(summary.availableAmount)} tone="text-senal" />
        <Figure label="Comprometido" amount={amount(summary.committedAmount)} />
      </dl>
      <p className="mt-6 text-niebla">
        Wallet: <WalletAddress url={summary.walletAddress} className="text-hueso" />
        {summary.loans > 0 && <> · {summary.loans} préstamo{summary.loans === 1 ? "" : "s"} financiado{summary.loans === 1 ? "" : "s"}</>}
      </p>
      <div className="mt-4">
        <Details>
          <p>wallet: {summary.walletAddress}</p>
        </Details>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button href="/" tone="secondary">
          Volver al inicio
        </Button>
        <Button tone="secondary" onClick={() => setRestarted(true)}>
          Autorizar otro cupo
        </Button>
      </div>
    </Card>
  );
}

function QuotaForm({
  onSubmit,
  error,
  resuming,
}: {
  onSubmit: (wallet: string, amount: string) => Promise<void>;
  error?: string;
  resuming: boolean;
}) {
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const walletOk = /^(\$|https:\/\/)\S+\/\S+$/.test(wallet.trim());
  const amountOk = /^\d+$/.test(amount) && Number(amount) > 0;
  const reason = !walletOk
    ? "Escribe tu wallet address completa, por ejemplo https://ilp.interledger-test.dev/ana."
    : !amountOk
      ? "Escribe el cupo en números enteros, sin puntos ni decimales."
      : undefined;

  return (
    <Card title="Tu cupo">
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
            await onSubmit(wallet.trim(), amount);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          id="wallet"
          label="Tu wallet address"
          placeholder="https://ilp.interledger-test.dev/ana"
          inputMode="url"
          autoComplete="off"
          mono
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          hint="La dirección pública de tu wallet. merit la usa para pedirte la autorización."
          error={error}
        />
        <Field
          id="amount"
          label="Cupo que quieres prestar"
          placeholder="100"
          inputMode="numeric"
          mono
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          hint="En la moneda de tu wallet, en unidades enteras. Es el tope: merit no puede prestar más que esto."
        />
        <AuthorizationCard
          moves="Tu dinero, solo cuando alguien toma un préstamo, y nunca más que el cupo."
          willHappen="Tu proveedor te mostrará el cupo y lo autorizarás una vez."
          wontHappen="merit no guarda tu dinero ni puede sacar más que el cupo."
          undo="Puedes revocar la autorización en tu wallet; lo ya prestado sigue volviendo."
        />
        <Button type="submit" tone="senal" loading={busy} disabled={Boolean(reason)} reason={reason}>
          Enviar y autorizar en mi wallet
        </Button>
      </form>
    </Card>
  );
}

function Figure({ label, amount, tone = "text-hueso" }: { label: string; amount: AmountValue; tone?: string }) {
  return (
    <div className="rounded-card-sm border border-linea bg-noche/40 p-4">
      <dt className="label text-niebla">{label}</dt>
      <dd className={`mt-2 text-xl ${tone}`}>
        <Amount amount={amount} />
      </dd>
    </div>
  );
}
