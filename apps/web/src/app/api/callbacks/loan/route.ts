import { after, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { completeLoanCallback, disburse } from "@/lib/loan-flow";
import { readScoreRequestId } from "@/lib/session";
import { getStore } from "@/lib/store";

/**
 * The borrower's provider sends them back after approving the repayment
 * grant: verify the hash, continue the grant, then disburse after responding
 * so the widget shows the loan arriving.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scoreRequestId = await readScoreRequestId();
  const back = (query = "") => NextResponse.redirect(new URL(`/borrowing${query}`, serverEnv().APP_URL), 303);
  if (!scoreRequestId) return back("?error=session");

  const loan = [...(await getStore().read()).loans].reverse().find((l) => l.scoreRequestId === scoreRequestId);
  if (!loan) return back("?error=invalid");

  try {
    const outcome = await completeLoanCallback(loan.id, {
      interactRef: searchParams.get("interact_ref"),
      hash: searchParams.get("hash"),
      result: searchParams.get("result"),
    });
    if (outcome === "disbursing") {
      after(() => disburse(loan.id).catch((err) => console.error("disbursement failed:", err)));
      return back();
    }
    return back(outcome === "declined" ? "?error=loan_declined" : "?error=invalid");
  } catch (err) {
    console.error("loan callback failed:", err instanceof Error ? err.message : err);
    return back("?error=callback");
  }
}
