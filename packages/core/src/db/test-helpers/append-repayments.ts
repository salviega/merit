// Child process used by store.test.ts: appends N repayments through
// withTransaction() so the test can prove two real processes never lose a
// write on the same file.
import { openStore } from "../store";

const [file, prefix, count] = process.argv.slice(2);
if (!file || !prefix || !count) {
  throw new Error("usage: append-repayments.ts <file> <prefix> <count>");
}
const store = openStore(file);
for (let i = 0; i < Number(count); i++) {
  await store.withTransaction((doc) => {
    doc.repayments.push({
      id: `${prefix}_${i}`,
      loanId: "loan_1",
      sourceIncomingPayment: `https://rs.example/incoming-payments/${prefix}_${i}`,
      amount: "100",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });
}
