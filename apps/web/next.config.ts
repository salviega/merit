import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// One .env for the whole monorepo: the app and the repayment service share
// the same keys and the same JSON store. Variables already in the
// environment (Vercel, the shell) win over the file.
const rootEnv = path.resolve(process.cwd(), "../../.env");
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The shared package ships TypeScript sources.
  transpilePackages: ["@merit/core"],
  // Node-only libraries used by the route handlers stay outside the bundle.
  serverExternalPackages: ["@interledger/open-payments", "proper-lockfile", "write-file-atomic"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
