import { createHash, timingSafeEqual } from "node:crypto";

// Interactive grants finish with a redirect to our callback carrying
// `interact_ref` and `hash`. The hash binds the callback to the grant we
// started (GNAP §4.2.3, openpayments.dev/identity/hash-verification):
// sha-256 over four values joined by "\n" — our nonce, the auth server's
// `interact.finish` nonce, the interact_ref and the grant endpoint URL.
//
// The spec text says "Base64 with no padding"; Rafiki (the test network)
// emits standard base64 with padding. Padding and url-safe alphabets are
// normalised away before comparing, so either is accepted and nothing else.

export type InteractionHashInput = {
  clientNonce: string;
  finishNonce: string;
  interactRef: string;
  /** The grant endpoint used for the initial request: the wallet's `authServer`. */
  authServer: string;
};

export function interactionHash({ clientNonce, finishNonce, interactRef, authServer }: InteractionHashInput): string {
  return createHash("sha256")
    .update(`${clientNonce}\n${finishNonce}\n${interactRef}\n${authServer}`, "ascii")
    .digest("base64");
}

const normalise = (value: string) => value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");

export function verifyInteractionHash(input: InteractionHashInput, received: string | null | undefined): boolean {
  if (!received) return false;
  const expected = Buffer.from(normalise(interactionHash(input)));
  const actual = Buffer.from(normalise(received));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
