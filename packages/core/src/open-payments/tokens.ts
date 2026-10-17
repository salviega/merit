import type { AuthenticatedClient } from "@interledger/open-payments";

// Access tokens expire (`expires_in`). When the provider refuses one, rotate
// it through its `manage` URL and keep the new value; when rotation itself is
// refused, the grant is gone and the caller marks the quota `revoked`
// (05 §8). The history token is revoked as soon as the score is computed:
// Merit keeps no read access it no longer needs.

export type TokenRef = { accessToken: string; manageUrl: string };
type TokenClient = Pick<AuthenticatedClient, "token">;

export async function rotateToken(client: TokenClient, token: TokenRef): Promise<TokenRef> {
  const rotated = await client.token.rotate({ url: token.manageUrl, accessToken: token.accessToken });
  return { accessToken: rotated.access_token.value, manageUrl: rotated.access_token.manage };
}

export async function revokeToken(client: TokenClient, token: TokenRef): Promise<void> {
  await client.token.revoke({ url: token.manageUrl, accessToken: token.accessToken });
}

/** The provider rejected the token: `OpenPaymentsClientError.status` 401 or 403. */
export function isUnauthorized(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * Run `fn` with the token; if the provider rejects it, rotate once and retry.
 * Returns the token that worked so the caller persists it when it changed.
 * A refused rotation propagates: that grant no longer exists.
 */
export async function withFreshToken<T>(
  client: TokenClient,
  token: TokenRef,
  fn: (accessToken: string) => Promise<T>,
): Promise<{ result: T; token: TokenRef }> {
  try {
    return { result: await fn(token.accessToken), token };
  } catch (err) {
    if (!isUnauthorized(err)) throw err;
    const fresh = await rotateToken(client, token);
    return { result: await fn(fresh.accessToken), token: fresh };
  }
}
