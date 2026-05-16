import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";

import type { AppEnv } from "./env.js";

export interface DatabaseContext {
  db: Database.Database;
  close: () => void;
}

export async function createDatabaseContext(env: AppEnv): Promise<DatabaseContext> {
  await mkdir(path.dirname(env.sqlitePath), { recursive: true });
  const db = new Database(env.sqlitePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  await runMigrations(db);

  return {
    db,
    close: () => db.close(),
  };
}

async function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
  const hasMigration = db.prepare("SELECT 1 FROM _migrations WHERE id = ?").pluck();
  const markMigration = db.prepare(
    "INSERT INTO _migrations (id, applied_at) VALUES (?, datetime('now'))",
  );

  for (const file of files) {
    if (hasMigration.get(file)) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    markMigration.run(file);
  }
}
