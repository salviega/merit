import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "./env";

// A browser is tied to its own rows by httpOnly cookies signed with
// SESSION_SECRET (05 §4): one for the borrower's score request (and the loan
// that follows it), one for the lender's quota. A cookie shows its owner
// their own row's state and nothing else; the id without the signature is
// worthless.

export const SCORE_COOKIE = "merit_score";
export const LENDER_COOKIE = "merit_lender";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(value: string): string {
  return createHmac("sha256", serverEnv().SESSION_SECRET).update(value).digest("base64url");
}

export function sealId(id: string): string {
  return `${id}.${sign(id)}`;
}

export function openSealedId(sealed: string | undefined): string | undefined {
  if (!sealed) return undefined;
  const dot = sealed.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const id = sealed.slice(0, dot);
  const signature = Buffer.from(sealed.slice(dot + 1));
  const expected = Buffer.from(sign(id));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return undefined;
  return id;
}

export async function readSealedCookie(name: string): Promise<string | undefined> {
  const jar = await cookies();
  return openSealedId(jar.get(name)?.value);
}

export function sealedCookie(name: string, id: string) {
  return {
    name,
    value: sealId(id),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: serverEnv().APP_URL.startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export const readScoreRequestId = () => readSealedCookie(SCORE_COOKIE);
export const scoreCookie = (id: string) => sealedCookie(SCORE_COOKIE, id);
export const readLenderGrantId = () => readSealedCookie(LENDER_COOKIE);
export const lenderCookie = (id: string) => sealedCookie(LENDER_COOKIE, id);
