import {
  isFinalizedGrantWithAccessToken,
  type AuthenticatedClient,
  type IncomingPaymentWithPaymentMethods,
  type OutgoingPayment,
  type Quote,
  type WalletAddress,
} from "@interledger/open-payments";
import { sameAsset, type Amount } from "../amount";

// Moving money between two wallets (04 §4.3 disbursement, §4.4 repayment):
// an incoming payment on the receiver, a quote on the sender, and the
// outgoing payment created with the token of a grant the sender's owner
// approved — the quota or the repayment grant, both capped by them. The
// grants Merit requests here (incoming-payment, quote) carry no money and
// need no interaction. Ported from the playground in apps/cron.

export type PaymentsClient = {
  grant: Pick<AuthenticatedClient["grant"], "request">;
  incomingPayment: Pick<AuthenticatedClient["incomingPayment"], "create">;
  quote: Pick<AuthenticatedClient["quote"], "create">;
  outgoingPayment: Pick<AuthenticatedClient["outgoingPayment"], "create">;
};

type Wallet = Pick<WalletAddress, "id" | "authServer" | "resourceServer" | "assetCode" | "assetScale">;

async function nonInteractiveToken(
  client: PaymentsClient,
  authServer: string,
  type: "incoming-payment" | "quote",
): Promise<string> {
  const grant = await client.grant.request(
    { url: authServer },
    { access_token: { access: [{ type, actions: ["create", "read"] }] } },
  );
  if (!isFinalizedGrantWithAccessToken(grant)) {
    throw new Error(`${type} grant was not finalized without interaction`);
  }
  return grant.access_token.value;
}

/** An incoming payment on the receiver's wallet for exactly `amount`, in the receiver's asset. */
export async function createIncomingPayment(
  client: PaymentsClient,
  receiver: Wallet,
  amount: Amount,
): Promise<IncomingPaymentWithPaymentMethods> {
  if (!sameAsset(receiver, amount)) {
    throw new Error(`amount asset ${amount.assetCode}/${amount.assetScale} does not match the receiver's ${receiver.assetCode}/${receiver.assetScale}`);
  }
  const accessToken = await nonInteractiveToken(client, receiver.authServer, "incoming-payment");
  return client.incomingPayment.create(
    { url: receiver.resourceServer, accessToken },
    { walletAddress: receiver.id, incomingAmount: amount },
  );
}

/** A quote on the sender's wallet towards an incoming payment: its `debitAmount` is what the sender will actually pay. */
export async function createQuote(client: PaymentsClient, sender: Wallet, receiver: string): Promise<Quote> {
  const accessToken = await nonInteractiveToken(client, sender.authServer, "quote");
  return client.quote.create({ url: sender.resourceServer, accessToken }, { walletAddress: sender.id, receiver, method: "ilp" });
}

/** The outgoing payment, with a token from a grant the sender's owner approved. Requests nothing. */
export async function payQuote(
  client: PaymentsClient,
  sender: Pick<Wallet, "id" | "resourceServer">,
  quoteId: string,
  accessToken: string,
): Promise<OutgoingPayment> {
  return client.outgoingPayment.create({ url: sender.resourceServer, accessToken }, { walletAddress: sender.id, quoteId });
}
