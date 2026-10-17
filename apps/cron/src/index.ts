// The repayment service (04 §4.4, 05 §8): one cycle every CRON_INTERVAL_MS,
// never overlapping — the next cycle waits for the previous one. It shares
// the JSON store with the web and talks to no one else: no HTTP in or out
// except to the wallets' Open Payments servers.
//
// Phase 3 of the work plan leaves it reading the store; phase 4 adds the
// repayment cycle itself (`packages/core/repayment.ts`).
import { openStore } from "@merit/core/db";
import { config } from "./config.js";

const store = openStore(config.dataFilePath);

async function cycle(): Promise<void> {
  const doc = await store.read();
  const active = doc.loans.filter((loan) => loan.status === "active");
  if (active.length > 0) {
    console.log(`${new Date().toISOString()} ${active.length} active loan(s); repayment arrives with phase 4`);
  }
}

let stopping = false;

async function loop(): Promise<void> {
  while (!stopping) {
    const started = Date.now();
    try {
      await cycle();
    } catch (err) {
      console.error("cycle failed:", err instanceof Error ? err.message : err);
    }
    const wait = Math.max(0, config.CRON_INTERVAL_MS - (Date.now() - started));
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    console.log(`\n${signal}: finishing the current cycle…`);
  });
}

console.log(`repayment service: ${config.dataFilePath} every ${config.CRON_INTERVAL_MS} ms`);
await loop();
