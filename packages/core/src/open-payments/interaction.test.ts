import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { interactionHash, verifyInteractionHash } from "./interaction";

// 05 §7: every interactive grant callback verifies the provider's `hash`
// before continuing the grant. GNAP §4.2.3 as Rafiki implements it:
// sha-256 over `clientNonce \n finishNonce \n interact_ref \n grantEndpoint`,
// base64.

const input = {
  clientNonce: "c-nonce",
  finishNonce: "s-nonce",
  interactRef: "ref-123",
  authServer: "https://auth.interledger-test.dev/tenant-1",
};

describe("interactionHash", () => {
  it("hashes the four values joined by newlines, sha-256, base64", () => {
    const expected = createHash("sha256")
      .update("c-nonce\ns-nonce\nref-123\nhttps://auth.interledger-test.dev/tenant-1")
      .digest("base64");
    expect(interactionHash(input)).toBe(expected);
  });
});

describe("verifyInteractionHash", () => {
  it("accepts the hash the auth server computed", () => {
    expect(verifyInteractionHash(input, interactionHash(input))).toBe(true);
  });

  it("rejects a hash for another interact_ref", () => {
    const other = interactionHash({ ...input, interactRef: "ref-999" });
    expect(verifyInteractionHash(input, other)).toBe(false);
  });

  it("rejects a hash for another client nonce", () => {
    const other = interactionHash({ ...input, clientNonce: "forged" });
    expect(verifyInteractionHash(input, other)).toBe(false);
  });

  it("rejects an empty or malformed hash without throwing", () => {
    expect(verifyInteractionHash(input, "")).toBe(false);
    expect(verifyInteractionHash(input, undefined)).toBe(false);
    expect(verifyInteractionHash(input, "not base64 at all!!")).toBe(false);
  });
});
