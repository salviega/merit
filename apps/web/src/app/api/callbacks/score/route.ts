import { after, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { readScoreRequestId } from "@/lib/session";
import { completeScoreCallback, computeScore } from "@/lib/score-flow";

/**
 * The provider sends the borrower back here with `interact_ref` and `hash`
 * (or `result=grant_rejected`). The hash is verified before the grant is
 * continued; the score is computed after the redirect is sent, so the widget
 * shows "Analizando…" while it happens.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = await readScoreRequestId();
  const back = (query = "") => NextResponse.redirect(new URL(`/borrowing${query}`, serverEnv().APP_URL), 303);
  if (!id) return back("?error=session");

  let outcome;
  try {
    outcome = await completeScoreCallback(id, {
      interactRef: searchParams.get("interact_ref"),
      hash: searchParams.get("hash"),
      result: searchParams.get("result"),
    });
  } catch (err) {
    console.error("score callback failed:", err instanceof Error ? err.message : err);
    return back("?error=callback");
  }

  if (outcome === "analyzing") {
    after(() => computeScore(id).catch((err) => console.error("score computation failed:", err)));
    return back();
  }
  if (outcome === "declined") return back("?error=declined");
  return back("?error=invalid");
}
