import type { AuthenticatedClient, WalletAddress } from "@interledger/open-payments";
import { sameAsset, type Amount } from "../amount";

/** What `client.grant.request()` takes: the SDK adds `client` itself. */
export type GrantRequest = Parameters<AuthenticatedClient["grant"]["request"]>[1];

// The grant surface of 05 §7, as pure request builders so what each grant
// asks for is pinned by tests. The wallet's provider enforces every cap:
// `limits.debitAmount` is set by the money's owner, never by Merit.

export type Finish = {
  /** Our callback, `APP_URL` + `/api/callbacks/<kind>`. */
  uri: string;
  /** Fresh per grant; verified against the provider's `hash` on return. */
  nonce: string;
};

type Wallet = Pick<WalletAddress, "id" | "authServer" | "assetCode" | "assetScale">;

const readOnlyActions = ["list", "list-all", "read", "read-all"] as const;

function interact(finish: Finish): NonNullable<GrantRequest["interact"]> {
  return {
    start: ["redirect"],
    finish: { method: "redirect", uri: finish.uri, nonce: finish.nonce },
  };
}

function assertWalletAsset(wallet: Wallet, cap: Amount) {
  if (!sameAsset(wallet, cap)) {
    throw new Error(
      `grant cap asset ${cap.assetCode}/${cap.assetScale} does not match the wallet's ${wallet.assetCode}/${wallet.assetScale}`,
    );
  }
}

/** Read the borrower's history (lifted from apps/api/fetch_wallet.js): no `create`. */
export function historyGrantRequest(wallet: Wallet, finish: Finish): GrantRequest {
  return {
    access_token: {
      access: [
        { type: "incoming-payment", actions: [...readOnlyActions], identifier: wallet.id },
        { type: "outgoing-payment", actions: [...readOnlyActions], identifier: wallet.id },
      ],
    },
    interact: interact(finish),
  };
}

/** The lender's quota: outgoing payments capped at the quota (04 §4.1). */
export function quotaGrantRequest(wallet: Wallet, quota: Amount, finish: Finish): GrantRequest {
  assertWalletAsset(wallet, quota);
  return {
    access_token: {
      access: [
        {
          type: "outgoing-payment",
          actions: ["create", "read"],
          identifier: wallet.id,
          limits: { debitAmount: quota },
        },
      ],
    },
    interact: interact(finish),
  };
}

/** The borrower's repayment: outgoing payments capped at total_due, plus reading their incoming payments (04 §4.3). */
export function repaymentGrantRequest(wallet: Wallet, totalDue: Amount, finish: Finish): GrantRequest {
  assertWalletAsset(wallet, totalDue);
  return {
    access_token: {
      access: [
        {
          type: "outgoing-payment",
          actions: ["create", "read"],
          identifier: wallet.id,
          limits: { debitAmount: totalDue },
        },
        { type: "incoming-payment", actions: [...readOnlyActions], identifier: wallet.id },
      ],
    },
    interact: interact(finish),
  };
}
