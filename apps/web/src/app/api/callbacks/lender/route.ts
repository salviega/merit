import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { completeLenderCallback } from "@/lib/lending-flow";
import { readLenderGrantId } from "@/lib/session";

/** The lender's provider sends them back: verify the hash, continue the grant, activate the quota. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = await readLenderGrantId();
  const back = (query = "") => NextResponse.redirect(new URL(`/lending${query}`, serverEnv().APP_URL), 303);
  if (!id) return back("?error=session");
  try {
    const outcome = await completeLenderCallback(id, {
      interactRef: searchParams.get("interact_ref"),
      hash: searchParams.get("hash"),
      result: searchParams.get("result"),
    });
    if (outcome === "active") return back();
    return back(outcome === "declined" ? "?error=declined" : "?error=invalid");
  } catch (err) {
    console.error("lender callback failed:", err instanceof Error ? err.message : err);
    return back("?error=callback");
  }
}
