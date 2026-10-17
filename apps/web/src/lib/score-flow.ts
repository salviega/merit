import "server-only";
import { isFinalizedGrantWithAccessToken, isPendingGrant } from "@interledger/open-payments";
import type { ScoreRequest } from "@merit/core/db";
import {
  getOpenPaymentsClient,
  historyGrantRequest,
  listHistory,
  revokeToken,
  verifyInteractionHash,
} from "@merit/core/open-payments";
import { offerFor, SCORE_PARAMS, scoreFromHistory } from "@merit/core/score";
import { serverEnv } from "./env";
import { newId, newNonce } from "./ids";
import { getStore } from "./store";

// Flow 4.2 (04): the borrower authorises a read-only grant on their wallet,
// Merit reads 90 days of payments, computes the score and the offer, and
// revokes the token. State lives in `scoreRequests`; the browser only ever
// gets the provider's redirect URL and, later, the summary below.

export const OFFER_TTL_MS = 15 * 60 * 1000;
const DAY = 86_400_000;

/** `$host/path` payment pointers become `https://host/path`. */
export function normalizeWalletAddress(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith("$") ? `https://${trimmed.slice(1)}` : trimmed;
}

export async function startScoreRequest(walletAddressInput: string): Promise<{ id: string; redirect: string }> {
  const client = await getOpenPaymentsClient();
  const wallet = await client.walletAddress.get({ url: normalizeWalletAddress(walletAddressInput) });
  const id = newId("sr");
  const nonce = newNonce();
  const grant = await client.grant.request(
    { url: wallet.authServer },
    historyGrantRequest(wallet, { uri: `${serverEnv().APP_URL}/api/callbacks/score`, nonce }),
  );
  if (!isPendingGrant(grant)) {
    throw new Error("The history grant did not require interaction; refusing to read without the owner's consent");
  }
  await getStore().withTransaction((doc) => {
    doc.scoreRequests.push({
      id,
      walletAddress: wallet.id,
      assetCode: wallet.assetCode,
      assetScale: wallet.assetScale,
      resourceServer: wallet.resourceServer,
      continueUri: grant.continue.uri,
      continueToken: grant.continue.access_token.value,
      nonce,
      finishNonce: grant.interact.finish,
      authServer: wallet.authServer,
      status: "pending_grant",
      createdAt: new Date().toISOString(),
    });
  });
  return { id, redirect: grant.interact.redirect };
}

export type CallbackOutcome = "analyzing" | "declined" | "invalid";

/**
 * The provider sent the borrower back. Verify the hash against our nonce
 * before touching the grant (05 §7); then continue it and mark the request
 * `analyzing`. The caller computes the score after responding.
 */
export async function completeScoreCallback(
  id: string,
  params: { interactRef: string | null; hash: string | null; result: string | null },
): Promise<CallbackOutcome> {
  const store = getStore();
  const request = (await store.read()).scoreRequests.find((r) => r.id === id);
  if (!request || request.status !== "pending_grant") return "invalid";

  if (params.result === "grant_rejected" || !params.interactRef) {
    await store.withTransaction((doc) => {
      doc.scoreRequests = doc.scoreRequests.filter((r) => r.id !== id);
    });
    return "declined";
  }

  const valid = verifyInteractionHash(
    {
      clientNonce: request.nonce,
      finishNonce: request.finishNonce,
      interactRef: params.interactRef,
      authServer: request.authServer,
    },
    params.hash,
  );
  if (!valid) return "invalid";

  const client = await getOpenPaymentsClient();
  const grant = await client.grant.continue(
    { url: request.continueUri, accessToken: request.continueToken },
    { interact_ref: params.interactRef },
  );
  if (!isFinalizedGrantWithAccessToken(grant)) return "invalid";

  await store.withTransaction((doc) => {
    const row = doc.scoreRequests.find((r) => r.id === id);
    if (!row) return;
    row.status = "analyzing";
    row.accessToken = grant.access_token.value;
    row.manageUrl = grant.access_token.manage;
  });
  return "analyzing";
}

