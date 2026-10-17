// Formatting rules from spec/definicion/09_marca-y-seo.md §5.
// Amounts are always `value` (bigint as string) + assetCode + assetScale, as
// Open Payments returns them; the UI converts with the wallet's scale and
// never does float math.

export type Amount = {
  value: string;
  assetCode: string;
  assetScale: number;
};

/**
 * `$300.000` for COP (no decimals in the UI), `$12,50 USD`-style for other
 * currencies with the wallet's scale. `withCode` appends the currency code,
 * for summaries and receipts.
 */
export function formatAmount(amount: Amount, { withCode = false } = {}) {
  const { value, assetCode, assetScale } = amount;
  const minor = BigInt(value);
  const factor = BigInt(10) ** BigInt(assetScale);
  const whole = minor / factor;
  const fraction = minor % factor;
  const isCop = assetCode.toUpperCase() === "COP";
  const decimals = isCop ? 0 : assetScale;

  const number =
    Number(whole) +
    (decimals > 0 ? Number(fraction) / Number(factor) : 0);

  let text: string;
  try {
    text = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: assetCode,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  } catch {
    // Unknown ISO code on the test network: plain grouping plus the code.
    text = `${new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number)} ${assetCode}`;
    return text;
  }
  return withCode ? `${text} ${assetCode}` : text;
}

/** `96,5 %`: one decimal, decimal comma, space before the sign. */
export function formatPercent(ratio: number, decimals = 1) {
  return `${new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio * 100)} %`;
}

/** `$wallet.ejemplo/ana`: the host and path in mono; the full URL goes behind "Detalles". */
export function abbreviateWallet(url: string) {
  try {
    const u = new URL(url);
    return `$${u.host}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}

export type ScoreBand = {
  label: "Bajo" | "Regular" | "Bueno" | "Excelente";
  tone: "coral" | "ambar" | "senal" | "lavanda";
};

/** Score 300–1000 (05 §6) → band label and colour (09 §3, brand/README). */
export function scoreBand(score: number): ScoreBand {
  if (score < 500) return { label: "Bajo", tone: "coral" };
  if (score < 650) return { label: "Regular", tone: "ambar" };
  if (score < 800) return { label: "Bueno", tone: "senal" };
  return { label: "Excelente", tone: "lavanda" };
}
