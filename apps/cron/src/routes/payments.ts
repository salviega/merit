import { Router } from "express";
import {
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
} from "@interledger/open-payments";
import { z } from "zod";
import { getClient } from "../openPayments.js";

export const payments = Router();

const walletQuery = z.object({ url: z.string().url() });

// Resolve a wallet address (public, no grant needed).
payments.get("/wallet", async (req, res) => {
  const { url } = walletQuery.parse(req.query);
  const client = await getClient();
  res.json(await client.walletAddress.get({ url }));
});

const quoteBody = z.object({
  sender: z.string().url(),
  receiver: z.string().url(),
  // Amount the receiver gets, in the receiver's asset minor units.
  amount: z.string().regex(/^\d+$/),
});

// Step 1: incoming payment on the receiver + quote on the sender, then start
// the interactive outgoing-payment grant. The user approves it at `redirect`.
payments.post("/quote", async (req, res) => {
  const { sender, receiver, amount } = quoteBody.parse(req.body);
  const client = await getClient();

  const [senderWallet, receiverWallet] = await Promise.all([
    client.walletAddress.get({ url: sender }),
    client.walletAddress.get({ url: receiver }),
  ]);

  const incomingGrant = await client.grant.request(
    { url: receiverWallet.authServer },
    {
      access_token: {
        access: [{ type: "incoming-payment", actions: ["create", "read"] }],
      },
    },
  );
  if (!isFinalizedGrantWithAccessToken(incomingGrant)) {
    throw new Error("Incoming payment grant was not finalized");
  }

  const incomingPayment = await client.incomingPayment.create(
    {
      url: receiverWallet.resourceServer,
      accessToken: incomingGrant.access_token.value,
    },
    {
      walletAddress: receiverWallet.id,
      incomingAmount: {
        value: amount,
        assetCode: receiverWallet.assetCode,
        assetScale: receiverWallet.assetScale,
      },
    },
  );

  const quoteGrant = await client.grant.request(
    { url: senderWallet.authServer },
    {
      access_token: {
        access: [{ type: "quote", actions: ["create", "read"] }],
      },
    },
  );
  if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
    throw new Error("Quote grant was not finalized");
  }

  const quote = await client.quote.create(
    {
      url: senderWallet.resourceServer,
      accessToken: quoteGrant.access_token.value,
    },
    {
      walletAddress: senderWallet.id,
      receiver: incomingPayment.id,
      method: "ilp",
    },
  );

  const outgoingGrant = await client.grant.request(
    { url: senderWallet.authServer },
    {
      access_token: {
        access: [
          {
            type: "outgoing-payment",
            actions: ["create", "read"],
            identifier: senderWallet.id,
            limits: { debitAmount: quote.debitAmount },
          },
        ],
      },
      interact: { start: ["redirect"] },
    },
  );
  if (!isPendingGrant(outgoingGrant)) {
    throw new Error("Outgoing payment grant did not require interaction");
  }

  res.json({
    incomingPayment,
    quote,
    grant: {
      redirect: outgoingGrant.interact.redirect,
      continueUri: outgoingGrant.continue.uri,
      continueToken: outgoingGrant.continue.access_token.value,
    },
  });
});

const payBody = z.object({
  sender: z.string().url(),
  quoteId: z.string().url(),
  continueUri: z.string().url(),
  continueToken: z.string(),
  // `interact_ref` returned to the redirect URI; omit when no finish URI was set.
  interactRef: z.string().optional(),
});

// Step 2: after the user approved the grant, continue it and pay the quote.
payments.post("/pay", async (req, res) => {
  const { sender, quoteId, continueUri, continueToken, interactRef } =
    payBody.parse(req.body);
  const client = await getClient();
  const senderWallet = await client.walletAddress.get({ url: sender });

  const grant = await client.grant.continue(
    { url: continueUri, accessToken: continueToken },
    interactRef ? { interact_ref: interactRef } : undefined,
  );
  if (!isFinalizedGrantWithAccessToken(grant)) {
    res.status(409).json({ error: "Grant not approved yet" });
    return;
  }

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: senderWallet.resourceServer,
      accessToken: grant.access_token.value,
    },
    { walletAddress: senderWallet.id, quoteId },
  );

  res.json({ outgoingPayment });
});
