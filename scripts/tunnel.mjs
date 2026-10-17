#!/usr/bin/env node
// Opens the Cloudflare Tunnel towards the local Next.js app. With
// CLOUDFLARE_TUNNEL_TOKEN set it runs the named tunnel, whose public hostname
// (TUNNEL_HOSTNAME) is fixed: that is APP_URL, the base of every grant
// callback, so it has to be the same every time the tunnel starts. Without a
// token it falls back to a quick tunnel, whose trycloudflare.com URL changes
// on every start and has to be copied into APP_URL by hand.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const {
  CLOUDFLARE_TUNNEL_TOKEN,
  TUNNEL_HOSTNAME,
  APP_URL,
  WEB_PORT = "3000",
} = process.env;

const localUrl = `http://localhost:${WEB_PORT}`;
let args;

if (CLOUDFLARE_TUNNEL_TOKEN) {
  args = ["tunnel", "run", "--token", CLOUDFLARE_TUNNEL_TOKEN];
  if (TUNNEL_HOSTNAME) {
    const expected = `https://${TUNNEL_HOSTNAME}`;
    if (APP_URL && APP_URL.replace(/\/$/, "") !== expected) {
      console.warn(
        `APP_URL (${APP_URL}) does not match TUNNEL_HOSTNAME (${expected}); grant callbacks will not come back here.`,
      );
    }
    console.log(`Named tunnel: ${expected} -> ${localUrl}`);
  }
} else {
  console.warn(
    "CLOUDFLARE_TUNNEL_TOKEN is not set: starting a quick tunnel. Its URL changes on every start; copy it into APP_URL.",
  );
  args = ["tunnel", "--url", localUrl];
}

const child = spawn("cloudflared", args, { stdio: "inherit" });

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error(
      "cloudflared is not installed. brew install cloudflared, or see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/",
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 0));
