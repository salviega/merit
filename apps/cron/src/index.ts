import express, {
  type ErrorRequestHandler,
} from "express";
import cors from "cors";
import { ZodError } from "zod";
import { config } from "./config.js";
import { payments } from "./routes/payments.js";

const app = express();

app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/payments", payments);

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
};
app.use(onError);

app.listen(config.PORT, () => {
  console.log(`api listening on http://localhost:${config.PORT}`);
});
