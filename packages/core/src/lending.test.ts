import { describe, expect, it } from "vitest";
import { emptyDocument, type Document, type LenderGrant } from "./db/schema";
import { availableOf, largestAvailableQuota, releaseQuota, reserveQuota } from "./lending";

// 04 §6: a loan never exceeds a quota's available amount, is funded by one
// lender in one currency, and the reservation (`committed_amount`) is made
// in the same transaction that creates the loan (05 §5).

const usd = { assetCode: "USD", assetScale: 2 };

function grant(id: string, limit: string, committed: string, extra: Partial<LenderGrant> = {}): LenderGrant {
  return {
    id,
    walletAddress: `https://ilp.interledger-test.dev/${id}`,
    ...usd,
    limitAmount: limit,
    committedAmount: committed,
    accessToken: "tok",
    manageUrl: "https://auth.example/token/1",
    continueUri: "https://auth.example/continue/1",
    continueToken: "ct",
    nonce: "n",
    finishNonce: "f",
    authServer: "https://auth.example",
    status: "active",
    createdAt: "2026-10-16T00:00:00.000Z",
    ...extra,
  };
}

function doc(...grants: LenderGrant[]): Document {
  return { ...emptyDocument(), lenderGrants: grants };
}

describe("availableOf", () => {
  it("is limit minus committed", () => {
    expect(availableOf(grant("a", "1000", "250"))).toBe(BigInt(750));
  });
});

describe("largestAvailableQuota", () => {
  it("returns the largest available among active quotas in that asset", () => {
    const d = doc(grant("a", "1000", "900"), grant("b", "500", "0"), grant("c", "10000", "0", { status: "pending" }));
    expect(largestAvailableQuota(d, usd)).toBe(BigInt(500));
  });

  it("ignores other assets and returns undefined when there is nothing", () => {
    const d = doc(grant("eur", "1000", "0", { assetCode: "EUR" }));
    expect(largestAvailableQuota(d, usd)).toBeUndefined();
  });
});

describe("reserveQuota", () => {
  it("reserves on the quota with the most available and returns it", () => {
    const d = doc(grant("a", "1000", "900"), grant("b", "500", "0"));
    const chosen = reserveQuota(d, usd, BigInt(300));
    expect(chosen.id).toBe("b");
    expect(d.lenderGrants.find((g) => g.id === "b")?.committedAmount).toBe("300");
    expect(d.lenderGrants.find((g) => g.id === "a")?.committedAmount).toBe("900");
  });

  it("refuses when no single quota can fund the amount", () => {
    const d = doc(grant("a", "1000", "900"), grant("b", "500", "300"));
    expect(() => reserveQuota(d, usd, BigInt(300))).toThrow(/no quota/i);
    expect(d.lenderGrants.map((g) => g.committedAmount)).toEqual(["900", "300"]);
  });

  it("marks a quota exhausted when the reservation uses the last unit", () => {
    const d = doc(grant("b", "500", "200"));
    reserveQuota(d, usd, BigInt(300));
    expect(d.lenderGrants[0]?.status).toBe("exhausted");
  });

  it("never reserves on a pending or revoked quota", () => {
    const d = doc(grant("p", "1000", "0", { status: "pending" }), grant("r", "1000", "0", { status: "revoked" }));
    expect(() => reserveQuota(d, usd, BigInt(1))).toThrow(/no quota/i);
  });

  it("refuses a non-positive amount", () => {
    expect(() => reserveQuota(doc(grant("b", "500", "0")), usd, BigInt(0))).toThrow(/positive/);
  });
});

describe("releaseQuota", () => {
  it("gives the amount back and reactivates an exhausted quota", () => {
    const d = doc(grant("b", "500", "500", { status: "exhausted" }));
    releaseQuota(d, "b", BigInt(200));
    expect(d.lenderGrants[0]?.committedAmount).toBe("300");
    expect(d.lenderGrants[0]?.status).toBe("active");
  });

  it("never goes below zero and leaves a revoked quota revoked", () => {
    const d = doc(grant("b", "500", "100", { status: "revoked" }));
    releaseQuota(d, "b", BigInt(900));
    expect(d.lenderGrants[0]?.committedAmount).toBe("0");
    expect(d.lenderGrants[0]?.status).toBe("revoked");
  });

  it("is a no-op for an unknown quota", () => {
    const d = doc(grant("b", "500", "100"));
    releaseQuota(d, "zzz", BigInt(50));
    expect(d.lenderGrants[0]?.committedAmount).toBe("100");
  });
});
