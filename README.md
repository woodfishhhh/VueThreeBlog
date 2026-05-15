# VueCubeBlog

Static Vue 3 blog SPA with a Three.js homepage scene, generated Markdown content, and glassmorphism UI.

## Stack

Vue 3, Vite+, TypeScript, Pinia, Vue Router, Three.js, Tailwind CSS 4, Vite+ Test, Playwright.

## Quick Start

```bash
npx vp install
npx vp dev
npx vp run content:generate
npx vp run app:build
```

## Agent Commands

```bash
npx vp run agent:fast      # lint without fmt + unit tests
npx vp run agent:static    # fmt/lint + vue-tsc
npx vp run agent:test      # unit tests, accepts test file args
npx vp run agent:dist      # typecheck + build + dist path check
npx vp run agent:full      # static + tests + dist
npx vp run agent:fix       # format/lint autofix + vue-tsc
npx vp run agent:inspect   # dev server with /__inspect/
npx vp run --last-details  # last Vite+ task summary
```

Focused runs pass args through:

```bash
npx vp run agent:test tests/content/post-helpers.test.ts
npx vp run agent:test --reporter verbose
```

See `docs/agent-debugging.md` for the agent command loop, plus `docs/plan.md` for the migration plan.
