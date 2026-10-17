import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import writeFileAtomic from "write-file-atomic";
import { document, emptyDocument, type Document } from "./schema";

// One JSON file, two processes (the web and the repayment service). Every
// mutation goes through `withTransaction()`: take the file lock, read,
// apply, validate, write atomically (temp file + rename), release. Reads
// outside a transaction are fine; writes outside one are a bug (AGENTS.md).

export type Store = {
  readonly file: string;
  read(): Promise<Document>;
  withTransaction<T>(fn: (doc: Document) => T | Promise<T>): Promise<T>;
};

const lockOptions: lockfile.LockOptions = {
  // The file may not exist yet; the lock lives next to it as `<file>.lock`.
  realpath: false,
  stale: 10_000,
  retries: { retries: 100, factor: 1.2, minTimeout: 10, maxTimeout: 150 },
};

export function openStore(file: string): Store {
  const resolved = path.resolve(file);

  async function read(): Promise<Document> {
    let raw: string;
    try {
      raw = await readFile(resolved, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyDocument();
      throw err;
    }
    return document.parse(JSON.parse(raw));
  }

  async function withTransaction<T>(fn: (doc: Document) => T | Promise<T>): Promise<T> {
    await mkdir(path.dirname(resolved), { recursive: true });
    const release = await lockfile.lock(resolved, lockOptions);
    try {
      const doc = await read();
      const result = await fn(doc);
      const validated = document.parse(doc);
      await writeFileAtomic(resolved, `${JSON.stringify(validated, null, 2)}\n`, { encoding: "utf8" });
      return result;
    } finally {
      await release();
    }
  }

  return { file: resolved, read, withTransaction };
}
