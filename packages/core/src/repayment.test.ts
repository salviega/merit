import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { emptyDocument, type Document, type Loan } from "./db/schema";
import { openStore } from "./db/store";
import { dueFromIncoming, planRepayment, type ObservedIncoming } from "./repayment";

// 05 §5, the invariant: for each loan, what is charged never exceeds
// total_due, and every unit received in an incoming payment is charged at
// most once. These are the tests named in AGENTS.md. They were written
// before repayment.ts existed.

const run = promisify(execFile);
const usd = { assetCode: "USD", assetScale: 2 };
const disbursedAt = "2026-10-16T10:00:00.000Z";
const after = (minutes: number) => new Date(Date.parse(disbursedAt) + minutes * 60_000).toISOString();

function loan(over: Partial<Loan> = {}): Loan {
  return {
    id: "loan_1",
    scoreRequestId: "sr_1",
    lenderGrantId: "lg_1",
    borrowerWallet: "https://ilp.interledger-test.dev/juan",
    ...usd,
    principal: "30000",
    interest: "1800",
    totalDue: "31800",
    repaidAmount: "0",
    repaymentShare: 0.2,
    disbursementIncomingPayment: "https://ilp.interledger-test.dev/incoming-payments/disbursement",
    disbursedAt,
    reservedAmount: "30000",
    status: "active",
    createdAt: disbursedAt,
    ...over,
  };
}

function payment(id: string, received: string, createdAt = after(5), asset = usd): ObservedIncoming {
  return { id: `https://ilp.interledger-test.dev/incoming-payments/${id}`, createdAt, receivedAmount: { value: received, ...asset } };
}

function doc(l = loan()): Document {
  const d = emptyDocument();
  d.loans.push(l);
  d.lenderGrants.push({
    id: "lg_1",
    walletAddress: "https://ilp.interledger-test.dev/ana",
    ...usd,
    limitAmount: "100000",
    committedAmount: "30000",
    accessToken: "tok",
    manageUrl: "https://auth.example/token/1",
    continueUri: "https://auth.example/continue/1",
    continueToken: "ct",
    nonce: "n",
    finishNonce: "f",
    authServer: "https://auth.example",
    status: "active",
    createdAt: disbursedAt,
  });
  return d;
}

describe("dueFromIncoming", () => {
  it("charges the share of what is new in the payment", () => {
    expect(dueFromIncoming(payment("a", "10000"), loan(), BigInt(0))).toBe(BigInt(2000));
    expect(dueFromIncoming(payment("a", "25000"), loan(), BigInt(10000))).toBe(BigInt(3000));
  });

  it("charges nothing when the payment has not grown", () => {
    expect(dueFromIncoming(payment("a", "10000"), loan(), BigInt(10000))).toBe(BigInt(0));
    expect(dueFromIncoming(payment("a", "9000"), loan(), BigInt(10000))).toBe(BigInt(0));
  });

  it("never charges the disbursement payment", () => {
    const p = { ...payment("x", "30000"), id: loan().disbursementIncomingPayment! };
    expect(dueFromIncoming(p, loan(), BigInt(0))).toBe(BigInt(0));
  });

  it("never charges a payment created before the disbursement", () => {
    expect(dueFromIncoming(payment("old", "50000", after(-30)), loan(), BigInt(0))).toBe(BigInt(0));
  });

  it("ignores a payment in another asset", () => {
    expect(dueFromIncoming(payment("eur", "50000", after(1), { assetCode: "EUR", assetScale: 2 }), loan(), BigInt(0))).toBe(BigInt(0));
  });

  it("cuts the installment to the exact remaining balance", () => {
    expect(dueFromIncoming(payment("big", "500000"), loan({ repaidAmount: "30000" }), BigInt(0))).toBe(BigInt(1800));
    expect(dueFromIncoming(payment("big", "500000"), loan({ repaidAmount: "31800" }), BigInt(0))).toBe(BigInt(0));
  });
});

describe("planRepayment", () => {
  it("the same receivedAmount seen in two cycles yields one installment", () => {
    const d = doc();
    expect(planRepayment(d, "loan_1", payment("a", "10000"))?.amount).toBe("2000");
    expect(planRepayment(d, "loan_1", payment("a", "10000"))).toBeNull();
    expect(d.repayments).toHaveLength(1);
    expect(d.observedIncomingPayments).toEqual([
      { loanId: "loan_1", incomingPaymentId: payment("a", "1").id, processedAmount: "10000" },
    ]);
    expect(d.loans[0]?.repaidAmount).toBe("2000");
  });

  it("a payment that grows in two parts yields two installments for the difference", () => {
    const d = doc();
    planRepayment(d, "loan_1", payment("a", "10000"));
    const second = planRepayment(d, "loan_1", payment("a", "25000"));
    expect(second?.amount).toBe("3000");
    expect(d.repayments.map((r) => r.amount)).toEqual(["2000", "3000"]);
    expect(d.observedIncomingPayments[0]?.processedAmount).toBe("25000");
    expect(d.loans[0]?.repaidAmount).toBe("5000");
  });

  it("the disbursement payment and anything before disbursed_at yield nothing and are not observed", () => {
    const d = doc();
    expect(planRepayment(d, "loan_1", { ...payment("x", "30000"), id: loan().disbursementIncomingPayment! })).toBeNull();
    expect(planRepayment(d, "loan_1", payment("old", "50000", after(-1)))).toBeNull();
    expect(d.observedIncomingPayments).toHaveLength(0);
    expect(d.repayments).toHaveLength(0);
  });

  it("cuts the last installment to the balance, marks the loan paid and gives the quota back", () => {
    const d = doc(loan({ repaidAmount: "30000" }));
    const last = planRepayment(d, "loan_1", payment("big", "500000"));
    expect(last?.amount).toBe("1800");
    expect(d.loans[0]?.status).toBe("paid");
    expect(d.loans[0]?.repaidAmount).toBe("31800");
    expect(d.loans[0]?.paidAt).toBeDefined();
    expect(d.lenderGrants[0]?.committedAmount).toBe("0");
    // Nothing more is ever charged.
    expect(planRepayment(d, "loan_1", payment("more", "999999"))).toBeNull();
  });

  it("does nothing for a loan that is not active", () => {
    const d = doc(loan({ status: "disbursing" }));
    expect(planRepayment(d, "loan_1", payment("a", "10000"))).toBeNull();
    expect(planRepayment(d, "zzz", payment("a", "10000"))).toBeNull();
  });

  it("two processes applying the same payments produce the same installments as one", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "merit-repayment-"));
    try {
      const file = path.join(dir, "merit.json");
      const store = openStore(file);
      await store.withTransaction((d) => Object.assign(d, doc()));
      const child = path.join(import.meta.dirname, "db", "test-helpers", "apply-repayments.ts");
      await Promise.all(
        [0, 1, 2].map(() =>
          run(process.execPath, ["--import", "tsx", child, file], { cwd: path.resolve(import.meta.dirname, "..") }),
        ),
      );
      const d = await store.read();
      // a: 10000 → 2000; a grows to 25000 → 3000; b: 5000 → 1000. Three installments, whoever applied them.
      expect(d.repayments.map((r) => r.amount).sort()).toEqual(["1000", "2000", "3000"]);
      expect(d.loans[0]?.repaidAmount).toBe("6000");
      expect(d.observedIncomingPayments).toHaveLength(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
