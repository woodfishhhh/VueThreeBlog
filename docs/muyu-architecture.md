# Muyu Architecture

## Components

- `apps/image-bed-api`
  - Hono API
  - SQLite metadata
  - Sharp image processing
  - token/invite/user auth model
  - audit logs + `/api/audit-logs` admin export
- `apps/image-bed-web`
  - static admin SPA served by Nginx `/admin/`
- `packages/upload-cli`
  - Typora custom-command uploader
- `packages/shared`
  - API contracts, shared URL helpers

## Storage Model

- Original files: `/srv/muyu-images/original/YYYY/MM`
- WebP files: `/srv/muyu-images/webp/YYYY/MM`
- Thumbnail files: `/srv/muyu-images/thumbs/YYYY/MM`
- SQLite DB: `/srv/muyu-data/muyu.sqlite`

## URL Policy

- Public base: `https://img.woodfish.site`
- Public image path: `/o/<variant>/<yyyy>/<mm>/<hash>.<ext>`
- API path: `/api/*`
- Admin UI: `/admin/`

## Auth Model

- bearer tokens hashed in DB (`tokens.token_hash`)
- roles: `admin`, `member`
- scopes:
  - `upload`
  - `images:read`
  - `images:delete`
  - `tokens:manage`
  - `invites:manage`
  - `admin`

## Permission Boundaries

- member:
  - upload
  - list own images
  - delete own images
- admin:
  - all member abilities
  - token management
  - invite management
  - user disable
  - global image access

## Runtime Topology

- Nginx on host:
  - serves `/o/` from host filesystem
  - serves `/admin/` static files
  - proxies `/api/` to `127.0.0.1:3000`
- Docker:
  - runs API container only
