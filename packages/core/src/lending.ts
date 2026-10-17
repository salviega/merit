import type { Document, LenderGrant } from "./db/schema";

// Quotas (04 §3 `lender_grants`, 04 §6). A loan is funded by one quota in
// the borrower's currency; the reservation (`committed_amount`) happens in
// the same transaction that creates the loan, so two loans can never spend
// the same unit of a quota (05 §5). These functions mutate the document
// handed to them by `withTransaction()` and nothing else.

type Asset = { assetCode: string; assetScale: number };

export function availableOf(grant: Pick<LenderGrant, "limitAmount" | "committedAmount">): bigint {
  const available = BigInt(grant.limitAmount) - BigInt(grant.committedAmount);
  return available > BigInt(0) ? available : BigInt(0);
}

function fundable(doc: Document, asset: Asset): LenderGrant[] {
  return doc.lenderGrants.filter(
    (g) => g.status === "active" && g.assetCode === asset.assetCode && g.assetScale === asset.assetScale,
  );
}

/** The largest `limit − committed` among active quotas in that currency, or undefined when there is none. */
export function largestAvailableQuota(doc: Document, asset: Asset): bigint | undefined {
  let best: bigint | undefined;
  for (const grant of fundable(doc, asset)) {
    const available = availableOf(grant);
    if (best === undefined || available > best) best = available;
  }
  return best;
}

/**
 * Reserve `amount` on the active quota with the most available in that
 * currency. Throws when no single quota can fund it; the document is left
 * untouched in that case.
 */
export function reserveQuota(doc: Document, asset: Asset, amount: bigint): LenderGrant {
  if (amount <= BigInt(0)) throw new RangeError("reservation amount must be positive");
  const candidates = fundable(doc, asset)
    .filter((g) => availableOf(g) >= amount)
    .sort((a, b) => (availableOf(b) > availableOf(a) ? 1 : availableOf(b) < availableOf(a) ? -1 : 0));
  const chosen = candidates[0];
  if (!chosen) {
    throw new Error(`no quota in ${asset.assetCode} can fund ${amount} minor units`);
  }
  chosen.committedAmount = (BigInt(chosen.committedAmount) + amount).toString();
  if (availableOf(chosen) === BigInt(0)) chosen.status = "exhausted";
  return chosen;
}

/** Give a reservation back (a failed loan, a repaid loan). Never below zero; a revoked quota stays revoked. */
export function releaseQuota(doc: Document, grantId: string, amount: bigint): void {
  const grant = doc.lenderGrants.find((g) => g.id === grantId);
  if (!grant) return;
  const committed = BigInt(grant.committedAmount) - amount;
  grant.committedAmount = (committed > BigInt(0) ? committed : BigInt(0)).toString();
  if (grant.status === "exhausted" && availableOf(grant) > BigInt(0)) grant.status = "active";
}
