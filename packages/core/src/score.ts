import { minBigInt, percentOf, sumValues, type Amount } from "./amount";

// 05 §6, pure. The history is what the borrower's wallet returned for the
// window: completed incoming payments (receivedAmount) and non-failed
// outgoing payments (debitAmount). Version 1 of the parameters lives in one
// constant; calibrating them is a pending of 04 §8.

export type HistoryPayment = {
  id: string;
  createdAt: string;
  amount: Amount;
};

export type History = {
  incoming: HistoryPayment[];
  outgoing: HistoryPayment[];
};

export const SCORE_PARAMS = {
  windowDays: 90,
  weeks: 13,
  months: 3,
  activityTarget: 20,
  weights: { regularity: 300, activity: 200, net: 200 },
  repaidPoints: 25,
  repaidCap: 100,
  min: 300,
  max: 1000,
  tiers: [
    { minScore: 800, sharePercent: 50, ratePercent: 4 },
    { minScore: 650, sharePercent: 35, ratePercent: 6 },
    { minScore: 500, sharePercent: 20, ratePercent: 8 },
  ],
  repaymentShare: 0.2,
} as const;

export type ScoreInputs = {
  /** Average monthly income in minor units, as a bigint string. */
  monthlyIncome: string;
  regularity: number;
  activity: number;
  net: number;
  repaidLoans: number;
};

export type ScoreResult = { score: number; inputs: ScoreInputs };

const DAY = 86_400_000;

export function scoreFromHistory(
  history: History,
  { now, repaidLoans }: { now: Date; repaidLoans: number },
): ScoreResult {
  const since = now.getTime() - SCORE_PARAMS.windowDays * DAY;
  const inWindow = (p: HistoryPayment) => {
    const t = Date.parse(p.createdAt);
    return t >= since && t <= now.getTime();
  };
  const incoming = history.incoming.filter(inWindow);
  const outgoing = history.outgoing.filter(inWindow);

  const received = sumValues(incoming.map((p) => p.amount.value));
  const sent = sumValues(outgoing.map((p) => p.amount.value));

  const weeksWithIncome = new Set(
    incoming.map((p) => Math.floor((now.getTime() - Date.parse(p.createdAt)) / (7 * DAY))),
  );
  const regularity = Math.min(1, weeksWithIncome.size / SCORE_PARAMS.weeks);
  const activity = Math.min(1, incoming.length / SCORE_PARAMS.activityTarget);
  const net =
    received === BigInt(0)
      ? 0
      : Math.min(1, Math.max(0, Number(received - sent) / Number(received)));
  const repaid = Math.min(SCORE_PARAMS.repaidCap, SCORE_PARAMS.repaidPoints * Math.max(0, repaidLoans));

  const raw =
    SCORE_PARAMS.min +
    SCORE_PARAMS.weights.regularity * regularity +
    SCORE_PARAMS.weights.activity * activity +
    SCORE_PARAMS.weights.net * net +
    repaid;
  const score = Math.max(SCORE_PARAMS.min, Math.min(SCORE_PARAMS.max, Math.round(raw)));

  return {
    score,
    inputs: {
      monthlyIncome: (received / BigInt(SCORE_PARAMS.months)).toString(),
      regularity,
      activity,
      net,
      repaidLoans,
    },
  };
}

export type Offer = {
  /** `min(tier share × income, largest available quota)`, minor units. */
  maxAmount: string;
  /** Interest on the principal, integer percent (not annual: 04 §8). */
  ratePercent: number;
  maxInterest: string;
  /** Share of each incoming payment, 0–1. */
  repaymentShare: number;
};

/**
 * The offer for a score, or `null` when the borrower is rejected: under the
 * first tier, or nothing left to lend. `availableLimit` is the largest
 * available quota in the borrower's currency; when omitted the offer is the
 * tier's alone (the cap is applied again, with a real quota, when the loan
 * is taken: 05 §7).
 */
export function offerFor(score: number, monthlyIncome: bigint, availableLimit?: bigint): Offer | null {
  const tier = SCORE_PARAMS.tiers.find((t) => score >= t.minScore);
  if (!tier) return null;
  const byTier = percentOf(monthlyIncome, tier.sharePercent);
  const maxAmount = availableLimit === undefined ? byTier : minBigInt(byTier, availableLimit);
  if (maxAmount <= BigInt(0)) return null;
  return {
    maxAmount: maxAmount.toString(),
    ratePercent: tier.ratePercent,
    maxInterest: percentOf(maxAmount, tier.ratePercent).toString(),
    repaymentShare: SCORE_PARAMS.repaymentShare,
  };
}
