import { z } from "zod";

// The whole store is one JSON document, validated on every read and before
// every write. Collections follow 04 §3; amounts are bigint strings in the
// wallet's minor units; statuses follow 04 §6.

const minorUnits = z.string().regex(/^\d+$/, "minor units as a bigint string");
const url = z.string().url();
const isoDate = z.string().datetime();

export const lenderGrantStatus = z.enum(["pending", "active", "exhausted", "revoked"]);
export const scoreRequestStatus = z.enum(["pending_grant", "analyzing", "approved", "rejected", "expired"]);
export const loanStatus = z.enum(["pending_grant", "disbursing", "active", "paid", "failed"]);
export const repaymentStatus = z.enum(["pending", "paid", "failed"]);

/** What an interactive grant needs between the redirect and the callback (05 §7). */
const pendingInteraction = {
  continueUri: url,
  continueToken: z.string().min(1),
  /** Our nonce, sent in `interact.finish.nonce`. */
  nonce: z.string().min(1),
  /** The auth server's nonce, returned in `interact.finish` of the pending grant. */
  finishNonce: z.string().min(1),
  /** The auth server's grant endpoint, part of the hash the callback verifies. */
  authServer: url,
};

export const lenderGrant = z.object({
  id: z.string().min(1),
  walletAddress: url,
  assetCode: z.string().min(1),
  assetScale: z.number().int().min(0),
  /** The quota: `limits.debitAmount` of the grant. */
  limitAmount: minorUnits,
  /** Already disbursed. `limit − committed` is what is available. */
  committedAmount: minorUnits,
  accessToken: z.string().min(1).optional(),
  manageUrl: url.optional(),
  ...pendingInteraction,
  status: lenderGrantStatus,
  createdAt: isoDate,
  activatedAt: isoDate.optional(),
});

export const scoreRequest = z.object({
  id: z.string().min(1),
  walletAddress: url,
  assetCode: z.string().min(1),
  assetScale: z.number().int().min(0),
  resourceServer: url,
  ...pendingInteraction,
  /** The history token, only between the callback and the score; revoked and deleted after. */
  accessToken: z.string().min(1).optional(),
  manageUrl: url.optional(),
  /** Score 300–1000; absent until computed. */
  score: z.number().int().min(300).max(1000).optional(),
  monthlyIncome: minorUnits.optional(),
  maxAmount: minorUnits.optional(),
  ratePercent: z.number().int().min(0).optional(),
  maxInterest: minorUnits.optional(),
  repaymentShare: z.number().min(0).max(1).optional(),
  /** Whether an active quota in this currency existed when the score was computed. */
  quotaAvailable: z.boolean().optional(),
  status: scoreRequestStatus,
  createdAt: isoDate,
  scoredAt: isoDate.optional(),
});

export const loan = z.object({
  id: z.string().min(1),
  scoreRequestId: z.string().min(1),
  lenderGrantId: z.string().min(1),
  borrowerWallet: url,
  assetCode: z.string().min(1),
  assetScale: z.number().int().min(0),
  principal: minorUnits,
  interest: minorUnits,
  /** `principal + interest`: the cap of the repayment grant. */
  totalDue: minorUnits,
  repaidAmount: minorUnits,
  /** Share of each incoming payment, 0–1. */
  repaymentShare: z.number().min(0).max(1),
  /** Pending repayment grant interaction, until the callback. */
  interaction: z.object(pendingInteraction).optional(),
  disbursementIncomingPayment: url.optional(),
  disbursementOutgoingPayment: url.optional(),
  disbursedAt: isoDate.optional(),
  /** What was reserved on the quota: the principal plus any quote fee. Released when paid or failed. */
  reservedAmount: minorUnits.optional(),
  paidAt: isoDate.optional(),
  status: loanStatus,
  createdAt: isoDate,
});

export const borrowerGrant = z.object({
  loanId: z.string().min(1),
  accessToken: z.string().min(1),
  manageUrl: url,
});

export const observedIncomingPayment = z.object({
  loanId: z.string().min(1),
  incomingPaymentId: url,
  /** How much of its `receivedAmount` has already been charged. */
  processedAmount: minorUnits,
});

export const repayment = z.object({
  id: z.string().min(1),
  loanId: z.string().min(1),
  sourceIncomingPayment: url,
  amount: minorUnits,
  /** The incoming payment created on the lender's wallet for this installment. */
  lenderIncomingPayment: url.optional(),
  outgoingPaymentId: url.optional(),
  status: repaymentStatus,
  createdAt: isoDate,
  paidAt: isoDate.optional(),
  attempts: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export const document = z
  .object({
    version: z.literal(1),
    lenderGrants: z.array(lenderGrant),
    scoreRequests: z.array(scoreRequest),
    loans: z.array(loan),
    borrowerGrants: z.array(borrowerGrant),
    observedIncomingPayments: z.array(observedIncomingPayment),
    repayments: z.array(repayment),
  })
  .superRefine((doc, ctx) => {
    // 05 §5: (loan_id, incoming_payment_id) is unique. The store refuses to
    // write a document that breaks it, whichever code path tried.
    const seen = new Set<string>();
    doc.observedIncomingPayments.forEach((row, index) => {
      const key = `${row.loanId}\n${row.incomingPaymentId}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["observedIncomingPayments", index],
          message: `duplicate observedIncomingPayments entry for loan ${row.loanId} and payment ${row.incomingPaymentId}`,
        });
      }
      seen.add(key);
    });
    for (const [name, rows] of [
      ["lenderGrants", doc.lenderGrants],
      ["scoreRequests", doc.scoreRequests],
      ["loans", doc.loans],
      ["repayments", doc.repayments],
    ] as const) {
      const ids = new Set<string>();
      rows.forEach((row, index) => {
        if (ids.has(row.id)) {
          ctx.addIssue({ code: "custom", path: [name, index, "id"], message: `duplicate id ${row.id}` });
        }
        ids.add(row.id);
      });
    }
  });

export type Document = z.infer<typeof document>;
export type LenderGrant = z.infer<typeof lenderGrant>;
export type ScoreRequest = z.infer<typeof scoreRequest>;
export type Loan = z.infer<typeof loan>;
export type BorrowerGrant = z.infer<typeof borrowerGrant>;
export type ObservedIncomingPayment = z.infer<typeof observedIncomingPayment>;
export type Repayment = z.infer<typeof repayment>;

export function emptyDocument(): Document {
  return {
    version: 1,
    lenderGrants: [],
    scoreRequests: [],
    loans: [],
    borrowerGrants: [],
    observedIncomingPayments: [],
    repayments: [],
  };
}
