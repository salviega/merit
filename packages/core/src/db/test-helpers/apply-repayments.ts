// Child process used by repayment.test.ts: applies the same incoming payments
// a repayment cycle would see, each under withTransaction(), so the test can
// prove that several processes charge every unit at most once.
import { openStore } from "../store";
import { planRepayment } from "../../repayment";

const [file] = process.argv.slice(2);
if (!file) throw new Error("usage: apply-repayments.ts <file>");

const store = openStore(file);
const usd = { assetCode: "USD", assetScale: 2 };
const createdAt = "2026-10-16T10:05:00.000Z";
const seen = [
  { id: "https://ilp.interledger-test.dev/incoming-payments/a", createdAt, receivedAmount: { value: "10000", ...usd } },
  { id: "https://ilp.interledger-test.dev/incoming-payments/a", createdAt, receivedAmount: { value: "25000", ...usd } },
  { id: "https://ilp.interledger-test.dev/incoming-payments/b", createdAt, receivedAmount: { value: "5000", ...usd } },
  { id: "https://ilp.interledger-test.dev/incoming-payments/a", createdAt, receivedAmount: { value: "25000", ...usd } },
];

for (const payment of seen) {
  await store.withTransaction((doc) => {
    planRepayment(doc, "loan_1", payment);
  });
}
