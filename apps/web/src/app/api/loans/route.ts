import { NextResponse } from "next/server";
import { z } from "zod";
import { LoanError, loanSummary, startLoan } from "@/lib/loan-flow";
import { readScoreRequestId } from "@/lib/session";

const body = z.object({
  /** Whole units of the borrower's currency. */
  amount: z.string().trim().regex(/^\d+$/, "amount"),
});

/** Take the loan: reserve a quota and start the repayment grant. The server re-applies the offer's cap. */
export async function POST(request: Request) {
  const scoreRequestId = await readScoreRequestId();
  if (!scoreRequestId) {
    return NextResponse.json({ error: "Primero analiza tu wallet para tener una oferta." }, { status: 401 });
  }
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe cuánto quieres pedir, en números enteros." }, { status: 400 });
  }
  try {
    const { redirect } = await startLoan(scoreRequestId, parsed.data.amount);
    return NextResponse.json({ redirect });
  } catch (err) {
    if (err instanceof LoanError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    console.error("loan request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "No pudimos pedirle la autorización a tu wallet. Intenta de nuevo en un momento." },
      { status: 502 },
    );
  }
}

/** The current loan of this browser's score request, or `none`. */
export async function GET() {
  return NextResponse.json(await loanSummary(await readScoreRequestId()), {
    headers: { "cache-control": "no-store" },
  });
}
