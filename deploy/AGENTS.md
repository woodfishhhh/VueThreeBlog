<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-29 | Updated: 2026-04-29 -->

# deploy

## Purpose

Deployment configuration and scripts for VPS hosting.

## Key Files

| File | Description |
|------|-------------|
| `deploy.sh` | Shell deployment script: builds, syncs files to VPS, optionally restarts services |
| `nginx.conf` | Nginx server configuration: static file serving, gzip/brotli compression, SPA fallback |

## For AI Agents

### nginx.conf
- Serves `dist/` as static files
- SPA fallback: `try_files $uri $uri/ /index.html` for Vue Router history mode
- Gzip/Brotli compression for text assets (JS, CSS, JSON, HTML)
- Caching headers for static assets
- `.gz` pre-compressed files served directly (from `vite-plugin-compression`)

### deploy.sh
- Typically runs `npm run build:with-content`
- Syncs `dist/` to remote server via `rsync` or `scp`
- May trigger nginx reload

<!-- MANUAL: -->
