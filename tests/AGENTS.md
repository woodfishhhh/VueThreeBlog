<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-20 | Updated: 2026-04-20 -->

# tests

## Purpose

Vitest unit tests and Playwright E2E tests. Tests are organized by feature area matching the `src/` structure.

## Subdirectories

| Directory | Tests for |
|-----------|-----------|
| `article/` | Article rendering: `ArticleContent`, `ArticleToc` |
| `content/` | Content loaders: `blog-hub`, `post-helpers`, `content-url-normalizer` |
| `home/` | Home panel components |
| `layout/` | Layout components |
| `router/` | Router guards and slug resolution |
| `scene/` | Three.js scene components |
| `scripts/` | Build scripts: `build-site-content`, `generator-core`, `image-optimizer-core` |
| `stores/` | Pinia stores |
| `views/` | View components |

## Key Files

| File | Description |
|------|-------------|
| `setup.ts` | Vitest global setup |
| `image-optimizer-core.ts` | Image optimization logic tests |
| `generate-content.mts` | Content generation integration tests |

## For AI Agents

- Run unit tests: `npm test` (Vitest)
- Run E2E tests: `npm run test:e2e` (Playwright)
- Coverage target: 80%+
- Test files follow naming: `*.test.ts` or `*.spec.ts`

<!-- MANUAL: -->
