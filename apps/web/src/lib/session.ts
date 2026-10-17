import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "./env";

// The browser is tied to its score request by an httpOnly cookie signed with
// SESSION_SECRET (05 §4). It can see its own request's state and offer and
// nothing else; the id alone, without the signature, is worthless.

export const SCORE_COOKIE = "merit_score";
const MAX_AGE_SECONDS = 60 * 60 * 24;

function sign(value: string): string {
  return createHmac("sha256", serverEnv().SESSION_SECRET).update(value).digest("base64url");
}

export function sealScoreRequestId(id: string): string {
  return `${id}.${sign(id)}`;
}

export function openScoreRequestId(sealed: string | undefined): string | undefined {
  if (!sealed) return undefined;
  const dot = sealed.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const id = sealed.slice(0, dot);
  const signature = Buffer.from(sealed.slice(dot + 1));
  const expected = Buffer.from(sign(id));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return undefined;
  return id;
}

export async function readScoreRequestId(): Promise<string | undefined> {
  const jar = await cookies();
  return openScoreRequestId(jar.get(SCORE_COOKIE)?.value);
}

export function scoreCookie(id: string) {
  return {
    name: SCORE_COOKIE,
    value: sealScoreRequestId(id),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: serverEnv().APP_URL.startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
