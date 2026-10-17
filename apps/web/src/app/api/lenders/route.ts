import { NextResponse } from "next/server";
import { z } from "zod";
import { lenderSummary, startQuota } from "@/lib/lending-flow";
import { lenderCookie, readLenderGrantId } from "@/lib/session";

const body = z.object({
  walletAddress: z
    .string()
    .trim()
    .refine((v) => /^(\$|https:\/\/)\S+\/\S+$/.test(v), "wallet address"),
  /** Whole units of the wallet's currency. */
  amount: z.string().trim().regex(/^\d+$/, "amount"),
});

/** Start a quota: the browser gets the provider's redirect URL and a signed cookie. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Escribe tu wallet address completa y el cupo en números enteros, sin puntos." },
      { status: 400 },
    );
  }
  try {
    const { id, redirect } = await startQuota(parsed.data.walletAddress, parsed.data.amount);
    const response = NextResponse.json({ redirect });
    response.cookies.set(lenderCookie(id));
    return response;
  } catch (err) {
    console.error("quota request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "No pudimos encontrar esa wallet o pedirle la autorización. Revisa la dirección e intenta de nuevo." },
      { status: 502 },
    );
  }
}

/** The state of this browser's quota, or `none`. */
export async function GET() {
  return NextResponse.json(await lenderSummary(await readLenderGrantId()), {
    headers: { "cache-control": "no-store" },
  });
}
