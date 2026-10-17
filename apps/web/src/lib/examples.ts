// Fixed example data for the screens until the API exists (work plan, phase
// 2). Amounts follow 04 §3: minor units + assetCode + assetScale. Figures match
// 05 §6: score 720 falls in the 650–799 band → 35 % of the monthly income,
// 6 % interest on the principal, 20 % of each incoming payment.

import type { Amount } from "./format";

const cop = (whole: number): Amount => ({
  value: String(BigInt(whole) * BigInt(100)),
  assetCode: "COP",
  assetScale: 2,
});

export const exampleLender = {
  wallet: "https://ilp.interledger-test.dev/ana",
  limit: cop(2_000_000),
  committed: cop(300_000),
  available: cop(1_700_000),
};

export const exampleBorrower = {
  wallet: "https://ilp.interledger-test.dev/juan",
  score: 720,
  monthlyIncome: cop(1_200_000),
  maxAmount: cop(420_000),
  rate: 0.06,
  maxInterest: cop(25_200),
  repaymentShare: 0.2,
};

export const exampleLoan = {
  principal: cop(300_000),
  interest: cop(18_000),
  totalDue: cop(318_000),
  repaid: cop(63_600),
  repaymentShare: 0.2,
  disbursementPayment:
    "https://ilp.interledger-test.dev/incoming-payments/6b1d1f3e-2a6c-4d2e-9f6a-0e4c9c0a1b2c",
};

export const examplePayments = {
  lenderGrant:
    "https://auth.interledger-test.dev/grant/0f4a7a5e-7c1b-4b7a-9f3e-5e8d2b1c9a7d",
};

export { cop };
