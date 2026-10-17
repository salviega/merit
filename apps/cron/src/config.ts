import path from "node:path";
import { z } from "zod";

// The env comes from the monorepo's root .env (see the `dev`/`start` scripts
// and .env.example at the repo root). A key left blank counts as unset.
const blankAsUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const schema = z.object({
  DATA_FILE: z.preprocess(blankAsUndefined, z.string().min(1).default("./data/merit.json")),
  CRON_INTERVAL_MS: z.preprocess(blankAsUndefined, z.coerce.number().int().min(1000).default(5000)),
});

const parsed = schema.parse(process.env);

/** The repo root: apps/cron runs with its own cwd. */
const repoRoot = path.resolve(process.cwd(), "../..");

export const config = {
  ...parsed,
  dataFilePath: path.isAbsolute(parsed.DATA_FILE) ? parsed.DATA_FILE : path.resolve(repoRoot, parsed.DATA_FILE),
};
