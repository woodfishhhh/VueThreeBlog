# Codex Implementation Plan: Full-Site Day/Night Theme Switch

## Goal
Ship a stable full-site theme system for VueCubeBlog:

- Night remains the default deep-space experience with the hypercube and starfield.
- Day adds an Editorial Paper theme with warm paper background and black-line Mobius strip.
- Theme toggles from `SiteNav` with View Transitions API circle reveal from click coordinates.
- Theme persists in `localStorage` and applies before app mount to avoid FOUC.
- All user-visible site areas remain readable in both themes.

## Current Repo State
This plan is written for the current workspace, not a greenfield implementation.

Already present or partially present:

- `src/composables/useTheme.ts`
  - `ThemeMode = "night" | "day"`
  - persisted storage key `vuecubeblog-theme`
  - `initializeTheme`, `toggleThemeSync`, `toggleThemeAt`
  - View Transitions + CSS coordinate variables
- `src/components/layout/ThemeToggle.vue`
  - emits `{ x, y }`
  - renders sun in night mode, moon in day mode
- `src/components/layout/SiteNav.vue`
  - imports `ThemeToggle` and `useTheme`
  - mounts toggle in desktop and mobile nav
- `src/composables/useMobiusStrip.ts`
  - line-only Mobius geometry
  - `setOpacity`, `lerpColor`, `dispose`
- `src/components/scene/ThreeSceneCanvas.vue`
  - mounts hypercube + Mobius + starfield
  - switches visible geometry by theme
  - updates hit target, focus target, colors, clear color
- `src/assets/main.css`
  - day/night tokens started
  - View Transition clip-path rules started
  - day article tokens started
- `index.html`
  - inline theme bootstrap started
- `tests/composables/use-theme.test.ts`
  - basic theme tests started

Known remaining gaps from inspection:

- Many `.vue` files still contain hardcoded `text-white`, `border-white`, `bg-black`, `bg-white/[...]` classes.
- `AuthorBio.vue`, `AuthorContact.vue`, `AuthorTimeline.vue`, `WorksPanel.vue`, blog components, friend components, and `ReadingOverlay.vue` need token cleanup.
- `ThemeToggle` tests are missing.
- `useMobiusStrip` tests are missing.
- `SiteNav` tests need coverage for toggle presence/events.
- `main.css` day article overrides should be checked for nav/status hardcoded states.
- `body` still uses `--background` / `--foreground`; ensure these mirror theme tokens or replace with `--stage-*`.

## Public Interfaces
Do not introduce new dependencies.

### `useTheme`
Keep this API stable:

```ts
export type ThemeMode = "night" | "day";

export const useTheme = () => ({
  theme,
  initializeTheme,
  toggleThemeSync,
  toggleThemeAt,
});

export const toggleThemeAt = (x: number, y: number) => void;
```

Required behavior:

- Default theme is `night` when no valid persisted value exists.
- Valid persisted values: `night`, `day` only.
- Invalid persisted values fall back to `night`.
- Applying a theme sets:
  - `document.documentElement.dataset.theme`
  - `document.documentElement.style.colorScheme`
  - `localStorage["vuecubeblog-theme"]` when toggled
- `toggleThemeAt(x, y)` sets CSS vars:
  - `--theme-switch-x`
  - `--theme-switch-y`
  - `--theme-switch-radius`
- If `document.startViewTransition` is unavailable or reduced motion is active, toggle synchronously.
- Clear temporary CSS vars when transition finishes or immediately after sync fallback.
- Never throw when `localStorage` is unavailable.

### `ThemeToggle`
Keep this API stable:

```ts
defineProps<{ theme: ThemeMode }>();
defineEmits<{ toggleTheme: [{ x: number; y: number }] }>();
```

Required behavior:

- `theme="night"` renders sun icon and `aria-label="切换到白昼模式"`.
- `theme="day"` renders moon icon and `aria-label="切换到黑夜模式"`.
- `aria-pressed` is `true` only in day mode.
- Click emits the click coordinate; if unavailable, fallback to button center.

### `useMobiusStrip`
Keep the interface symmetric with `Hypercube` where useful:

```ts
export interface MobiusStrip {
  group: THREE.Group;
  line: THREE.LineSegments;
  hitMesh: THREE.Mesh;
  update: (delta: number) => void;
  lerpColor: (target: THREE.Color, factor: number) => void;
  setOpacity: (alpha: number) => void;
  dispose: () => void;
}
```

Required behavior:

- No points, no filled mesh, no texture dependency.
- Day mode visible line color starts black-ish.
- Hit mesh exists but is invisible.
- `dispose()` disposes geometry/materials.

## Implementation Phases

### Phase 1 — Theme Core Hardening
Files:

