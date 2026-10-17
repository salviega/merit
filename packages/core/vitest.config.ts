import { defineConfig } from "vitest/config";

// The coverage floor from AGENTS.md lives here, so `pnpm test` itself fails
// under it. `client.ts` only builds the SDK client from the env and is left
// out: it has no branches of ours to cover.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts", "src/open-payments/client.ts", "src/db/test-helpers/**"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
