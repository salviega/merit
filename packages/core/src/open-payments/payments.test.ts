import { describe, expect, it, vi } from "vitest";
import { createIncomingPayment, createQuote, payQuote, type PaymentsClient } from "./payments";

// Moving money (04 §4.3 and §4.4): an incoming payment on the receiver, a
// quote on the sender, and the outgoing payment with the token of a grant the
// sender's owner approved. The non-interactive grants Merit requests for
// incoming payments and quotes carry no money; the outgoing payment never
// requests a grant here — it only spends the token it is given.

const receiver = {
  id: "https://ilp.interledger-test.dev/juan",
  authServer: "https://auth.interledger-test.dev/t1",
  resourceServer: "https://ilp.interledger-test.dev",
  assetCode: "USD",
  assetScale: 2,
};
const sender = { ...receiver, id: "https://ilp.interledger-test.dev/ana" };

function fakeClient(): PaymentsClient {
  return {
    grant: {
      request: vi.fn(async () => ({
        access_token: { value: "tok-np", manage: "https://auth.example/token/np", access: [] },
        continue: { uri: "https://auth.example/continue", access_token: { value: "c" } },
      })) as never,
    },
    incomingPayment: {
      create: vi.fn(async (_args: unknown, body: { incomingAmount?: { value: string } }) => ({
        id: "https://ilp.interledger-test.dev/incoming-payments/ip-1",
        incomingAmount: body.incomingAmount,
      })),
    } as never,
    quote: {
      create: vi.fn(async () => ({
        id: "https://ilp.interledger-test.dev/quotes/q-1",
        debitAmount: { value: "10050", assetCode: "USD", assetScale: 2 },
        receiveAmount: { value: "10000", assetCode: "USD", assetScale: 2 },
      })),
    } as never,
    outgoingPayment: {
      create: vi.fn(async () => ({ id: "https://ilp.interledger-test.dev/outgoing-payments/op-1", failed: false })),
    } as never,
  };
}

describe("createIncomingPayment", () => {
  it("requests a non-interactive incoming-payment grant on the receiver and creates the payment", async () => {
    const client = fakeClient();
    const payment = await createIncomingPayment(client, receiver, { value: "10000", assetCode: "USD", assetScale: 2 });
    expect(client.grant.request).toHaveBeenCalledWith(
      { url: receiver.authServer },
      { access_token: { access: [{ type: "incoming-payment", actions: ["create", "read"] }] } },
    );
    expect(client.incomingPayment.create).toHaveBeenCalledWith(
      { url: receiver.resourceServer, accessToken: "tok-np" },
      { walletAddress: receiver.id, incomingAmount: { value: "10000", assetCode: "USD", assetScale: 2 } },
    );
    expect(payment.id).toMatch(/incoming-payments\/ip-1$/);
  });

  it("refuses an amount in another asset than the receiver's", async () => {
    await expect(
      createIncomingPayment(fakeClient(), receiver, { value: "1", assetCode: "EUR", assetScale: 2 }),
    ).rejects.toThrow(/asset/);
  });
});

describe("createQuote", () => {
  it("requests a quote grant on the sender and quotes towards the incoming payment", async () => {
    const client = fakeClient();
    const quote = await createQuote(client, sender, "https://ilp.interledger-test.dev/incoming-payments/ip-1");
    expect(client.grant.request).toHaveBeenCalledWith(
      { url: sender.authServer },
      { access_token: { access: [{ type: "quote", actions: ["create", "read"] }] } },
    );
    expect(client.quote.create).toHaveBeenCalledWith(
      { url: sender.resourceServer, accessToken: "tok-np" },
      { walletAddress: sender.id, receiver: "https://ilp.interledger-test.dev/incoming-payments/ip-1", method: "ilp" },
    );
    expect(quote.debitAmount.value).toBe("10050");
  });
});

describe("payQuote", () => {
  it("creates the outgoing payment with the given token and never requests a grant", async () => {
    const client = fakeClient();
    const payment = await payQuote(client, sender, "https://ilp.interledger-test.dev/quotes/q-1", "tok-owner");
    expect(client.grant.request).not.toHaveBeenCalled();
    expect(client.outgoingPayment.create).toHaveBeenCalledWith(
      { url: sender.resourceServer, accessToken: "tok-owner" },
      { walletAddress: sender.id, quoteId: "https://ilp.interledger-test.dev/quotes/q-1" },
    );
    expect(payment.id).toMatch(/op-1$/);
  });
});