- `src/composables/useTheme.ts`
- `src/App.vue`
- `index.html`
- `src/assets/main.css`

Tasks:

1. Confirm `initializeTheme()` is called once from `App.vue` on mount.
2. Keep `index.html` bootstrap before CSS-dependent rendering and ensure it handles invalid/missing storage.
3. Update `body` theme variables if needed:
   - Prefer `background: var(--stage-bg)` and `color: var(--stage-fg)`.
   - Or ensure `--background` / `--foreground` are overridden inside `[data-theme="day"]`.
4. Confirm View Transition CSS only animates `root` and does not fight Vue transitions.
5. Ensure reduced-motion path avoids visible animation.
6. Keep default theme `night`; do not use `prefers-color-scheme`.

Acceptance:

- Reload with no storage gives `html[data-theme="night"]` before app visual render.
- Reload with storage `day` gives `html[data-theme="day"]` before app visual render.
- Invalid storage does not throw and falls back to night.

### Phase 2 — 3D Stage Completion
Files:

- `src/components/scene/ThreeSceneCanvas.vue`
- `src/composables/useHypercube.ts`
- `src/composables/useStarField.ts`
- `src/composables/useMobiusStrip.ts`
- `src/components/scene/mobius-rotation.ts` if retained

Tasks:

1. Keep both geometries mounted after scene init.
2. Night mode:
   - hypercube opacity `1`, scale normal
   - Mobius opacity `0`, scale near-zero
   - starfield opacity `1`
   - scene background `#050510`
3. Day mode:
   - hypercube opacity `0`, scale near-zero
   - Mobius opacity `1`, scale normal
   - starfield opacity `0`
   - scene background `#FAFAF7`
4. Use active geometry for:
   - hover raycast
   - click-to-focus raycast
   - focus transform tween
   - color lerp
5. When theme changes, call `applyThemeImmediate(theme)` and `updateGeometryTransform()`.
6. Dispose all objects and kill GSAP tweens on unmount.
7. Avoid GSAP crossfade during View Transition; geometry switch should be immediate.

Acceptance:

- Night: hypercube clickable/focusable; stars visible.
- Day: Mobius clickable/focusable; stars hidden.
- Switching while focused does not break OrbitControls.
- No unhandled errors on route changes/unmount.

### Phase 3 — Full-Site Token Cleanup
Files by priority:

- `src/components/home/AuthorBio.vue`
- `src/components/home/AuthorContact.vue`
- `src/components/home/AuthorTimeline.vue`
- `src/components/home/AuthorPanel.vue`
- `src/components/home/WorksPanel.vue`
- `src/components/home/FriendPanel.vue`
- `src/components/home/friend/FriendLinkCard.vue`
- `src/components/home/friend/FriendLinkApplicationForm.vue`
- `src/components/home/blog/BlogFilterRail.vue`
- `src/components/home/blog/BlogSearchBar.vue`
- `src/components/home/blog/BlogResults.vue`
- `src/components/home/blog/BlogResultCard.vue`
- `src/components/home/ReadingOverlay.vue`
- `src/views/HomeView.vue`
- `src/views/NotFoundView.vue`
- article components only if they contain hardcoded theme colors

Token replacement rules:

| Current | Replace with |
|---|---|
| `text-white` | `text-[var(--stage-fg)]` |
| `text-white/90`, `text-white/80` | `text-[var(--stage-fg)] opacity-90/80` or `text-[var(--stage-hint-strong)]` by context |
| `text-white/60`, `text-white/50`, `text-white/40`, `text-white/35`, `text-white/30` | `text-[var(--stage-hint)]` plus opacity only when needed |
| `border-white/10`, `border-white/12`, `border-white/15`, `border-white/20` | `border-[var(--border-subtle)]` or `border-[var(--border-strong)]` |
| `bg-white/[0.02]` to `bg-white/[0.09]` | `bg-[var(--surface-soft)]` |
| `bg-black/20`, `bg-black/25`, `bg-black/30`, `bg-black/40`, `bg-black/80` | `bg-[var(--surface-1)]` or `bg-[var(--surface-2)]` |
| `text-blue-*` active/accent | `text-[var(--accent)]` where semantic |
| `border-blue-*` accent border | keep only if intentionally blue; otherwise `border-[var(--border-strong)]` |

Intentional exceptions:

- Keep `mix-blend-difference` logo if readable in both themes.
- Keep large black gradient panel shells in `HomeView.vue` if preserving “white paper + black bookmark” editorial design.
- Keep brand-specific hover colors in social buttons.
- Keep image overlay gradients where they are content/image affordances, not page theme backgrounds.

Acceptance:

