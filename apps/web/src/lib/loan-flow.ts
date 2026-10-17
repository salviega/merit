import "server-only";
import { isFinalizedGrantWithAccessToken, isPendingGrant } from "@interledger/open-payments";
import { percentOf } from "@merit/core/amount";
import type { Loan } from "@merit/core/db";
import { availableOf, largestAvailableQuota, releaseQuota, reserveQuota } from "@merit/core/lending";
import {
  createIncomingPayment,
  createQuote,
  getOpenPaymentsClient,
  isUnauthorized,
  payQuote,
  repaymentGrantRequest,
  verifyInteractionHash,
  withFreshToken,
} from "@merit/core/open-payments";
import { offerFor } from "@merit/core/score";
import { serverEnv } from "./env";
import { newId, newNonce } from "./ids";
import { OFFER_TTL_MS } from "./score-flow";
import { getStore } from "./store";

// Flow 4.3 (04): the borrower picks an amount within the offer; Merit
// reserves a quota and asks for the repayment grant (capped at total_due);
// on return it continues the grant and disburses from the lender's wallet
// to the borrower's with the lender's token. The server recomputes the cap
// from the stored score and the quotas available now (05 §7): the browser
// cannot choose its offer.

export class LoanError extends Error {
  constructor(
    message: string,
    readonly code: "no_offer" | "expired" | "over_max" | "no_quota" | "active_loan" | "invalid",
  ) {
    super(message);
  }
}

