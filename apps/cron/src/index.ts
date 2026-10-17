// The repayment service (04 §4.4, 05 §8): one cycle every CRON_INTERVAL_MS,
// never overlapping — the next cycle waits for the previous one. It shares
// the JSON store with the web and talks to no one else: no HTTP in or out
// except to the wallets' Open Payments servers. If it is down, nothing is
// lost: the borrower's incoming payments are still there when it returns.
import { openStore } from "@merit/core/db";
import { getOpenPaymentsClient } from "@merit/core/open-payments";
import { config } from "./config.js";
import { runCycle } from "./repay.js";

const store = openStore(config.dataFilePath);
const log = (message: string) => console.log(`${new Date().toISOString()} ${message}`);

let stopping = false;

async function loop(): Promise<void> {
  const client = await getOpenPaymentsClient();
  while (!stopping) {
    const started = Date.now();
    try {
      await runCycle({ store, client, log });
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

log(`repayment service: ${config.dataFilePath} every ${config.CRON_INTERVAL_MS} ms`);
await loop();
