import { describe, expect, it } from "vitest";
import { offerFor, SCORE_PARAMS, scoreFromHistory, type History } from "./score";

// 05 §6: score = 300 + 300·regularidad + 200·actividad + 200·neto + min(100, 25·pagados)
// Offer by tier: <500 rejected · 500–649 20 % / 8 % · 650–799 35 % / 6 % · ≥800 50 % / 4 %.

const now = new Date("2026-10-16T12:00:00.000Z");
const usd = { assetCode: "USD", assetScale: 2 };

function incoming(daysAgo: number, value: string, id = `in_${daysAgo}_${value}`) {
  return {
    id: `https://rs.example/incoming-payments/${id}`,
    createdAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
    amount: { value, ...usd },
  };
}

function outgoing(daysAgo: number, value: string) {
  return {
    id: `https://rs.example/outgoing-payments/out_${daysAgo}_${value}`,
    createdAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
    amount: { value, ...usd },
  };
}

describe("scoreFromHistory", () => {
  it("gives the minimum score to an empty wallet", () => {
    const result = scoreFromHistory({ incoming: [], outgoing: [] }, { now, repaidLoans: 0 });
    expect(result.score).toBe(300);
    expect(result.inputs.monthlyIncome).toBe("0");
    expect(result.inputs.regularity).toBe(0);
    expect(result.inputs.activity).toBe(0);
    expect(result.inputs.net).toBe(0);
  });

  it("counts a single large income as one week of regularity", () => {
    const history: History = { incoming: [incoming(3, "1000000")], outgoing: [] };
    const { inputs } = scoreFromHistory(history, { now, repaidLoans: 0 });
    expect(inputs.regularity).toBeCloseTo(1 / 13, 5);
    expect(inputs.activity).toBeCloseTo(1 / 20, 5);
    expect(inputs.net).toBe(1);
  });

  it("reaches full regularity with one income in each of the 13 weeks", () => {
    const history: History = {
      incoming: Array.from({ length: 13 }, (_, w) => incoming(w * 7 + 1, "30000", `w${w}`)),
      outgoing: [],
    };
    const { inputs } = scoreFromHistory(history, { now, repaidLoans: 0 });
    expect(inputs.regularity).toBe(1);
  });

  it("clamps net to zero when more goes out than comes in", () => {
    const history: History = {
      incoming: [incoming(5, "10000")],
      outgoing: [outgoing(4, "25000")],
    };
    const { inputs } = scoreFromHistory(history, { now, repaidLoans: 0 });
    expect(inputs.net).toBe(0);
  });

  it("caps activity at 20 payments", () => {
    const history: History = {
      incoming: Array.from({ length: 40 }, (_, i) => incoming(i % 80, "1000", `a${i}`)),
      outgoing: [],
    };
    expect(scoreFromHistory(history, { now, repaidLoans: 0 }).inputs.activity).toBe(1);
  });

  it("adds 25 per repaid merit loan, up to 100", () => {
    const base = scoreFromHistory({ incoming: [], outgoing: [] }, { now, repaidLoans: 0 }).score;
    expect(scoreFromHistory({ incoming: [], outgoing: [] }, { now, repaidLoans: 2 }).score).toBe(base + 50);
    expect(scoreFromHistory({ incoming: [], outgoing: [] }, { now, repaidLoans: 9 }).score).toBe(base + 100);
  });

  it("ignores payments older than the window and averages the income over three months", () => {
    const history: History = {
      incoming: [incoming(10, "300000"), incoming(100, "999999")],
      outgoing: [],
    };
    const { inputs } = scoreFromHistory(history, { now, repaidLoans: 0 });
    expect(inputs.monthlyIncome).toBe("100000");
  });

  it("stays within 300 and 1000 at the extremes", () => {
    const rich: History = {
      incoming: Array.from({ length: 30 }, (_, i) => incoming(i * 3, "50000", `r${i}`)),
      outgoing: [],
    };
    expect(scoreFromHistory(rich, { now, repaidLoans: 10 }).score).toBe(1000);
    expect(scoreFromHistory({ incoming: [], outgoing: [] }, { now, repaidLoans: 0 }).score).toBe(300);
  });
});

describe("offerFor", () => {
  const income = BigInt(1_200_000_00); // 1,200,000.00 in minor units

  it("rejects under 500", () => {
    expect(offerFor(499, income, BigInt(10_000_000_00))).toBeNull();
  });

  it("maps each tier to its share of the income and its rate", () => {
    expect(offerFor(500, income, BigInt(10_000_000_00))).toMatchObject({
      maxAmount: String(BigInt(240_000_00)),
      ratePercent: 8,
      maxInterest: String(BigInt(19_200_00)),
    });
    expect(offerFor(720, income, BigInt(10_000_000_00))).toMatchObject({
      maxAmount: String(BigInt(420_000_00)),
      ratePercent: 6,
      maxInterest: String(BigInt(25_200_00)),
    });
    expect(offerFor(800, income, BigInt(10_000_000_00))).toMatchObject({
      maxAmount: String(BigInt(600_000_00)),
      ratePercent: 4,
      maxInterest: String(BigInt(24_000_00)),
    });
  });

  it("never offers more than the largest available quota", () => {
    const offer = offerFor(800, income, BigInt(100_000_00));
    expect(offer?.maxAmount).toBe(String(BigInt(100_000_00)));
    expect(offer?.maxInterest).toBe(String(BigInt(4_000_00)));
  });

  it("rejects when no quota is available even with a good score", () => {
    expect(offerFor(900, income, BigInt(0))).toBeNull();
  });

  it("offers the tier's amount alone when no quota bound is given", () => {
    expect(offerFor(720, income)?.maxAmount).toBe(String(BigInt(420_000_00)));
    expect(offerFor(720, BigInt(0))).toBeNull();
  });

  it("uses the same repayment share for every tier", () => {
    expect(offerFor(500, income, income)?.repaymentShare).toBe(SCORE_PARAMS.repaymentShare);
    expect(offerFor(900, income, income)?.repaymentShare).toBe(SCORE_PARAMS.repaymentShare);
  });
});
