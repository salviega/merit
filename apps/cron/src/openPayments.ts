import { createPrivateKey } from "node:crypto";
import {
  createAuthenticatedClient,
  type AuthenticatedClient,
} from "@interledger/open-payments";
import { config } from "./config.js";

let client: Promise<AuthenticatedClient> | undefined;

export function getClient(): Promise<AuthenticatedClient> {
  const {
    OPEN_PAYMENTS_WALLET_ADDRESS,
    OPEN_PAYMENTS_KEY_ID,
    OPEN_PAYMENTS_PRIVATE_KEY,
  } = config;
  if (
    !OPEN_PAYMENTS_WALLET_ADDRESS ||
    !OPEN_PAYMENTS_KEY_ID ||
    !OPEN_PAYMENTS_PRIVATE_KEY
  ) {
    throw new Error(
      "Open Payments is not configured: set OPEN_PAYMENTS_WALLET_ADDRESS, OPEN_PAYMENTS_KEY_ID and OPEN_PAYMENTS_PRIVATE_KEY in the root .env",
    );
  }
  client ??= createAuthenticatedClient({
    walletAddressUrl: OPEN_PAYMENTS_WALLET_ADDRESS,
    keyId: OPEN_PAYMENTS_KEY_ID,
    // The PEM travels base64-encoded in one env line; decode it back.
    privateKey: createPrivateKey(
      Buffer.from(OPEN_PAYMENTS_PRIVATE_KEY, "base64"),
    ),
  });
  return client;
}
