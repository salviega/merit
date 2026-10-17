// Seeds payment history between two test wallets so a freshly created
// borrower wallet has something to score (05 §10, "billeteras nuevas sin
// historial"). C pays B several times; B pays C once. Each paying wallet
// approves one interactive grant covering all of its payments.
//
//   pnpm seed:history            # 6 payments C→B, 1 payment B→C
//   pnpm seed:history 10         # 10 payments C→B
//
// Needs in .env: OPEN_PAYMENTS_*, SEED_BORROWER_WALLET (B), SEED_PAYER_WALLET (C).
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  type AuthenticatedClient,
  type WalletAddress,
} from "@interledger/open-payments";
import { getOpenPaymentsClient } from "@merit/core/open-payments";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const count = Number(process.argv[2] ?? 6);
const borrower = required("SEED_BORROWER_WALLET");
const payer = required("SEED_PAYER_WALLET");

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set in .env`);
  return value.startsWith("$") ? `https://${value.slice(1)}` : value;
}

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function pay(client: AuthenticatedClient, from: WalletAddress, to: WalletAddress, amounts: string[]) {
  // 1. Incoming payments on the receiver (non-interactive grant).
  const incomingGrant = await client.grant.request(
    { url: to.authServer },
    { access_token: { access: [{ type: "incoming-payment", actions: ["create", "read"] }] } },
  );
  if (!isFinalizedGrantWithAccessToken(incomingGrant)) throw new Error("incoming-payment grant not finalized");
  const incomingPayments = [];
  for (const value of amounts) {
    incomingPayments.push(
      await client.incomingPayment.create(
        { url: to.resourceServer, accessToken: incomingGrant.access_token.value },
        { walletAddress: to.id, incomingAmount: { value, assetCode: to.assetCode, assetScale: to.assetScale } },
      ),
    );
  }

  // 2. Quotes on the sender (non-interactive grant).
  const quoteGrant = await client.grant.request(
    { url: from.authServer },
    { access_token: { access: [{ type: "quote", actions: ["create", "read"] }] } },
  );
  if (!isFinalizedGrantWithAccessToken(quoteGrant)) throw new Error("quote grant not finalized");
  const quotes = [];
  for (const incoming of incomingPayments) {
    quotes.push(
      await client.quote.create(
        { url: from.resourceServer, accessToken: quoteGrant.access_token.value },
        { walletAddress: from.id, receiver: incoming.id, method: "ilp" },
      ),
    );
  }

  // 3. One interactive outgoing-payment grant on the sender, capped at the sum
  //    of the quotes' debitAmount, approved once by the wallet owner.
  const total = quotes.reduce((sum, q) => sum + BigInt(q.debitAmount.value), BigInt(0));
  const outgoingGrant = await client.grant.request(
    { url: from.authServer },
    {
      access_token: {
        access: [
          {
            type: "outgoing-payment",
            actions: ["create", "read"],
            identifier: from.id,
            limits: { debitAmount: { value: total.toString(), assetCode: from.assetCode, assetScale: from.assetScale } },
          },
        ],
      },
      interact: { start: ["redirect"] },
    },
  );
  if (!isPendingGrant(outgoingGrant)) throw new Error("outgoing-payment grant did not require interaction");

  console.log(`\nApprove ${amounts.length} payment(s) from ${from.id} (total ${total} minor units):`);
  console.log(`  ${outgoingGrant.interact.redirect}`);
  await rl.question("Press Enter once the wallet shows the grant as approved… ");

  const finalized = await client.grant.continue({
    url: outgoingGrant.continue.uri,
    accessToken: outgoingGrant.continue.access_token.value,
  });
  if (!isFinalizedGrantWithAccessToken(finalized)) throw new Error("grant not approved yet; run the script again");

  // 4. Pay each quote.
  for (const quote of quotes) {
    const outgoing = await client.outgoingPayment.create(
      { url: from.resourceServer, accessToken: finalized.access_token.value },
      { walletAddress: from.id, quoteId: quote.id },
    );
    console.log(`  paid ${quote.debitAmount.value} → ${outgoing.id}`);
  }
}

const client = await getOpenPaymentsClient();
const [b, c] = await Promise.all([
  client.walletAddress.get({ url: borrower }),
  client.walletAddress.get({ url: payer }),
]);
console.log(`Borrower ${b.id} (${b.assetCode}/${b.assetScale}) · Payer ${c.id} (${c.assetCode}/${c.assetScale})`);

// Varied amounts so the score sees regularity and volume: 25.00 to 75.00.
const unit = BigInt(10) ** BigInt(b.assetScale);
const incomingAmounts = Array.from({ length: count }, (_, i) => (BigInt(25 + (i % 6) * 10) * unit).toString());
await pay(client, c, b, incomingAmounts);
await pay(client, b, c, [(BigInt(12) * (BigInt(10) ** BigInt(c.assetScale))).toString()]);

rl.close();
console.log("\nDone. The borrower wallet now has history to score.");
