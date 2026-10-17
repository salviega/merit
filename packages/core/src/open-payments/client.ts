import { createPrivateKey } from "node:crypto";
import { createAuthenticatedClient, type AuthenticatedClient } from "@interledger/open-payments";

// Merit's one Open Payments client: it signs every request with the client
// key registered on Merit's own wallet address (05 §1). The PEM travels
// base64-encoded in one env line (`OPEN_PAYMENTS_PRIVATE_KEY`), so the same
// value works wherever the app runs.

export type ClientConfig = {
  walletAddressUrl: string;
  keyId: string;
  /** The private key PEM, base64 in one line. */
  privateKeyBase64: string;
};

export function clientConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ClientConfig {
  const walletAddressUrl = env.OPEN_PAYMENTS_WALLET_ADDRESS?.trim();
  const keyId = env.OPEN_PAYMENTS_KEY_ID?.trim();
  const privateKeyBase64 = env.OPEN_PAYMENTS_PRIVATE_KEY?.trim();
  if (!walletAddressUrl || !keyId || !privateKeyBase64) {
    throw new Error(
      "Open Payments is not configured: set OPEN_PAYMENTS_WALLET_ADDRESS, OPEN_PAYMENTS_KEY_ID and OPEN_PAYMENTS_PRIVATE_KEY in the root .env",
    );
  }
  return { walletAddressUrl, keyId, privateKeyBase64 };
}

let cached: Promise<AuthenticatedClient> | undefined;

export function getOpenPaymentsClient(config: ClientConfig = clientConfigFromEnv()): Promise<AuthenticatedClient> {
  cached ??= createAuthenticatedClient({
    walletAddressUrl: config.walletAddressUrl,
    keyId: config.keyId,
    privateKey: createPrivateKey(Buffer.from(config.privateKeyBase64, "base64")),
  });
  return cached;
}
