# AGENTS.md — apps/image-bed-web

Vue 3 SPA admin panel for managing images in the muyu image bed. Built with **Vite 7** + `@vitejs/plugin-vue`.

## Commands

```bash
# From apps/image-bed-web/ or via root npm run image-bed:web:*
npm run dev        # Vite dev server (proxies API requests to image-bed-api)
npm run build      # vite build → dist/
npm run preview    # preview built dist
npm run typecheck  # vue-tsc --noEmit
vitest run         # unit tests
```

## Structure

```
src/
├── main.ts           # Vue app entry
├── App.vue           # Root component
├── components/       # UI components (image grid, upload form, etc.)
└── composables/      # useImages, useAuth, etc.
```

## Notes

- Served at `/admin/` path (base in `vite.config.ts`).
- Depends on `@woodfish-nest/shared` for shared types.
- No SSR — client-side SPA.
- Uses `vite@^7.3.0` (standard Vite, not nightly).
