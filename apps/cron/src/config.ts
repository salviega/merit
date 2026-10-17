import { z } from "zod";

// The env comes from the monorepo's root .env (see the `dev`/`start` scripts
// and .env.example at the repo root).
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  OPEN_PAYMENTS_WALLET_ADDRESS: z.string().url().optional(),
  OPEN_PAYMENTS_KEY_ID: z.string().optional(),
  // The private key PEM, base64-encoded in one line. Replaces the key file.
  OPEN_PAYMENTS_PRIVATE_KEY: z.string().optional(),
});

export const config = schema.parse(process.env);
