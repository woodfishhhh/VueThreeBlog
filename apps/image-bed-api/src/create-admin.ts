import { mkdir } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";

import { hashToken } from "./auth.js";
import { createDatabaseContext } from "./db.js";
import { loadEnv } from "./env.js";

function readArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : null;
}

async function main() {
  const env = loadEnv(process.env);
  await mkdir(path.dirname(env.sqlitePath), { recursive: true });
  const dbContext = await createDatabaseContext(env);
  const db = dbContext.db;

  const existingAdmin = db
    .prepare("SELECT id, display_name FROM users WHERE role = 'admin' AND disabled_at IS NULL LIMIT 1")
    .get() as { id: string; display_name: string } | undefined;
  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.id} (${existingAdmin.display_name})`);
    dbContext.close();
    return;
  }

  const displayName = readArg("name") || "Admin";
  const email = readArg("email");
  const shouldCreateToken = !process.argv.includes("--no-token");
  const now = new Date().toISOString();
  const userId = `user_${nanoid(10)}`;

  db.prepare(
    `
      INSERT INTO users (id, email, display_name, role, created_at, disabled_at, last_login_at)
      VALUES (?, ?, ?, 'admin', ?, NULL, NULL)
    `,
  ).run(userId, email, displayName, now);

  console.log(`Admin created: ${userId}`);

  if (shouldCreateToken) {
    const tokenId = `tok_${nanoid(10)}`;
    const rawToken = `muyu_${nanoid(24)}`;
    db.prepare(
      `
        INSERT INTO tokens (id, user_id, name, token_hash, scopes, created_at, last_used_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
      `,
    ).run(tokenId, userId, "admin-bootstrap", hashToken(rawToken, env.tokenSecret), JSON.stringify(["admin"]), now);
    console.log(`Bootstrap admin token (show once): ${rawToken}`);
  }

  dbContext.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
