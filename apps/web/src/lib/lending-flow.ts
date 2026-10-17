import "server-only";
import { isFinalizedGrantWithAccessToken, isPendingGrant } from "@interledger/open-payments";
import type { LenderGrant } from "@merit/core/db";
import { availableOf } from "@merit/core/lending";
import { quotaGrantRequest, verifyInteractionHash } from "@merit/core/open-payments";
import { getOpenPaymentsClient } from "@merit/core/open-payments";
import { serverEnv } from "./env";
import { newId, newNonce } from "./ids";
import { normalizeWalletAddress } from "./score-flow";
import { getStore } from "./store";

// Flow 4.1 (04): the lender authorises an outgoing-payment grant on their
// wallet with `limits.debitAmount` equal to the quota. The money stays in
// their wallet until a loan is disbursed from it.

export async function startQuota(walletAddressInput: string, wholeUnits: string): Promise<{ id: string; redirect: string }> {
  const client = await getOpenPaymentsClient();
  const wallet = await client.walletAddress.get({ url: normalizeWalletAddress(walletAddressInput) });
  if (!/^\d+$/.test(wholeUnits) || BigInt(wholeUnits) <= BigInt(0)) {
    throw new Error("quota must be a positive whole amount");
  }
  const limit = {
    value: (BigInt(wholeUnits) * BigInt(10) ** BigInt(wallet.assetScale)).toString(),
    assetCode: wallet.assetCode,
    assetScale: wallet.assetScale,
  };
  const id = newId("lg");
  const nonce = newNonce();
  const grant = await client.grant.request(
    { url: wallet.authServer },
    quotaGrantRequest(wallet, limit, { uri: `${serverEnv().APP_URL}/api/callbacks/lender`, nonce }),
  );
  if (!isPendingGrant(grant)) {
    throw new Error("The quota grant did not require interaction; refusing a quota the owner did not approve");
  }
  await getStore().withTransaction((doc) => {
    doc.lenderGrants.push({
      id,
      walletAddress: wallet.id,
      assetCode: wallet.assetCode,
      assetScale: wallet.assetScale,
      limitAmount: limit.value,
      committedAmount: "0",
      continueUri: grant.continue.uri,
      continueToken: grant.continue.access_token.value,
      nonce,
      finishNonce: grant.interact.finish,
      authServer: wallet.authServer,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });
  return { id, redirect: grant.interact.redirect };
}

export type LenderCallbackOutcome = "active" | "declined" | "invalid";

export async function completeLenderCallback(
  id: string,
  params: { interactRef: string | null; hash: string | null; result: string | null },
): Promise<LenderCallbackOutcome> {
  const store = getStore();
  const grantRow = (await store.read()).lenderGrants.find((g) => g.id === id);
  if (!grantRow || grantRow.status !== "pending") return "invalid";

  if (params.result === "grant_rejected" || !params.interactRef) {
    await store.withTransaction((doc) => {
      doc.lenderGrants = doc.lenderGrants.filter((g) => g.id !== id);
    });
    return "declined";
  }

  const valid = verifyInteractionHash(
    { clientNonce: grantRow.nonce, finishNonce: grantRow.finishNonce, interactRef: params.interactRef, authServer: grantRow.authServer },
    params.hash,
  );
  if (!valid) return "invalid";

  const client = await getOpenPaymentsClient();
  const grant = await client.grant.continue(
    { url: grantRow.continueUri, accessToken: grantRow.continueToken },
    { interact_ref: params.interactRef },
  );
  if (!isFinalizedGrantWithAccessToken(grant)) return "invalid";

  await store.withTransaction((doc) => {
    const row = doc.lenderGrants.find((g) => g.id === id);
    if (!row) return;
    row.status = "active";
    row.accessToken = grant.access_token.value;
    row.manageUrl = grant.access_token.manage;
    row.activatedAt = new Date().toISOString();
  });
  return "active";
}

export type LenderSummary =
  | { status: "none" }
  | {
      status: LenderGrant["status"];
      walletAddress: string;
      assetCode: string;
      assetScale: number;
      limitAmount: string;
      committedAmount: string;
      availableAmount: string;
      loans: number;
    };

/** What the lender's browser may see of its quota: never the token. */
export async function lenderSummary(id: string | undefined): Promise<LenderSummary> {
  if (!id) return { status: "none" };
  const doc = await getStore().read();
  const grant = doc.lenderGrants.find((g) => g.id === id);
  if (!grant) return { status: "none" };
  return {
    status: grant.status,
    walletAddress: grant.walletAddress,
    assetCode: grant.assetCode,
    assetScale: grant.assetScale,
    limitAmount: grant.limitAmount,
    committedAmount: grant.committedAmount,
    availableAmount: availableOf(grant).toString(),
    loans: doc.loans.filter((l) => l.lenderGrantId === id && l.status !== "failed").length,
  };
}
