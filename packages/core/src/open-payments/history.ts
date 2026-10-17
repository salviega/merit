import type { AuthenticatedClient, WalletAddress } from "@interledger/open-payments";
import type { History, HistoryPayment } from "../score";

// The borrower's payment history, read with the history grant. Lifted from
// apps/api/fetch_wallet.js (`listAll`): pages of 100 following `cursor` while
// `hasNextPage` — but stopping as soon as a page reaches payments older than
// `since` (05 §6 reads 90 days; 05 §10 warns an unbounded listing grows).
// Only what the score counts is kept: completed incoming payments by
// `receivedAmount`, non-failed outgoing payments by `debitAmount`.

export type HistoryClient = {
  incomingPayment: Pick<AuthenticatedClient["incomingPayment"], "list">;
  outgoingPayment: Pick<AuthenticatedClient["outgoingPayment"], "list">;
};

type Wallet = Pick<WalletAddress, "id" | "resourceServer">;

export const PAGE_SIZE = 100;

type Listed = { id: string; createdAt: string };

/** Forward pagination as the SDK types it (`wallet-address` is required by the query type). */
export type Pagination = { first: number; "wallet-address": string; cursor?: string };

async function listSince<T extends Listed>(
  walletAddress: string,
  list: (pagination: Pagination) => Promise<{
    result: T[];
    pagination: { hasNextPage: boolean; endCursor?: string };
  }>,
  since: Date,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await list({
      first: PAGE_SIZE,
      "wallet-address": walletAddress,
      ...(cursor ? { cursor } : {}),
    });
    let reachedSince = false;
    for (const item of page.result) {
      if (Date.parse(item.createdAt) < since.getTime()) {
        reachedSince = true;
        continue;
      }
      items.push(item);
    }
    if (reachedSince || !page.pagination.hasNextPage || !page.pagination.endCursor) break;
    cursor = page.pagination.endCursor;
  }
  return items;
}

export async function listHistory(
  client: HistoryClient,
  wallet: Wallet,
  accessToken: string,
  { since }: { since: Date },
): Promise<History> {
  const args = { url: wallet.resourceServer, walletAddress: wallet.id, accessToken };
  const [incoming, outgoing] = await Promise.all([
    listSince(wallet.id, (pagination) => client.incomingPayment.list(args, pagination), since),
    listSince(wallet.id, (pagination) => client.outgoingPayment.list(args, pagination), since),
  ]);
  return {
    incoming: incoming
      .filter((p) => p.completed)
      .map<HistoryPayment>((p) => ({ id: p.id, createdAt: p.createdAt, amount: p.receivedAmount })),
    outgoing: outgoing
      .filter((p) => !p.failed)
      .map<HistoryPayment>((p) => ({ id: p.id, createdAt: p.createdAt, amount: p.debitAmount })),
  };
}
