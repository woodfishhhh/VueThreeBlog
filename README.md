# WoodFishNest

Formerly `VueCubeBlog`. Monorepo for:

- `@woodfish-nest/blog`: Vue 3 + Three.js static blog.
- `@woodfish-nest/image-bed-api`: Muyu image-bed API (Hono + SQLite + Sharp).
- `@woodfish-nest/image-bed-web`: static admin UI mounted at `/admin/`.
- `@woodfish-nest/shared`: shared contracts and URL helpers.
- `@woodfish-nest/upload-cli`: Typora-oriented uploader CLI (`muyu-upload`).
- `@woodfish-nest/content-tools`: reusable content/image tooling CLI (`woodfish-content`).

## Layout

```txt
apps/
  blog/
  image-bed-api/
  image-bed-web/
packages/
  shared/
  upload-cli/
  content-tools/
deploy/
  image-bed/
docs/
```

## Quick Start

```bash
npx vp install
npm run dev
npm run typecheck
npm test
npm run build
```

Blog (vp-first):

```bash
cd apps/blog
npx vp dev
npx vp run content:generate
npx vp run app:build
```

Image-bed close (vp-first):

```bash
# DNS upsert (AK/SK required; pass args after --)
npx vp run image-bed:dns:upsert -- --ak ak_xxx --sk sk_xxx --domain woodfish.site --rr img --type A --value 36.151.148.198

# DNS upsert dry-run
npx vp run image-bed:dns:upsert:dry -- --ak ak_xxx --sk sk_xxx --domain woodfish.site --rr img --type A --value 36.151.148.198

# One-shot Wave5 close (Linux/macOS shell)
npx vp run image-bed:wave5:close:dns-api -- --ak ak_xxx --sk sk_xxx --probe-file ./test-unique.png

# One-shot Wave5 close (Windows PowerShell)
npx vp run image-bed:wave5:close:dns-api:win -- -AccessKeyId 'ak_xxx' -SecretAccessKey 'sk_xxx' -Token 'muyu_xxx' -ProbeFile '.\\test-unique.png'

# Section 43 gate audit (Linux/macOS shell)
npx vp run image-bed:section43:audit

# Section 43 gate audit (Windows PowerShell)
npx vp run image-bed:section43:audit:win
```

## Common Commands

```bash
# blog
npm run dev
npm run build
npm run generate:content

# image-bed api
npm run image-bed:api:dev
npm run image-bed:api:typecheck
npm run image-bed:api:test
npm run image-bed:api:create-admin

# image-bed web
npm run image-bed:web:dev
npm run image-bed:web:typecheck
npm run image-bed:web:build

# upload cli + content tools
npm run upload-cli:build
npm run upload-cli:test
npm run content-tools:build
npm run content-tools:test
```

## Deployment Overview

- Blog deploy path remains static SPA deploy.
- Image-bed deploy uses:
  - host Nginx
  - Docker for API only
  - host-mounted `/srv/muyu-images` + `/srv/muyu-data`
- Primary deploy docs:
  - `deploy/image-bed/README.md`
  - `deploy/image-bed/docker-compose.prod.yml`
  - `deploy/image-bed/img.woodfish.site.conf`

## Runbooks

- Typora integration: `docs/muyu-typora-upload.md`
- Writing workflow: `docs/muyu-writing-workflow.md`
- VPS deploy + backup: `deploy/image-bed/README.md`
