import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyDocument } from "./schema";
import { openStore } from "./store";

// The store is the only place state lives, and two processes (the web and
// the repayment service) write it. These tests pin what 05 §5 promises of it:
// every write goes through a transaction under a lock, the file is never
// left half-written, and (loan_id, incoming_payment_id) is unique.

const run = promisify(execFile);
let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "merit-store-"));
  file = path.join(dir, "merit.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("openStore", () => {
  it("reads an empty document when the file does not exist yet, without creating it", async () => {
    const store = openStore(file);
    expect(await store.read()).toEqual(emptyDocument());
    await expect(stat(file)).rejects.toThrow();
  });

  it("persists what a transaction returns and reads it back validated", async () => {
    const store = openStore(file);
    const id = await store.withTransaction((doc) => {
      doc.lenderGrants.push({
        id: "lg_1",
        walletAddress: "https://ilp.interledger-test.dev/ana",
        assetCode: "USD",
        assetScale: 2,
        limitAmount: "100000",
        committedAmount: "0",
        status: "pending",
        continueUri: "https://auth.example/continue/1",
        continueToken: "ct_1",
        nonce: "n_1",
        finishNonce: "f_1",
        authServer: "https://auth.example",
        createdAt: "2026-10-16T00:00:00.000Z",
      });
      return "lg_1";
    });
    expect(id).toBe("lg_1");
    const doc = await store.read();
    expect(doc.lenderGrants).toHaveLength(1);
    expect(doc.lenderGrants[0]?.walletAddress).toBe("https://ilp.interledger-test.dev/ana");
    // Pretty JSON on disk: a human can read the demo's state.
    expect(await readFile(file, "utf8")).toContain('"lenderGrants"');
  });

  it("leaves the file untouched when the transaction throws", async () => {
    const store = openStore(file);
    await store.withTransaction((doc) => {
      doc.repayments.push(repayment("rp_1"));
    });
    const before = await readFile(file, "utf8");
    await expect(
      store.withTransaction((doc) => {
        doc.repayments.push(repayment("rp_2"));
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await readFile(file, "utf8")).toBe(before);
  });

  it("rejects a document that breaks the schema instead of writing it", async () => {
    const store = openStore(file);
    await expect(
      store.withTransaction((doc) => {
        // @ts-expect-error — a float where a bigint string is required
        doc.repayments.push({ ...repayment("rp_x"), amount: 12.5 });
      }),
    ).rejects.toThrow();
    await expect(stat(file)).rejects.toThrow();
  });

  it("refuses to observe the same incoming payment twice for one loan", async () => {
    const store = openStore(file);
    await store.withTransaction((doc) => {
      doc.observedIncomingPayments.push({
        loanId: "loan_1",
        incomingPaymentId: "https://rs.example/incoming-payments/a",
        processedAmount: "100",
      });
    });
    await expect(
      store.withTransaction((doc) => {
        doc.observedIncomingPayments.push({
          loanId: "loan_1",
          incomingPaymentId: "https://rs.example/incoming-payments/a",
          processedAmount: "50",
        });
      }),
    ).rejects.toThrow(/observedIncomingPayments/);
    const doc = await store.read();
    expect(doc.observedIncomingPayments).toHaveLength(1);
    expect(doc.observedIncomingPayments[0]?.processedAmount).toBe("100");
  });

  it("serializes concurrent transactions in one process", async () => {
    const store = openStore(file);
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        store.withTransaction((doc) => {
          doc.repayments.push(repayment(`rp_${i}`));
        }),
      ),
    );
    const doc = await store.read();
    expect(doc.repayments).toHaveLength(25);
  });

  it("serializes concurrent transactions across processes: no write is lost", async () => {
    const child = path.join(import.meta.dirname, "test-helpers", "append-repayments.ts");
    const processes = 3;
    const perProcess = 15;
    await Promise.all(
      Array.from({ length: processes }, (_, p) =>
        run(process.execPath, ["--import", "tsx", child, file, `p${p}`, String(perProcess)], {
          cwd: path.resolve(import.meta.dirname, "../.."),
        }),
      ),
    );
    const doc = await openStore(file).read();
    expect(doc.repayments).toHaveLength(processes * perProcess);
    expect(new Set(doc.repayments.map((r) => r.id)).size).toBe(processes * perProcess);
  });
});

function repayment(id: string) {
  return {
    id,
    loanId: "loan_1",
    sourceIncomingPayment: `https://rs.example/incoming-payments/${id}`,
    amount: "100",
    status: "pending" as const,
    createdAt: "2026-10-16T00:00:00.000Z",
  };
}
