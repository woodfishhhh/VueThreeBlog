<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-29 | Updated: 2026-04-29 -->

# .github/workflows

## Purpose

GitHub Actions CI/CD workflow definitions for automated testing, building, and deployment.

## Key Files

| File | Description |
|------|-------------|
| `ci.yml` | CI workflow: runs `npm test` (Vitest) and `npm run typecheck` on pull requests and pushes to `main` |
| `deploy-vps.yml` | Deploy workflow: builds the app with content generation and deploys to VPS via SSH/SCP |

## For AI Agents

### CI Workflow
- Triggers: push to `main`, pull requests
- Steps: checkout → setup Node.js → `npm ci` → `npm test` → `npm run typecheck`
- Fails fast on test or typecheck errors

### Deploy Workflow
- Triggers: push to `main` (after CI passes)
- Steps: checkout → setup Node.js → `npm ci` → `npm run build:with-content` → deploy artifacts to VPS
- Uses SSH key for VPS authentication
- Copies `dist/` directory to VPS web root
- Optionally restarts nginx (see `deploy/nginx.conf`)

<!-- MANUAL: -->
