import { describe, expect, it, vi } from "vitest";
import { listHistory, type HistoryClient } from "./history";

// The borrower's history, lifted from the fetch_wallet.js PoC: paginate with
// `first`/`cursor` until the provider says there is no next page — but stop
// at `since`, and keep only what counts for the score (05 §6): completed
// incoming payments by receivedAmount, non-failed outgoing by debitAmount.

const now = new Date("2026-10-16T12:00:00.000Z");
const day = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
const usd = (value: string) => ({ value, assetCode: "USD", assetScale: 2 });
const wallet = {
  id: "https://ilp.interledger-test.dev/juan",
  resourceServer: "https://ilp.interledger-test.dev",
};

function pages<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function fakeClient(incoming: unknown[], outgoing: unknown[], pageSize = 2): HistoryClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  const paginated = (items: unknown[]) =>
    vi.fn(async (_args: unknown, pagination?: { first?: number; cursor?: string }) => {
      calls.push(pagination);
      const chunks = pages(items, pageSize);
      const index = pagination?.cursor ? Number(pagination.cursor) : 0;
      const result = chunks[index] ?? [];
      const hasNextPage = index + 1 < chunks.length;
      return {
        result,
        pagination: { hasNextPage, hasPreviousPage: index > 0, endCursor: String(index + 1), startCursor: String(index) },
      };
    });
  return {
    calls,
    incomingPayment: { list: paginated(incoming) as never },
    outgoingPayment: { list: paginated(outgoing) as never },
  };
}

const inc = (id: string, daysAgo: number, received: string, completed = true) => ({
  id: `https://ilp.interledger-test.dev/incoming-payments/${id}`,
  walletAddress: wallet.id,
  createdAt: day(daysAgo),
  receivedAmount: usd(received),
  completed,
});
const out = (id: string, daysAgo: number, debit: string, failed = false) => ({
  id: `https://ilp.interledger-test.dev/outgoing-payments/${id}`,
  walletAddress: wallet.id,
  createdAt: day(daysAgo),
  debitAmount: usd(debit),
  sentAmount: usd(debit),
  failed,
});

describe("listHistory", () => {
  it("follows the cursor through every page and maps amounts for the score", async () => {
    const client = fakeClient(
      [inc("a", 1, "100"), inc("b", 2, "200"), inc("c", 3, "300")],
      [out("x", 1, "50")],
    );
    const history = await listHistory(client, wallet, "tok", { since: new Date(day(90)) });
    expect(history.incoming.map((p) => p.amount.value)).toEqual(["100", "200", "300"]);
    expect(history.outgoing.map((p) => p.amount.value)).toEqual(["50"]);
    expect(client.calls.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  });

  it("asks for pages of 100 with the access token on the wallet's resource server", async () => {
    const client = fakeClient([inc("a", 1, "100")], []);
    await listHistory(client, wallet, "tok", { since: new Date(day(90)) });
    expect(client.incomingPayment.list).toHaveBeenCalledWith(
      { url: wallet.resourceServer, walletAddress: wallet.id, accessToken: "tok" },
      { first: 100, "wallet-address": wallet.id },
    );
  });

  it("stops paginating once a page reaches payments older than `since`", async () => {
    // Newest first, as the provider returns them: page 1 is in the window,
    // page 2 crosses `since`, page 3 must never be requested.
    const client = fakeClient(
      [inc("a", 1, "1"), inc("b", 2, "1"), inc("c", 3, "1"), inc("d", 120, "1"), inc("e", 130, "1"), inc("f", 140, "1")],
      [],
    );
    const history = await listHistory(client, wallet, "tok", { since: new Date(day(90)) });
    expect(history.incoming.map((p) => p.id.split("/").pop())).toEqual(["a", "b", "c"]);
    expect(client.incomingPayment.list).toHaveBeenCalledTimes(2);
  });

  it("drops incomplete incoming payments and failed outgoing payments", async () => {
    const client = fakeClient(
      [inc("ok", 1, "100"), inc("pending", 1, "0", false)],
      [out("ok", 1, "10"), out("failed", 1, "99", true)],
    );
    const history = await listHistory(client, wallet, "tok", { since: new Date(day(90)) });
    expect(history.incoming).toHaveLength(1);
    expect(history.outgoing).toHaveLength(1);
    expect(history.outgoing[0]?.amount.value).toBe("10");
  });
});
