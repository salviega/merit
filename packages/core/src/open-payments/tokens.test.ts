import { describe, expect, it, vi } from "vitest";
import { isUnauthorized, revokeToken, rotateToken, withFreshToken } from "./tokens";

// 05 §8: before using a token that the provider no longer accepts, rotate it
// through `manage_url` and keep the new value; if rotation is refused the
// grant is gone and the caller marks the quota revoked.

const token = { accessToken: "old", manageUrl: "https://auth.example/token/1" };

function fakeClient(rotateTo = "new") {
  return {
    token: {
      rotate: vi.fn(async () => ({
        access_token: { value: rotateTo, manage: "https://auth.example/token/2", access: [] },
      })),
      revoke: vi.fn(async () => undefined),
    },
  };
}

describe("rotateToken / revokeToken", () => {
  it("rotates through the manage url and returns the new reference", async () => {
    const client = fakeClient();
    expect(await rotateToken(client, token)).toEqual({ accessToken: "new", manageUrl: "https://auth.example/token/2" });
    expect(client.token.rotate).toHaveBeenCalledWith({ url: token.manageUrl, accessToken: "old" });
  });

  it("revokes through the manage url", async () => {
    const client = fakeClient();
    await revokeToken(client, token);
    expect(client.token.revoke).toHaveBeenCalledWith({ url: token.manageUrl, accessToken: "old" });
  });
});

describe("isUnauthorized", () => {
  it("recognises the provider's 401 and 403", () => {
    expect(isUnauthorized({ status: 401 })).toBe(true);
    expect(isUnauthorized({ status: 403 })).toBe(true);
    expect(isUnauthorized({ status: 500 })).toBe(false);
    expect(isUnauthorized(new Error("network"))).toBe(false);
  });
});

describe("withFreshToken", () => {
  it("uses the current token when the provider accepts it", async () => {
    const client = fakeClient();
    const fn = vi.fn(async (t: string) => `paid with ${t}`);
    const result = await withFreshToken(client, token, fn);
    expect(result).toEqual({ result: "paid with old", token });
    expect(client.token.rotate).not.toHaveBeenCalled();
  });

  it("rotates once and retries when the provider answers 401, returning the new token to persist", async () => {
    const client = fakeClient();
    const fn = vi
      .fn<(t: string) => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error("unauthorized"), { status: 401 }))
      .mockResolvedValueOnce("paid with new");
    const result = await withFreshToken(client, token, fn);
    expect(fn).toHaveBeenNthCalledWith(1, "old");
    expect(fn).toHaveBeenNthCalledWith(2, "new");
    expect(result).toEqual({ result: "paid with new", token: { accessToken: "new", manageUrl: "https://auth.example/token/2" } });
  });

  it("rethrows other errors without rotating", async () => {
    const client = fakeClient();
    const fn = vi.fn(async () => {
      throw Object.assign(new Error("boom"), { status: 500 });
    });
    await expect(withFreshToken(client, token, fn)).rejects.toThrow("boom");
    expect(client.token.rotate).not.toHaveBeenCalled();
  });

  it("surfaces a refused rotation so the caller can mark the grant revoked", async () => {
    const client = fakeClient();
    client.token.rotate.mockRejectedValueOnce(Object.assign(new Error("gone"), { status: 401 }));
    const fn = vi.fn(async () => {
      throw Object.assign(new Error("unauthorized"), { status: 401 });
    });
    await expect(withFreshToken(client, token, fn)).rejects.toThrow("gone");
  });
});
