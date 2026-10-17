import { randomBytes, randomUUID } from "node:crypto";

export function newId(prefix: "sr" | "lg" | "loan" | "rp"): string {
  return `${prefix}_${randomUUID()}`;
}

/** A fresh nonce for an interactive grant's `interact.finish` (05 §7). */
export function newNonce(): string {
  return randomBytes(24).toString("base64url");
}
