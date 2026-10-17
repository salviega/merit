// Amounts travel as Open Payments returns them: `value` is a bigint kept as a
// string, never a float (04 §3). These helpers are the only arithmetic.

export type Amount = {
  value: string;
  assetCode: string;
  assetScale: number;
};

const digits = /^\d+$/;

export function toBigInt(value: string): bigint {
  if (!digits.test(value)) {
    throw new TypeError(`Not a minor-unit amount: ${JSON.stringify(value)}`);
  }
  return BigInt(value);
}

export function sumValues(values: Iterable<string>): bigint {
  let total = BigInt(0);
  for (const value of values) total += toBigInt(value);
  return total;
}

export function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/** `amount × percent / 100`, floored, in minor units. */
export function percentOf(amount: bigint, percent: number): bigint {
  if (!Number.isInteger(percent) || percent < 0) {
    throw new RangeError(`percent must be a non-negative integer, got ${percent}`);
  }
  return (amount * BigInt(percent)) / BigInt(100);
}

export function sameAsset(a: Pick<Amount, "assetCode" | "assetScale">, b: Pick<Amount, "assetCode" | "assetScale">) {
  return a.assetCode === b.assetCode && a.assetScale === b.assetScale;
}
