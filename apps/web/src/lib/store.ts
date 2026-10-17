import "server-only";
import { openStore, type Store } from "@merit/core/db";
import { serverEnv } from "./env";

let store: Store | undefined;

/** The JSON store shared with apps/cron. Every write goes through `withTransaction()`. */
export function getStore(): Store {
  store ??= openStore(serverEnv().dataFilePath);
  return store;
}