- `rg "text-white|border-white|bg-black|bg-white/|bg-\[#050510\]" src --glob "*.vue"` returns only intentional exceptions documented in final report.
- Day mode blog/friend/author/works panels are readable.
- Night mode visual hierarchy is not degraded.

### Phase 4 — Article + 404 Theme Polish
Files:

- `src/assets/main.css`
- `src/views/PostView.vue`
- `src/views/NotFoundView.vue`
- `src/components/home/ReadingOverlay.vue`
- `src/components/article/*` only if needed

Tasks:

1. Confirm all article surfaces use `--article-*` variables.
2. Add or verify `[data-theme="day"]` overrides for:
   - `--article-surface`
   - `--article-surface-strong`
   - `--article-surface-soft`
   - `--article-border`
   - `--article-accent`
   - `--article-accent-warm`
   - `--article-muted`
   - `--article-shadow`
   - `--article-code`
   - `--article-quote`
3. Verify day overrides for hardcoded article nav/status classes:
   - `.article-page__nav-link`
   - `.article-page__nav-meta`
   - `.article-page__status`
   - `.article-page__status-label`
4. Convert `NotFoundView.vue` to stage tokens.
5. Convert `ReadingOverlay.vue` close button to stage/surface tokens.

Acceptance:

- `/posts/<slug>` readable in both themes.
- Theme can toggle while on post page.
- `/not-found` or unknown route is readable in both themes.

### Phase 5 — Tests
Add or update tests without changing framework setup.

#### `tests/composables/use-theme.test.ts`
Cases:

- defaults to night with no storage
- hydrates day from storage
- ignores invalid storage
- `toggleThemeSync` flips night → day and persists
- `toggleThemeSync` flips day → night and persists
- `toggleThemeAt` sync fallback works when `startViewTransition` missing
- `toggleThemeAt` uses sync fallback when reduced motion matches
- localStorage get/set throwing does not throw

#### `tests/layout/theme-toggle.test.ts`
Cases:

- night renders sun state and correct aria
- day renders moon state and correct aria
- click emits `toggleTheme` with coordinates
- missing client coordinates falls back to element center

#### `tests/layout/site-nav.test.ts`
Extend existing tests:

- desktop toggle renders
- mobile toggle renders
- clicking toggle calls theme handler path without changing nav active state

#### `tests/scene/mobius-strip.test.ts`
Cases:

- `generateMobiusData()` returns params and edges
- seam edges wrap last segment to first segment
- `useMobiusStrip()` returns group, line, hitMesh
- `setOpacity()` updates line material opacity
- `lerpColor()` changes line material color toward target
- `dispose()` is callable

#### Existing tests
Keep existing tests passing:

- `tests/scene/hypercube-rotation.test.ts`
- `tests/home/*`
- `tests/article/*`
- `tests/router/*`
- `tests/stores/*`

### Phase 6 — Verification
Run in this order:

```bash
npm run typecheck
npm test
npm run build
```

Manual browser smoke via:

```bash
npm run dev
```

Manual checks:

1. Initial load with empty storage: night theme, hypercube, stars.
2. Toggle from nav: circle reveal originates at button click.
3. Day theme: paper background, black-line Mobius, no stars.
4. Refresh in day: no black flash, day persists.
5. Home route: focus hint says Mobius in day, hypercube in night.
6. Blog route: filters, search, result cards readable in both themes.
7. Author route: bio/contact/timeline readable in both themes.
8. Friend route: link cards/form readable in both themes.
9. Works route: cards readable in both themes.
10. Post route: article page, nav/status/prose readable in both themes.
11. Unknown route/404 readable in both themes.
12. Mobile viewport: nav toggle and hamburger do not overlap.
13. Reduced motion: theme still toggles without reveal animation.
14. Focus mode: theme switch does not break drag/orbit.

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Token cleanup misses a hardcoded class | Use `rg` residual scan and document intentional exceptions. |
| View Transitions unsupported | `toggleThemeAt` sync fallback keeps feature usable. |
| Reduced-motion users get animation | Explicit `matchMedia("(prefers-reduced-motion: reduce)")` fallback. |
| Theme state leaks between tests | Reset localStorage, `data-theme`, `colorScheme`, and mocked APIs in `beforeEach`. |
| Mobius/hypercube transform diverges | Use active geometry abstraction in `ThreeSceneCanvas.vue`; keep public object shapes symmetric. |
| Day article page still dark | Verify `--article-*` day overrides and hardcoded nav/status selectors. |
| Mobile nav crowding | Keep toggle compact and adjacent to hamburger with `gap-2`. |

## Final Report Requirements
When implementation finishes, report:

- Changed files.
- Simplifications made.
- Intentional hardcoded color exceptions, if any.
- Verification commands run and outcomes.
- Remaining risks or follow-up visual polish.
