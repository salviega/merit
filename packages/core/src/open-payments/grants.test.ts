import { describe, expect, it } from "vitest";
import { historyGrantRequest, quotaGrantRequest, repaymentGrantRequest } from "./grants";

// 05 §7, the grant surface the provider enforces. These builders are pure so
// the exact access each grant asks for is pinned here: read-only history
// never has `create`; money grants always carry `limits.debitAmount`.

const wallet = {
  id: "https://ilp.interledger-test.dev/juan",
  authServer: "https://auth.interledger-test.dev/t1",
  resourceServer: "https://ilp.interledger-test.dev",
  assetCode: "USD",
  assetScale: 2,
};
const finish = { uri: "https://merit.example/api/callbacks/score", nonce: "n-1" };

describe("historyGrantRequest", () => {
  const body = historyGrantRequest(wallet, finish);

  it("asks to list and read incoming and outgoing payments of that wallet, nothing else", () => {
    expect(body.access_token?.access).toEqual([
      {
        type: "incoming-payment",
        actions: ["list", "list-all", "read", "read-all"],
        identifier: wallet.id,
      },
      {
        type: "outgoing-payment",
        actions: ["list", "list-all", "read", "read-all"],
        identifier: wallet.id,
      },
    ]);
    for (const access of body.access_token?.access ?? []) {
      expect(access.actions).not.toContain("create");
    }
  });

  it("is interactive with a redirect finish and our nonce", () => {
    expect(body.interact).toEqual({
      start: ["redirect"],
      finish: { method: "redirect", uri: finish.uri, nonce: finish.nonce },
    });
  });
});

describe("quotaGrantRequest", () => {
  it("caps outgoing payments at the lender's quota", () => {
    const body = quotaGrantRequest(wallet, { value: "500000", assetCode: "USD", assetScale: 2 }, finish);
    expect(body.access_token?.access).toEqual([
      {
        type: "outgoing-payment",
        actions: ["create", "read"],
        identifier: wallet.id,
        limits: { debitAmount: { value: "500000", assetCode: "USD", assetScale: 2 } },
      },
    ]);
    expect(body.interact?.finish?.nonce).toBe("n-1");
  });

  it("refuses a cap in another asset than the wallet's", () => {
    expect(() =>
      quotaGrantRequest(wallet, { value: "1", assetCode: "EUR", assetScale: 2 }, finish),
    ).toThrow(/asset/);
  });
});

describe("repaymentGrantRequest", () => {
  it("caps outgoing payments at total_due and reads incoming payments", () => {
    const body = repaymentGrantRequest(wallet, { value: "31800", assetCode: "USD", assetScale: 2 }, finish);
    expect(body.access_token?.access).toEqual([
      {
        type: "outgoing-payment",
        actions: ["create", "read"],
        identifier: wallet.id,
        limits: { debitAmount: { value: "31800", assetCode: "USD", assetScale: 2 } },
      },
      {
        type: "incoming-payment",
        actions: ["list", "list-all", "read", "read-all"],
        identifier: wallet.id,
      },
    ]);
  });
});
