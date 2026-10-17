import { randomUUID } from "node:crypto";
import { minBigInt, percentOf, sameAsset, type Amount } from "./amount";
import type { Document, Loan, Repayment } from "./db/schema";
import { releaseQuota } from "./lending";

// 04 §4.4 and 05 §5, pure. For each loan, what is charged never exceeds
// `total_due`, and every unit received in an incoming payment is charged at
// most once. `processed_amount` per incoming payment is the only record of
// what was already charged; the disbursement and anything before
// `disbursed_at` are never income. These functions mutate the document
// handed to them by `withTransaction()` and nothing else; moving the money
// happens afterwards, outside the lock, from the `pending` installment.

export type ObservedIncoming = {
  id: string;
  createdAt: string;
  /** What the payment has received so far; it can grow across cycles. */
  receivedAmount: Amount;
};

type LoanTerms = Pick<
  Loan,
  "disbursementIncomingPayment" | "disbursedAt" | "totalDue" | "repaidAmount" | "repaymentShare" | "assetCode" | "assetScale"
>;

/** The installment due for what is new in this payment, cut to the remaining balance. Zero when nothing is due. */
export function dueFromIncoming(payment: ObservedIncoming, loan: LoanTerms, processedAmount: bigint): bigint {
  if (payment.id === loan.disbursementIncomingPayment) return BigInt(0);
  if (loan.disbursedAt && Date.parse(payment.createdAt) < Date.parse(loan.disbursedAt)) return BigInt(0);
  if (!sameAsset(payment.receivedAmount, loan)) return BigInt(0);
  const fresh = BigInt(payment.receivedAmount.value) - processedAmount;
  if (fresh <= BigInt(0)) return BigInt(0);
  const remaining = BigInt(loan.totalDue) - BigInt(loan.repaidAmount);
  if (remaining <= BigInt(0)) return BigInt(0);
  const share = percentOf(fresh, Math.round(loan.repaymentShare * 100));
  return minBigInt(share, remaining);
}

/**
 * Record what this payment owes: advance `processed_amount`, add to
 * `repaid_amount`, insert the `pending` installment. When the balance is
 * reached the loan is `paid` and its reservation goes back to the quota.
 * Returns the installment to settle, or null when nothing is due.
 */
export function planRepayment(doc: Document, loanId: string, payment: ObservedIncoming, now = new Date()): Repayment | null {
  const loan = doc.loans.find((l) => l.id === loanId);
  if (!loan || loan.status !== "active") return null;

  const observed = doc.observedIncomingPayments.find((o) => o.loanId === loanId && o.incomingPaymentId === payment.id);
  const processed = observed ? BigInt(observed.processedAmount) : BigInt(0);
  const due = dueFromIncoming(payment, loan, processed);
  if (due === BigInt(0)) return null;

  if (observed) {
    observed.processedAmount = payment.receivedAmount.value;
  } else {
    doc.observedIncomingPayments.push({ loanId, incomingPaymentId: payment.id, processedAmount: payment.receivedAmount.value });
  }
  loan.repaidAmount = (BigInt(loan.repaidAmount) + due).toString();

  const repayment: Repayment = {
    id: `rp_${randomUUID()}`,
    loanId,
    sourceIncomingPayment: payment.id,
    amount: due.toString(),
    status: "pending",
    createdAt: now.toISOString(),
    attempts: 0,
  };
  doc.repayments.push(repayment);

  if (BigInt(loan.repaidAmount) >= BigInt(loan.totalDue)) {
    loan.status = "paid";
    loan.paidAt = now.toISOString();
    releaseQuota(doc, loan.lenderGrantId, BigInt(loan.reservedAmount ?? loan.principal));
  }
  return repayment;
}
