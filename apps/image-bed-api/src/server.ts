import { mkdir } from "node:fs/promises";
import path from "node:path";

import { serve } from "@hono/node-server";
import sharp from "sharp";

import { createApp } from "./app.js";
import { createDatabaseContext } from "./db.js";
import { loadEnv } from "./env.js";

async function main() {
  const env = loadEnv(process.env);
  sharp.concurrency(env.sharpConcurrency);
  await mkdir(env.imageRoot, { recursive: true });
  await mkdir(path.dirname(env.sqlitePath), { recursive: true });

  const dbContext = await createDatabaseContext(env);
  const app = createApp({
    db: dbContext.db,
    env,
  });

  const server = serve({
    fetch: app.fetch,
    port: env.port,
  });

  process.on("SIGINT", () => {
    server.close();
    dbContext.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
