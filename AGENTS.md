# AGENTS.md — Monorepo Root

This document provides context for AI coding agents working in the `woodfish-nest` monorepo.

## Project Overview

Personal blog + image-bed infrastructure. The public-facing **blog** app (`apps/blog`) is a Nuxt 5 nightly SPA with an immersive Three.js 3D scene. The **image-bed** is a self-hosted image CDN used by the blog's writing workflow.

## Monorepo Structure

```
woodfish-nest/
├── apps/
│   ├── blog/            # Main blog SPA — Nuxt 5 nightly + Vite 8 + Three.js
│   ├── image-bed-api/   # Hono + SQLite REST API for image uploads
│   └── image-bed-web/   # Vue 3 + Vite 7 admin panel for image-bed
├── packages/
│   ├── content-tools/   # CLI: generate JSON content from Markdown, optimise images
│   ├── shared/          # Shared TypeScript types used by API + blog
│   └── upload-cli/      # Typora custom image uploader
├── deploy/              # Deployment scripts, nginx config, systemd units
├── docs/                # Architecture notes, ops runbooks, plans
└── tests/               # Root-level integration tests (server/visitor-counter)
```

## Package Manager

**npm workspaces** — `packageManager: "npm@11.14.1"` (enforced via corepack).

> On machines where the `npm` command is intercepted by pnpm (e.g. nvm4w installs),
> first run `corepack enable npm` to activate the real npm before running any `npm` command.

All install / workspace commands must be run from the **repo root** unless otherwise noted.

```bash
npm install                            # install all workspace deps
npm install <pkg> -w @woodfish-nest/blog  # add a dep to a specific workspace
```

## Root Scripts (delegates to workspaces)

| Script | Workspace | Purpose |
|---|---|---|
| `npm run dev` | blog | Start Nuxt dev server |
| `npm run build` | blog | `nuxt generate` → static SPA in `apps/blog/dist/` |
| `npm run build:deploy` | blog | Generate with prod base URL + verify dist |
| `npm run generate:content` | blog | Run content-tools CLI (full) |
| `npm run typecheck` | blog | `nuxt typecheck` |
| `npm run shared:build` | shared | Compile shared package |
| `npm run image-bed:api:dev` | image-bed-api | Start Hono dev server |
| `npm run image-bed:web:dev` | image-bed-web | Start Vite admin UI |
| `npm run image-bed:deploy:up` | — | `docker compose up -d` in production |

## Technology Stack

| Layer | Technology |
|---|---|
| Blog framework | Nuxt 5.0.0-nightly (`nuxt-nightly@5x`) |
| Build tooling | Vite 8 + Rolldown (via `@nuxt/vite-builder-nightly@5x`) |
| Blog UI | Vue 3.5 + Pinia 3 + Vue Router 5 |
| 3D scene | Three.js r183 |
| CSS | Tailwind CSS v4 (PostCSS plugin, no config file) |
| Animation | GSAP 3 |
| Image bed API | Hono 4 + better-sqlite3 on @hono/node-server |
| Image bed web | Vue 3 + Vite 7 |
| Content pipeline | Markdown-it, highlight.js, sharp (via content-tools CLI) |
| Testing | Vitest 3 (all packages) + Playwright (blog E2E) |
| TypeScript | ~5.9.3 across all packages |

## Key Constraints

- **SPA only** (`ssr: false` in nuxt.config.ts) — Three.js and all browser APIs run without ClientOnly wrappers.
- **No Tailwind config file** — Tailwind v4 is config-less; all tokens live in CSS `@layer` / `@theme` blocks inside `src/assets/main.css`.
- **`@pinia/nuxt` is NOT used** — Pinia is wired up via `src/plugins/pinia.ts` and auto-imports configured in `nuxt.config.ts`.
- **Content is pre-generated** — Run `npm run generate:content` before `npm run build` to produce `src/generated/*.json`.
- **Node version** — Use Node 22 (LTS). The codebase targets `"es2020"` for Vite builds.

## Branch / Worktree Convention

The active development branch for the Nuxt migration is `agents-upgrade-to-nuxt-nightly`. This is checked out as a git worktree separate from the main `main` branch.

## Deployment

The blog is deployed to a VPS behind nginx. See `deploy/` for:
- `deploy.sh` / `deploy.ps1` — copy dist + nginx reload
- `nginx.conf` — serves the SPA from `/newBlog/`
- `install-visitor-counter.sh` — systemd service for the Python visitor counter

The image-bed API runs in Docker Compose on a separate subdomain (`img.woodfish.site`).
