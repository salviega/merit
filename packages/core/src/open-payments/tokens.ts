import type { AuthenticatedClient } from "@interledger/open-payments";

// Access tokens expire (`expires_in`). Before using one, rotate it through
// its `manage` URL and keep the new value; when the provider refuses, the
// grant is gone and the caller marks the quota `revoked` (05 §8). The
// history token is revoked as soon as the score is computed: Merit keeps no
// read access it no longer needs.

export type TokenRef = { accessToken: string; manageUrl: string };

export async function rotateToken(client: Pick<AuthenticatedClient, "token">, token: TokenRef): Promise<TokenRef> {
  const rotated = await client.token.rotate({ url: token.manageUrl, accessToken: token.accessToken });
  return { accessToken: rotated.access_token.value, manageUrl: rotated.access_token.manage };
}

export async function revokeToken(client: Pick<AuthenticatedClient, "token">, token: TokenRef): Promise<void> {
  await client.token.revoke({ url: token.manageUrl, accessToken: token.accessToken });
}
