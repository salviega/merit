"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type QuoteResponse = {
  quote: { id: string; debitAmount: Amount; receiveAmount: Amount };
  grant: { redirect: string; continueUri: string; continueToken: string };
};
type Amount = { value: string; assetCode: string; assetScale: number };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

function formatAmount({ value, assetCode, assetScale }: Amount) {
  return `${(Number(value) / 10 ** assetScale).toFixed(assetScale)} ${assetCode}`;
}

export default function Home() {
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState<QuoteResponse>();
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function run(step: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await step();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const requestQuote = () =>
    run(async () => {
      setResult(undefined);
      setQuote(await post("/payments/quote", { sender, receiver, amount }));
    });

  const pay = () =>
    run(async () => {
      if (!quote) return;
      setResult(
        await post("/payments/pay", {
          sender,
          quoteId: quote.quote.id,
          continueUri: quote.grant.continueUri,
          continueToken: quote.grant.continueToken,
        }),
      );
    });

  const input =
    "w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
  const button =
    "rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Interledger playground</h1>

      <section className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Sender wallet address
          <input className={input} value={sender} onChange={(e) => setSender(e.target.value)}
            placeholder="https://ilp.interledger-test.dev/alice" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Receiver wallet address
          <input className={input} value={receiver} onChange={(e) => setReceiver(e.target.value)}
            placeholder="https://ilp.interledger-test.dev/bob" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Amount received (minor units)
          <input className={input} value={amount} inputMode="numeric"
            onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button className={button} disabled={busy || !sender || !receiver} onClick={requestQuote}>
          1. Get quote
        </button>
      </section>

      {quote && (
        <section className="flex flex-col gap-3 rounded border border-zinc-300 p-4 dark:border-zinc-700">
          <p>
            Sender pays <strong>{formatAmount(quote.quote.debitAmount)}</strong>, receiver gets{" "}
            <strong>{formatAmount(quote.quote.receiveAmount)}</strong>.
          </p>
          <a className="underline" href={quote.grant.redirect} target="_blank" rel="noreferrer">
            2. Approve the payment in the sender&apos;s wallet
          </a>
          <button className={button} disabled={busy} onClick={pay}>
            3. Send payment
          </button>
        </section>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {result !== undefined && (
        <pre className="overflow-x-auto rounded bg-zinc-100 p-4 text-xs dark:bg-zinc-900">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