/** Read the history, score it, store the offer, revoke the read token. */
export async function computeScore(id: string, now = new Date()): Promise<void> {
  const store = getStore();
  const request = (await store.read()).scoreRequests.find((r) => r.id === id);
  if (!request || request.status !== "analyzing" || !request.accessToken || !request.manageUrl) return;
  const token = { accessToken: request.accessToken, manageUrl: request.manageUrl };
  const client = await getOpenPaymentsClient();

  try {
    const history = await listHistory(
      client,
      { id: request.walletAddress, resourceServer: request.resourceServer },
      token.accessToken,
      { since: new Date(now.getTime() - SCORE_PARAMS.windowDays * DAY) },
    );
    await store.withTransaction((doc) => {
      const row = doc.scoreRequests.find((r) => r.id === id);
      if (!row) return;
      const repaidLoans = doc.loans.filter(
        (l) => l.borrowerWallet === row.walletAddress && l.status === "paid",
      ).length;
      const { score, inputs } = scoreFromHistory(history, { now, repaidLoans });
      const available = largestAvailableQuota(doc, row);
      const offer = offerFor(score, BigInt(inputs.monthlyIncome), available);
      row.score = score;
      row.monthlyIncome = inputs.monthlyIncome;
      row.quotaAvailable = available !== undefined;
      row.scoredAt = now.toISOString();
      if (offer) {
        row.status = "approved";
        row.maxAmount = offer.maxAmount;
        row.ratePercent = offer.ratePercent;
        row.maxInterest = offer.maxInterest;
        row.repaymentShare = offer.repaymentShare;
      } else {
        row.status = "rejected";
      }
    });
  } finally {
    // Merit keeps no read access it no longer needs (AGENTS.md).
    try {
      await revokeToken(client, token);
    } catch (err) {
      console.error(`could not revoke history token for ${id}:`, err instanceof Error ? err.message : err);
    }
    await store.withTransaction((doc) => {
      const row = doc.scoreRequests.find((r) => r.id === id);
      if (!row) return;
      delete row.accessToken;
      delete row.manageUrl;
    });
  }
}

/** The largest `limit − committed` among active quotas in the borrower's currency, or undefined when there is none. */
function largestAvailableQuota(
  doc: { lenderGrants: { status: string; assetCode: string; assetScale: number; limitAmount: string; committedAmount: string }[] },
  asset: { assetCode: string; assetScale: number },
): bigint | undefined {
  let best: bigint | undefined;
  for (const g of doc.lenderGrants) {
    if (g.status !== "active" || g.assetCode !== asset.assetCode || g.assetScale !== asset.assetScale) continue;
    const available = BigInt(g.limitAmount) - BigInt(g.committedAmount);
    if (best === undefined || available > best) best = available;
  }
  return best;
}

export type ScoreSummary =
  | { status: "none" }
  | {
      status: ScoreRequest["status"];
      walletAddress: string;
      assetCode: string;
      assetScale: number;
      score?: number;
      monthlyIncome?: string;
      maxAmount?: string;
      ratePercent?: number;
      maxInterest?: string;
      repaymentShare?: number;
      quotaAvailable?: boolean;
      expiresAt?: string;
    };

/** What the browser may see of its own request: never a token or a URL to rotate it. */
export async function scoreSummary(id: string | undefined, now = new Date()): Promise<ScoreSummary> {
  if (!id) return { status: "none" };
  const store = getStore();
  let request = (await store.read()).scoreRequests.find((r) => r.id === id);
  if (!request) return { status: "none" };

  if (request.status === "approved" && request.scoredAt && Date.parse(request.scoredAt) + OFFER_TTL_MS < now.getTime()) {
    request = await store.withTransaction((doc) => {
      const row = doc.scoreRequests.find((r) => r.id === id);
      if (row && row.status === "approved") row.status = "expired";
      return row;
    });
    if (!request) return { status: "none" };
  }

  const summary: ScoreSummary = {
    status: request.status,
    walletAddress: request.walletAddress,
    assetCode: request.assetCode,
    assetScale: request.assetScale,
  };
  if (request.score !== undefined) summary.score = request.score;
  if (request.monthlyIncome !== undefined) summary.monthlyIncome = request.monthlyIncome;
  if (request.maxAmount !== undefined) summary.maxAmount = request.maxAmount;
  if (request.ratePercent !== undefined) summary.ratePercent = request.ratePercent;
  if (request.maxInterest !== undefined) summary.maxInterest = request.maxInterest;
  if (request.repaymentShare !== undefined) summary.repaymentShare = request.repaymentShare;
  if (request.quotaAvailable !== undefined) summary.quotaAvailable = request.quotaAvailable;
  if (request.status === "approved" && request.scoredAt) {
    summary.expiresAt = new Date(Date.parse(request.scoredAt) + OFFER_TTL_MS).toISOString();
  }
  return summary;
}