export async function startLoan(scoreRequestId: string, wholeUnits: string): Promise<{ id: string; redirect: string }> {
  const store = getStore();
  const now = new Date();

  // 1. Validate and reserve, in one transaction.
  const created = await store.withTransaction((doc) => {
    const request = doc.scoreRequests.find((r) => r.id === scoreRequestId);
    if (!request || request.status !== "approved" || request.score === undefined || request.monthlyIncome === undefined) {
      throw new LoanError("Primero necesitas una oferta vigente.", "no_offer");
    }
    if (request.scoredAt && Date.parse(request.scoredAt) + OFFER_TTL_MS < now.getTime()) {
      request.status = "expired";
      throw new LoanError("La oferta venció. Analiza tu wallet de nuevo.", "expired");
    }
    if (doc.loans.some((l) => l.borrowerWallet === request.walletAddress && ["pending_grant", "disbursing", "active"].includes(l.status))) {
      throw new LoanError("Ya tienes un préstamo en curso. Cuando lo pagues podrás pedir otro.", "active_loan");
    }
    if (!/^\d+$/.test(wholeUnits) || BigInt(wholeUnits) <= BigInt(0)) {
      throw new LoanError("Escribe cuánto quieres pedir.", "invalid");
    }
    const asset = { assetCode: request.assetCode, assetScale: request.assetScale };
    const principal = BigInt(wholeUnits) * BigInt(10) ** BigInt(asset.assetScale);
    const available = largestAvailableQuota(doc, asset);
    const offer = offerFor(request.score, BigInt(request.monthlyIncome), available);
    if (!offer) {
      throw new LoanError(`No hay cupo disponible en ${asset.assetCode} ahora mismo.`, "no_quota");
    }
    if (principal > BigInt(offer.maxAmount)) {
      throw new LoanError("El monto supera tu cupo. Baja el monto para continuar.", "over_max");
    }
    const interest = percentOf(principal, offer.ratePercent);
    const quota = reserveQuota(doc, asset, principal);
    const loan: Loan = {
      id: newId("loan"),
      scoreRequestId,
      lenderGrantId: quota.id,
      borrowerWallet: request.walletAddress,
      ...asset,
      principal: principal.toString(),
      interest: interest.toString(),
      totalDue: (principal + interest).toString(),
      repaidAmount: "0",
      repaymentShare: offer.repaymentShare,
      status: "pending_grant",
      createdAt: now.toISOString(),
    };
    doc.loans.push(loan);
    return loan;
  });

  // 2. Ask the borrower's wallet for the repayment grant, capped at total_due.
  try {
    const client = await getOpenPaymentsClient();
    const wallet = await client.walletAddress.get({ url: created.borrowerWallet });
    const nonce = newNonce();
    const grant = await client.grant.request(
      { url: wallet.authServer },
      repaymentGrantRequest(
        wallet,
        { value: created.totalDue, assetCode: created.assetCode, assetScale: created.assetScale },
        { uri: `${serverEnv().APP_URL}/api/callbacks/loan`, nonce },
      ),
    );
    if (!isPendingGrant(grant)) throw new Error("The repayment grant did not require interaction");
    await store.withTransaction((doc) => {
      const loan = doc.loans.find((l) => l.id === created.id);
      if (!loan) return;
      loan.interaction = {
        continueUri: grant.continue.uri,
        continueToken: grant.continue.access_token.value,
        nonce,
        finishNonce: grant.interact.finish,
        authServer: wallet.authServer,
      };
    });
    return { id: created.id, redirect: grant.interact.redirect };
  } catch (err) {
    await failLoan(created.id, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/** The loan failed before disbursing: release the reservation. */
async function failLoan(id: string, reason: string, extraReserved = BigInt(0)) {
  await getStore().withTransaction((doc) => {
    const loan = doc.loans.find((l) => l.id === id);
    if (!loan || loan.status === "active" || loan.status === "paid") return;
    loan.status = "failed";
    delete loan.interaction;
    releaseQuota(doc, loan.lenderGrantId, BigInt(loan.principal) + extraReserved);
    console.error(`loan ${id} failed: ${reason}`);
  });
}

export type LoanCallbackOutcome = "disbursing" | "declined" | "invalid";

export async function completeLoanCallback(
  id: string,
  params: { interactRef: string | null; hash: string | null; result: string | null },
): Promise<LoanCallbackOutcome> {
  const store = getStore();
  const loan = (await store.read()).loans.find((l) => l.id === id);
  if (!loan || loan.status !== "pending_grant" || !loan.interaction) return "invalid";

  if (params.result === "grant_rejected" || !params.interactRef) {
    await failLoan(id, "the borrower declined the repayment grant");
    return "declined";
  }
  const { interaction } = loan;
  const valid = verifyInteractionHash(
    { clientNonce: interaction.nonce, finishNonce: interaction.finishNonce, interactRef: params.interactRef, authServer: interaction.authServer },
    params.hash,
  );
  if (!valid) return "invalid";

  const client = await getOpenPaymentsClient();
  const grant = await client.grant.continue(
    { url: interaction.continueUri, accessToken: interaction.continueToken },
    { interact_ref: params.interactRef },
  );
  if (!isFinalizedGrantWithAccessToken(grant)) return "invalid";

  await store.withTransaction((doc) => {
    const row = doc.loans.find((l) => l.id === id);
    if (!row) return;
    row.status = "disbursing";
    delete row.interaction;
    doc.borrowerGrants = doc.borrowerGrants.filter((g) => g.loanId !== id);
    doc.borrowerGrants.push({ loanId: id, accessToken: grant.access_token.value, manageUrl: grant.access_token.manage });
  });
  return "disbursing";
}

/**
 * Move the principal from the lender's wallet to the borrower's with the
 * lender's quota token. The quote's `debitAmount` may exceed the principal
 * (fees): the difference is reserved too, or the loan fails (05 §10).
 */
export async function disburse(id: string): Promise<void> {
  const store = getStore();
  const doc = await store.read();
  const loan = doc.loans.find((l) => l.id === id);
  if (!loan || loan.status !== "disbursing") return;
  const quota = doc.lenderGrants.find((g) => g.id === loan.lenderGrantId);
  if (!quota?.accessToken || !quota.manageUrl) {
    await failLoan(id, "the quota has no usable token");
    return;
  }

  let extraReserved = BigInt(0);
  try {
    const client = await getOpenPaymentsClient();
    const [borrowerWallet, lenderWallet] = await Promise.all([
      client.walletAddress.get({ url: loan.borrowerWallet }),
      client.walletAddress.get({ url: quota.walletAddress }),
    ]);
    const incoming = await createIncomingPayment(client, borrowerWallet, {
      value: loan.principal,
      assetCode: loan.assetCode,
      assetScale: loan.assetScale,
    });
    const quote = await createQuote(client, lenderWallet, incoming.id);

    const extra = BigInt(quote.debitAmount.value) - BigInt(loan.principal);
    if (extra > BigInt(0)) {
      await store.withTransaction((d) => {
        const g = d.lenderGrants.find((x) => x.id === quota.id);
        if (!g || availableOf(g) < extra) {
          throw new LoanError("La cotización supera el cupo disponible del prestamista.", "no_quota");
        }
        g.committedAmount = (BigInt(g.committedAmount) + extra).toString();
        if (availableOf(g) === BigInt(0)) g.status = "exhausted";
      });
      extraReserved = extra;
    }

    const { result: outgoing, token } = await withFreshToken(
      client,
      { accessToken: quota.accessToken, manageUrl: quota.manageUrl },
      (accessToken) => payQuote(client, lenderWallet, quote.id, accessToken),
    );

    await store.withTransaction((d) => {
      const row = d.loans.find((l) => l.id === id);
      const g = d.lenderGrants.find((x) => x.id === quota.id);
      if (g && token.accessToken !== quota.accessToken) {
        g.accessToken = token.accessToken;
        g.manageUrl = token.manageUrl;
      }
      if (!row) return;
      row.status = "active";
      row.reservedAmount = (BigInt(loan.principal) + extraReserved).toString();
      row.disbursementIncomingPayment = incoming.id;
      row.disbursementOutgoingPayment = outgoing.id;
      row.disbursedAt = new Date().toISOString();
    });
  } catch (err) {
    if (isUnauthorized(err)) {
      await store.withTransaction((d) => {
        const g = d.lenderGrants.find((x) => x.id === quota.id);
        if (g) g.status = "revoked";
      });
    }
    await failLoan(id, err instanceof Error ? err.message : String(err), extraReserved);
  }
}

export type LoanSummary =
  | { status: "none" }
  | {
      status: Loan["status"];
      borrowerWallet: string;
      assetCode: string;
      assetScale: number;
      principal: string;
      interest: string;
      totalDue: string;
      repaidAmount: string;
      repaymentShare: number;
      disbursementIncomingPayment?: string;
      disbursedAt?: string;
    };

/** The most recent loan of this browser's score request: never a token. */
export async function loanSummary(scoreRequestId: string | undefined): Promise<LoanSummary> {
  if (!scoreRequestId) return { status: "none" };
  const doc = await getStore().read();
  const loan = [...doc.loans].reverse().find((l) => l.scoreRequestId === scoreRequestId);
  if (!loan) return { status: "none" };
  const summary: LoanSummary = {
    status: loan.status,
    borrowerWallet: loan.borrowerWallet,
    assetCode: loan.assetCode,
    assetScale: loan.assetScale,
    principal: loan.principal,
    interest: loan.interest,
    totalDue: loan.totalDue,
    repaidAmount: loan.repaidAmount,
    repaymentShare: loan.repaymentShare,
  };
  if (loan.disbursementIncomingPayment) summary.disbursementIncomingPayment = loan.disbursementIncomingPayment;
  if (loan.disbursedAt) summary.disbursedAt = loan.disbursedAt;
  return summary;
}
