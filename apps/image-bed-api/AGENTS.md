# AGENTS.md — apps/image-bed-api

REST API for the personal image CDN (muyu image bed). Built with **Hono** on Node.js, **SQLite** via better-sqlite3, and deployed with Docker.

## Commands

```bash
# From apps/image-bed-api/ or via root npm run image-bed:api:*
npm run dev                    # tsx watch src/server.ts (hot reload)
npm run build                  # tsc → dist/
npm run typecheck              # tsc --noEmit
vitest run                     # unit tests
vitest watch                   # watch mode

# Admin setup (run once)
npm run bootstrap:admin-token  # generate initial admin JWT token
npm run create-admin           # create admin user record
```

## Architecture

```
src/
├── server.ts         # Entry: creates Node HTTP server, mounts Hono app
├── app.ts            # Hono app: routes, middleware, CORS config
├── auth.ts           # JWT auth middleware + helpers
├── db.ts             # better-sqlite3 initialisation + schema migrations
├── env.ts            # zod-validated environment variables
├── rate-limit.ts     # Simple in-memory rate limiter middleware
├── storage.ts        # Disk storage helpers (save, delete image files)
├── bootstrap-admin-token.ts  # CLI: print admin token for first-time setup
└── create-admin.ts           # CLI: insert admin user into DB
```

## API Routes

All routes require a valid JWT bearer token (except health check).

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (no auth) |
| POST | `/images` | Upload image (multipart/form-data) |
| GET | `/images` | List images (paginated) |
| DELETE | `/images/:id` | Delete image by ID |

## Database

SQLite file at `data/muyu.db` (Docker volume). Schema managed by migration files in `migrations/`. Run migrations on startup automatically.

## Environment Variables

Defined in `src/env.ts` (zod). Copy `deploy/image-bed/image-bed-api.env.example` to configure:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default 3001) |
| `JWT_SECRET` | Secret for signing admin tokens |
| `STORAGE_DIR` | Absolute path to image storage directory |
| `CORS_ORIGIN` | Allowed CORS origin (blog URL) |

## Docker

```bash
# From repo root
npm run image-bed:deploy:up    # docker compose up -d (prod)
npm run image-bed:deploy:logs  # tail logs
npm run image-bed:deploy:down  # stop
```

Production compose file: `deploy/image-bed/docker-compose.prod.yml`. Images stored in a named volume mounted to `STORAGE_DIR`.

## Testing

Tests in `tests/`. Uses `vitest@^3`. Integration tests mock better-sqlite3 and the file system.
