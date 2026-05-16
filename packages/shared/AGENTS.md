# AGENTS.md — packages/shared

Shared TypeScript types and utilities used by both `apps/image-bed-api` and `apps/blog`.

## Commands

```bash
npm run build      # tsc → dist/ (must run before other packages can import)
npm run typecheck  # tsc --noEmit
vitest run         # unit tests
```

## Exports

Built as an ESM library (`main: ./dist/index.js`, `types: ./dist/index.d.ts`).

Key exports:
- Type definitions for API request/response shapes (image upload, image list, etc.)
- URL helper utilities (`src/urls.ts`) for constructing image CDN URLs
- Sub-path: `@woodfish-nest/shared/api` for API-specific types

## Usage

```typescript
import type { ImageRecord } from "@woodfish-nest/shared";
import { buildImageUrl } from "@woodfish-nest/shared";
```

## Notes

- Always run `npm run shared:build` (from root) after modifying this package.
- TypeScript source in `src/index.ts` + `src/urls.ts`. Compiled output in `dist/` (committed for workspace consumers that don't build from source).
