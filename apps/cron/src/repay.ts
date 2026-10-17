import type { AuthenticatedClient, WalletAddress } from "@interledger/open-payments";
import type { Loan, Repayment, Store } from "@merit/core/db";
import {
  createIncomingPayment,
  createQuote,
  isUnauthorized,
  listIncomingSince,
  payQuote,
  withFreshToken,
  type TokenRef,
} from "@merit/core/open-payments";
import { planRepayment } from "@merit/core/repayment";

// One repayment cycle (04 §4.4). For every active loan: settle installments
// still unpaid from earlier cycles, list the borrower's incoming payments
// since the disbursement with the repayment grant's token, record what each
// one owes inside a transaction (`planRepayment`), then move the money for
// each new installment outside the lock: incoming payment on the lender,
// quote from the borrower, outgoing payment with the borrower's token. The
// provider caps the whole thing at `total_due` (05 §5).

const MAX_ATTEMPTS = 5;

export type CycleDeps = {
  store: Store;
  client: AuthenticatedClient;
  log: (message: string) => void;
};

export async function runCycle({ store, client, log }: CycleDeps): Promise<void> {
  const doc = await store.read();
  const wallets = new Map<string, Promise<WalletAddress>>();
  const wallet = (url: string) => {
    let w = wallets.get(url);
    if (!w) {
      w = client.walletAddress.get({ url });
      wallets.set(url, w);
    }
    return w;
  };

  for (const loan of doc.loans.filter((l) => l.status === "active")) {
    const grant = doc.borrowerGrants.find((g) => g.loanId === loan.id);
    const quota = doc.lenderGrants.find((g) => g.id === loan.lenderGrantId);
    if (!grant || !quota || !loan.disbursedAt) {
      log(`loan ${loan.id}: no repayment grant or quota on record, skipping`);
      continue;
    }
    try {
      const [borrower, lender] = await Promise.all([wallet(loan.borrowerWallet), wallet(quota.walletAddress)]);
      const token: TokenRef = { accessToken: grant.accessToken, manageUrl: grant.manageUrl };

      // 1. Installments that did not settle in an earlier cycle.
      for (const pending of doc.repayments.filter((r) => r.loanId === loan.id && r.status !== "paid")) {
        if ((pending.attempts ?? 0) >= MAX_ATTEMPTS) continue;
        await settle({ store, client, log }, pending, { borrower, lender, token });
      }

      // 2. New income since the disbursement.
      const { result: payments, token: fresh } = await withFreshToken(client, token, (accessToken) =>
        listIncomingSince(client, borrower, accessToken, { since: new Date(loan.disbursedAt!) }),
      );
      if (fresh.accessToken !== token.accessToken) await persistBorrowerToken(store, loan.id, fresh);

      for (const payment of payments) {
        const installment = await store.withTransaction((d) => planRepayment(d, loan.id, payment));
        if (installment) {
          log(`loan ${loan.id}: ${installment.amount} due from ${payment.id}`);
          await settle({ store, client, log }, installment, { borrower, lender, token: fresh });
        }
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        log(`loan ${loan.id}: the borrower's wallet rejected the repayment grant; it may have been revoked`);
      }
      log(`loan ${loan.id}: cycle failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

type Parties = { borrower: WalletAddress; lender: WalletAddress; token: TokenRef };

/** Move one installment from the borrower to the lender and record the result. Retried as-is, never recalculated. */
async function settle({ store, client, log }: CycleDeps, installment: Repayment, { borrower, lender, token }: Parties) {
  try {
    const amount = { value: installment.amount, assetCode: lender.assetCode, assetScale: lender.assetScale };
    let lenderIncomingPayment = installment.lenderIncomingPayment;
    if (!lenderIncomingPayment) {
      lenderIncomingPayment = (await createIncomingPayment(client, lender, amount)).id;
      await store.withTransaction((d) => {
        const r = d.repayments.find((x) => x.id === installment.id);
        if (r) r.lenderIncomingPayment = lenderIncomingPayment;
      });
    }
    const quote = await createQuote(client, borrower, lenderIncomingPayment);
    const { result: outgoing, token: fresh } = await withFreshToken(client, token, (accessToken) =>
      payQuote(client, borrower, quote.id, accessToken),
    );
    if (fresh.accessToken !== token.accessToken) await persistBorrowerToken(store, installment.loanId, fresh);
    await store.withTransaction((d) => {
      const r = d.repayments.find((x) => x.id === installment.id);
      if (!r) return;
      r.status = "paid";
      r.outgoingPaymentId = outgoing.id;
      r.paidAt = new Date().toISOString();
      delete r.error;
    });
    log(`loan ${installment.loanId}: paid ${installment.amount} → ${outgoing.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await store.withTransaction((d) => {
      const r = d.repayments.find((x) => x.id === installment.id);
      if (!r) return;
      r.status = "failed";
      r.attempts = (r.attempts ?? 0) + 1;
      r.error = message;
    });
    log(`loan ${installment.loanId}: installment ${installment.id} failed (${message}); will retry`);
    if (isUnauthorized(err)) throw err;
  }
}

async function persistBorrowerToken(store: Store, loanId: Loan["id"], token: TokenRef) {
  await store.withTransaction((d) => {
    const g = d.borrowerGrants.find((x) => x.loanId === loanId);
    if (!g) return;
    g.accessToken = token.accessToken;
    g.manageUrl = token.manageUrl;
  });
}
