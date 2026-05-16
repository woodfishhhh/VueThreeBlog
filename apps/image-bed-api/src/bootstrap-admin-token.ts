import { mkdir } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";

import { hashToken } from "./auth.js";
import { createDatabaseContext } from "./db.js";
import { loadEnv } from "./env.js";

async function main() {
  const env = loadEnv(process.env);
  await mkdir(path.dirname(env.sqlitePath), { recursive: true });
  const dbContext = await createDatabaseContext(env);
  const db = dbContext.db;

  const userId = `user_${nanoid(10)}`;
  const tokenId = `tok_${nanoid(10)}`;
  const rawToken = `muyu_${nanoid(24)}`;
  const tokenHash = hashToken(rawToken, env.tokenSecret);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as
      | { id: string }
      | undefined;
    const finalUserId = existingAdmin?.id ?? userId;
    if (!existingAdmin) {
      db.prepare(
        `
          INSERT INTO users (id, email, display_name, role, created_at, disabled_at, last_login_at)
          VALUES (?, NULL, ?, 'admin', ?, NULL, NULL)
        `,
      ).run(finalUserId, "Admin", now);
    }

    db.prepare(
      `
        INSERT INTO tokens (id, user_id, name, token_hash, scopes, created_at, last_used_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
      `,
    ).run(tokenId, finalUserId, "bootstrap-admin", tokenHash, JSON.stringify(["admin"]), now);
  });
  tx();

  console.log(`Bootstrap admin token (show once): ${rawToken}`);
  dbContext.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
