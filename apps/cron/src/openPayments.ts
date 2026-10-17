import {
  createAuthenticatedClient,
  type AuthenticatedClient,
} from "@interledger/open-payments";
import { config } from "./config.js";

let client: Promise<AuthenticatedClient> | undefined;

export function getClient(): Promise<AuthenticatedClient> {
  const { OPEN_PAYMENTS_WALLET_ADDRESS, OPEN_PAYMENTS_KEY_ID } = config;
  if (!OPEN_PAYMENTS_WALLET_ADDRESS || !OPEN_PAYMENTS_KEY_ID) {
    throw new Error(
      "Open Payments is not configured: set OPEN_PAYMENTS_WALLET_ADDRESS and OPEN_PAYMENTS_KEY_ID",
    );
  }
  client ??= createAuthenticatedClient({
    walletAddressUrl: OPEN_PAYMENTS_WALLET_ADDRESS,
    keyId: OPEN_PAYMENTS_KEY_ID,
    privateKey: config.OPEN_PAYMENTS_PRIVATE_KEY_PATH,
  });
  return client;
}
