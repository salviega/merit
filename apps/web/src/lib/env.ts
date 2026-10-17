import "server-only";
import path from "node:path";
import { z } from "zod";

// Server-side env, validated once at the boundary (AGENTS.md, Security). The
// values come from the root .env (loaded by next.config.ts) or from the host.

const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const schema = z.object({
  APP_URL: z.preprocess(blankAsUndefined, z.string().url()),
  SESSION_SECRET: z.preprocess(blankAsUndefined, z.string().min(32)),
  DATA_FILE: z.preprocess(blankAsUndefined, z.string().min(1).default("./data/merit.json")),
});

export type ServerEnv = z.infer<typeof schema> & { dataFilePath: string };

let cached: ServerEnv | undefined;

/** The repo root: `apps/web` runs with its own cwd. */
const repoRoot = path.resolve(process.cwd(), "../..");

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid env: ${missing}. See .env.example at the repo root.`);
  }
  cached = {
    ...parsed.data,
    dataFilePath: path.isAbsolute(parsed.data.DATA_FILE)
      ? parsed.data.DATA_FILE
      : path.resolve(repoRoot, parsed.data.DATA_FILE),
  };
  return cached;
}
