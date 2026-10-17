"use client";

import { useState } from "react";
import { Amount } from "@/components/Amount";
import { AuthorizationCard } from "@/components/AuthorizationCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Details } from "@/components/Details";
import { Field } from "@/components/Field";
import { StateSwitcher, useExampleState } from "@/components/StateSwitcher";
import { Status } from "@/components/Status";
import { WalletAddress } from "@/components/WalletAddress";
import { exampleLender, examplePayments } from "@/lib/examples";
import { formatAmount } from "@/lib/format";

// Screen states (04 §5, 04 §6 "Estados del cupo"):
//   form        → wallet address + quota, the authorization card, one button
//   authorizing → the lender is at their provider approving the grant (pendiente)
//   active      → quota, available, committed (activo)
//   revoked     → the grant stopped working (revocado)
const states = ["form", "authorizing", "active", "revoked"] as const;
const labels = {
  form: "formulario",
  authorizing: "autorizando",
  active: "cupo activo",
  revoked: "revocado",
};

export function LendingView() {
  const state = useExampleState(states, "form");
  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="label text-senal">Lending</p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
          Aportar liquidez
        </h1>
        <p className="text-niebla">
          Autorizas un cupo desde tu wallet. El dinero no sale hasta que alguien
          lo pide, y vuelve solo a medida que paga.
        </p>
      </header>

      {state === "form" && <LendingForm />}
      {state === "authorizing" && <Authorizing />}
      {state === "active" && <ActiveQuota />}
      {state === "revoked" && <Revoked />}

      <StateSwitcher states={states} labels={labels} current={state} />
    </>
  );
}

function LendingForm() {
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const walletOk = /^https:\/\/\S+\/\S+$/.test(wallet);
  const amountOk = /^\d+$/.test(amount) && Number(amount) > 0;
  const reason = !walletOk
    ? "Escribe tu wallet address completa, por ejemplo https://ilp.interledger-test.dev/ana."
    : !amountOk
      ? "Escribe el cupo en pesos, sin puntos ni decimales."
      : undefined;

  return (
    <Card title="Tu cupo">
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
        aria-describedby="lending-note"
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
        />
        <Field
          id="amount"
          label="Cupo que quieres prestar"
          placeholder="2000000"
          inputMode="numeric"
          suffix="COP"
          mono
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          hint="En la moneda de tu wallet. Es el tope: merit no puede prestar más que esto."
        />
        <AuthorizationCard
          moves="Tu dinero, solo cuando alguien toma un préstamo, y nunca más que el cupo."
          willHappen="Tu proveedor te mostrará el cupo y lo autorizarás una vez."
          wontHappen="merit no guarda tu dinero ni puede sacar más que el cupo."
          undo="Puedes revocar la autorización en tu wallet; lo ya prestado sigue volviendo."
        />
        <Button type="submit" tone="senal" disabled={Boolean(reason)} reason={reason}>
          Enviar y autorizar en mi wallet
        </Button>
        <p id="lending-note" className="text-sm text-niebla">
          Te llevaremos a tu proveedor para autorizar y volverás aquí.
        </p>
      </form>
    </Card>
  );
}

function Authorizing() {
  return (
    <Card title="Esperando tu autorización">
      <Status kind="info">
        Abrimos tu wallet en otra pestaña. Autoriza el cupo de{" "}
        <Amount amount={exampleLender.limit} /> y vuelve aquí.
      </Status>
      <p className="mt-4 text-niebla">
        Si cerraste la pestaña, puedes volver a empezar: nada se ha movido.
      </p>
      <div className="mt-6">
        <Button href="/lending" tone="secondary">
          Volver a empezar
        </Button>
      </div>
    </Card>
  );
}

function ActiveQuota() {
  const l = exampleLender;
  return (
    <Card eyebrow="Cupo activo" title="Tu cupo está disponible">
      <Status kind="ok">
        Tu cupo de <Amount amount={l.limit} /> está disponible. El dinero no sale
        de tu wallet hasta que se preste.
      </Status>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Figure label="Cupo" amount={l.limit} />
        <Figure label="Disponible" amount={l.available} tone="text-senal" />
        <Figure label="Comprometido" amount={l.committed} />
      </dl>
      <p className="mt-6 text-niebla">
        Wallet: <WalletAddress url={l.wallet} className="text-hueso" />
      </p>
      <div className="mt-4">
        <Details>
          <p>wallet: {l.wallet}</p>
          <p>grant: {examplePayments.lenderGrant}</p>
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

function Revoked() {
  return (
    <Card title="La autorización dejó de funcionar">
      <Status kind="error">
        Tu wallet revocó el permiso del cupo de {formatAmount(exampleLender.limit)}.
        No se prestará más con él.
      </Status>
      <p className="mt-4 text-niebla">
        Lo ya prestado sigue volviendo a tu wallet. Para prestar de nuevo,
        autoriza otro cupo.
      </p>
      <div className="mt-6">
        <Button href="/lending" tone="senal">
          Autorizar otro cupo
        </Button>
      </div>
    </Card>
  );
}

function Figure({
  label,
  amount,
  tone = "text-hueso",
}: {
  label: string;
  amount: (typeof exampleLender)["limit"];
  tone?: string;
}) {
  return (
    <div className="rounded-card-sm border border-linea bg-noche/40 p-4">
      <dt className="label text-niebla">{label}</dt>
      <dd className={`mt-2 text-xl ${tone}`}>
        <Amount amount={amount} />
      </dd>
    </div>
  );
}
