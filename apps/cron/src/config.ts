import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  OPEN_PAYMENTS_WALLET_ADDRESS: z.string().url().optional(),
  OPEN_PAYMENTS_KEY_ID: z.string().optional(),
  OPEN_PAYMENTS_PRIVATE_KEY_PATH: z.string().default("./private.key"),
});

export const config = schema.parse(process.env);
