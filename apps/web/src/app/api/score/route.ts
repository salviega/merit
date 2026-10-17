import { NextResponse } from "next/server";
import { z } from "zod";
import { readScoreRequestId, scoreCookie } from "@/lib/session";
import { scoreSummary, startScoreRequest } from "@/lib/score-flow";

const body = z.object({
  walletAddress: z
    .string()
    .trim()
    .min(3)
    .refine((v) => /^(\$|https:\/\/)\S+\/\S+$/.test(v), "a wallet address looks like https://host/path or $host/path"),
});

/** Start a score request: the browser gets the provider's redirect URL and a signed cookie. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe tu wallet address completa, por ejemplo https://ilp.interledger-test.dev/juan." }, { status: 400 });
  }
  try {
    const { id, redirect } = await startScoreRequest(parsed.data.walletAddress);
    const response = NextResponse.json({ redirect });
    response.cookies.set(scoreCookie(id));
    return response;
  } catch (err) {
    console.error("score request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "No pudimos encontrar esa wallet o pedirle la autorización. Revisa la dirección e intenta de nuevo." },
      { status: 502 },
    );
  }
}

/** The state and offer of this browser's request, or `none`. */
export async function GET() {
  const summary = await scoreSummary(await readScoreRequestId());
  return NextResponse.json(summary, { headers: { "cache-control": "no-store" } });
}
