# Plan: 昼夜双主题（全站换皮）+ 白昼莫比乌斯环

> **取代**：`./replace-hypercube-with-mobius-strip.plan.md`(旧"替换式"方案被本方案取代；旧 plan 保留作为参考，不再实施)
>
> **设计共识**(已与用户对齐)：
> - 白昼方向：**Editorial Paper**(暖白纸 #FAFAF7 + 极淡纸纹噪点 + 黑色细线莫比乌斯环)
> - 范围：**全站换皮**(首页舞台 + SiteNav + 各 Panel + 文章页 + NotFoundView 都跟随主题)
> - 切换器：**半月图标按钮**(dark 时显 ☀,light 时显 ☾;点击 emit 鼠标坐标)
> - 过渡：参考 `C:\Users\woodfish\Desktop\前端\weather\weather` 的 **View Transitions API + clip-path circle reveal** 实现,从点击坐标圆形展开 500ms

## Summary
为 VueCubeBlog 引入完整的"昼/夜"双主题系统。所有可视层(首页 3D 舞台、SiteNav、各 Panel、文章页、404)跟随 `<html data-theme>` 切换;主题切换瞬间使用浏览器原生 `document.startViewTransition()` + CSS `clip-path: circle(0 → radius at x y)` 关键帧,**从用户点击切换器的位置圆形展开**新主题(500ms)。中央几何体随主题切换：黑夜=超立方体(保持),白昼=莫比乌斯环(仅黑色细线、无点、无填充)。

## User Story
As a 博客访客,
I want 在浸入式黑夜 与 编辑感白昼 之间切换,且切换有"从我的指尖扩散开"的视觉反馈,主题被记住,全站颜色协调,
So that 同一站点呈现两种性格,且能匹配我当下的环境与心情。

## Problem → Solution
- 当前：单一深空黑界面;颜色 `text-white` / `bg-[#050510]` 散落在 20 多个组件中;无切换通道
- 期望：双主题 token 系统;切换器在 SiteNav;主题→几何体绑定;全站协调;切换动画来自用户操作的物理原点

## Metadata
- **Complexity**: Large(设计系统 + 状态层 + Three.js 双对象 + View Transitions + 20+ 组件 token 化)
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 25(新增 7 / 改 18);按 Phase A/B/C 分阶段实施
- **Estimated Effort**: Phase A 1-2 天 / Phase B 1-2 天 / Phase C 1 天

---

## Visual System

### 美学方向对照
| 维度 | Night(保留) | Day(新建) |
|---|---|---|
| 性格 | 深空、戏剧性、几何投影 | 纸面、克制、编辑感 |
| 主视觉 | 4D 超立方体(线+顶点点阵) | 莫比乌斯环(**仅线**) |
| 背景 | #050510 + 5000 颗星 | #FAFAF7 + 极淡纸纹 SVG 噪点(opacity 0.045) |
| 主色 | #FFFFFF | #0A0A0A |
| 强调(hover)| #7EA8FF(冷蓝) | #1E3A8A(墨蓝) |
| 文本 mute | rgba(255,255,255,.6) | rgba(10,10,10,.55) |
| 文本 strong | #F7F9FF | #0A0A0A |
| Surface 卡片 | rgba(8,11,24,0.7) | rgba(255,255,255,0.8) |
| 边框 | rgba(255,255,255,.08) | rgba(10,10,10,.08) |
| 星空 | 可见 | 隐藏(opacity → 0) |

### Design Tokens(追加到 `src/assets/main.css`)

> **总览**：13 个语义 token 双套(含 view-transition 专用 3 个)。Phase A 全部定义,Phase B/C 逐步替换组件硬编码。

```css
:root,
[data-theme="night"] {
  /* —— 舞台 —— */
  --stage-bg: #050510;
  --stage-fg: #ededed;
  --stage-hint: rgba(255, 255, 255, 0.5);
  --stage-hint-strong: #ffffff;

  /* —— 表面(卡片/面板) —— */
  --surface-1: rgba(8, 11, 24, 0.72);
  --surface-2: rgba(12, 16, 30, 0.9);
  --surface-soft: rgba(255, 255, 255, 0.04);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);

  /* —— 几何体 —— */
  --geom-line-idle: #ffffff;
  --geom-line-hover: #7ea8ff;
  --starfield-opacity: 1;

  /* —— View Transitions —— */
  --theme-switch-x: 50vw;
  --theme-switch-y: 50vh;
  --theme-switch-radius: 100vmax;
  --paper-noise-opacity: 0;

  /* —— 强调色(SiteNav active 等) —— */
  --accent: #93c5fd;
}

[data-theme="day"] {
  color-scheme: light;
  --stage-bg: #FAFAF7;
  --stage-fg: #0A0A0A;
  --stage-hint: rgba(10, 10, 10, 0.5);
  --stage-hint-strong: #0A0A0A;

  --surface-1: rgba(255, 255, 255, 0.84);
  --surface-2: rgba(255, 255, 255, 0.94);
  --surface-soft: rgba(10, 10, 10, 0.03);
  --border-subtle: rgba(10, 10, 10, 0.08);
  --border-strong: rgba(10, 10, 10, 0.18);

  --geom-line-idle: #0A0A0A;
  --geom-line-hover: #1E3A8A;
  --starfield-opacity: 0;

  --paper-noise-opacity: 0.045;
  --accent: #1E3A8A;
}
```

### Motion: View Transitions Clip-Path Reveal

完全复刻 weather 项目的实现(`C:\Users\woodfish\Desktop\前端\weather\weather\src\App.vue:72-166` + `style.css` keyframe)。

```css
/* —— 切换动画 —— */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* night → day: new layer "圆形扩散展开" */
::view-transition-new(root) {
  animation: theme-clip-reveal 500ms ease-in both;
  z-index: 9999;
}
::view-transition-old(root) {
  z-index: 1;
}

/* day → night: old layer "圆形收缩消失" */
html[data-theme="night"]::view-transition-old(root) {
  animation: theme-clip-reveal 500ms ease-in reverse both;
  z-index: 9999;
}
html[data-theme="night"]::view-transition-new(root) {
  animation: none;
  z-index: 1;
}

@keyframes theme-clip-reveal {
  0%   { clip-path: circle(0 at var(--theme-switch-x) var(--theme-switch-y)); }
  100% { clip-path: circle(var(--theme-switch-radius) at var(--theme-switch-x) var(--theme-switch-y)); }
}

/* 兼容性降级 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

### ThemeToggle 形态

```
┌──────────┐          ┌──────────┐
│   ☀      │  (night) │    ☾     │  (day)
└──────────┘          └──────────┘
 显示太阳：             显示月亮：
 按下→day              按下→night
```
- 半月/太阳手写 SVG(不引入 lucide-vue-next,与项目零外部图标库的现状一致)
- 位置：嵌入 SiteNav 右侧,与 logo / nav links 同字号层级
- 点击：emit `{ x, y }`(鼠标坐标),由 useTheme.toggleThemeAt 计算圆形 reveal 的半径 = `Math.hypot(max(x, vw-x), max(y, vh-y))`
- 不支持 `startViewTransition` 或 `prefers-reduced-motion: reduce` 时降级为即时切换

---

## Mandatory Reading

### 本项目
| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/composables/useHypercube.ts` | 1-110 | 超立方体既有实现 |
| P0 | `src/components/scene/ThreeSceneCanvas.vue` | 1-340 | 场景主控;双几何体+主题响应入口 |
| P0 | `src/composables/useStarField.ts` | 1-52 | 星空材质;需暴露 opacity 控制 |
| P0 | `src/composables/useThreeScene.ts` | 1-63 | renderer 与 scene.background |
| P0 | `src/views/HomeView.vue` | 1-132 | 舞台层;hint 文案;主题响应 |
| P0 | `src/App.vue` | 1-7 | 主题初始化入口 |
| P0 | `src/assets/main.css` | 1-30 | tokens 追加位置 |
| P0 | `index.html` | 18-22 | critical CSS + FOUC 防护 inline script |
| P0 | `src/components/layout/SiteNav.vue` | 1-82 | 切换器嵌入位置 |
| P1 | `src/stores/site.ts` | 1-67 | Pinia store 范式参考 |
| P2 | `src/components/scene/hypercube-rotation.ts` | 1-22 | 旋转归一化工具 |

### 参考项目(移植对照)
| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `C:/Users/woodfish/Desktop/前端/weather/weather/src/composables/useTheme.ts` | 1-40 | **直接移植**模板 |
| P0 | `C:/Users/woodfish/Desktop/前端/weather/weather/src/App.vue` | 14, 45, 68-166, 268-322 | View Transitions handleThemeToggle + 关键帧 |
| P0 | `C:/Users/woodfish/Desktop/前端/weather/weather/src/components/SiteNavigation.vue` | 32-37, 150-166 | 切换器按钮 + emit{x,y} 形态 |
| P1 | `C:/Users/woodfish/Desktop/前端/weather/weather/src/style.css` | 32-49 | 双主题 tokens 范式 |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Möbius strip 参数方程 | https://en.wikipedia.org/wiki/M%C3%B6bius_strip | x=(R+v cos(u/2))cos(u); y=(R+v cos(u/2))sin(u); z=v sin(u/2) |
| View Transitions API | https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API | `document.startViewTransition(callback)` + `::view-transition-*` 伪元素 |
| Tailwind v4 `@theme` + var() | https://tailwindcss.com/docs/theme | 任意 `bg-[var(--xxx)]` / `text-[var(--xxx)]` 内联引用 |

---

## Patterns to Mirror

### USE_THEME_COMPOSABLE
```ts
// SOURCE: C:/Users/woodfish/Desktop/前端/weather/weather/src/composables/useTheme.ts:1-40
import { readonly, shallowRef } from 'vue';
export type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'weather-theme-mode';
const theme = shallowRef<ThemeMode>('dark');

const applyTheme = (nextTheme: ThemeMode) => {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
};

const getPreferredTheme = (): ThemeMode => {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = () => {
  const initializeTheme = () => applyTheme(getPreferredTheme());
  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme.value === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    return nextTheme;
  };
  return { theme: readonly(theme), initializeTheme, toggleTheme };
};
```

**适配 VueCubeBlog**：
- 改类型 `'dark' | 'light'` → `'night' | 'day'`(语义匹配本项目"夜/昼"叙事)
- STORAGE_KEY 改为 `'vuecubeblog-theme'`
- 数据属性键名也用 `night/day`(CSS 选择器 `[data-theme="night"]` / `[data-theme="day"]`)
- 默认值：本期决定 **忽略 prefers-color-scheme**,由用户首次手动切换,默认 night

### VIEW_TRANSITION_HANDLER
```ts
// SOURCE: C:/Users/woodfish/Desktop/前端/weather/weather/src/App.vue:72-166
const setThemeTransitionOrigin = (x: number, y: number) => {
  const root = document.documentElement;
  const maxX = Math.max(x, window.innerWidth - x);
  const maxY = Math.max(y, window.innerHeight - y);
  const radius = Math.hypot(maxX, maxY);
  root.style.setProperty('--theme-switch-x', `${x}px`);
  root.style.setProperty('--theme-switch-y', `${y}px`);
  root.style.setProperty('--theme-switch-radius', `${radius}px`);
};

const handleThemeToggle = ({ x, y }: { x: number; y: number }) => {
  setThemeTransitionOrigin(x, y);
  const api = (document as DocumentWithViewTransition).startViewTransition;
  if (!api || prefersReducedMotion.value) {
    toggleTheme();
    clearThemeTransitionOrigin();
    return;
  }
  const transition = api.call(document, async () => {
    toggleTheme();
    await nextTick();
  });
  transition.finished.finally(() => clearThemeTransitionOrigin());
};
```

**适配 VueCubeBlog**：把此 handler 内化到 useTheme.ts 内,导出为 `toggleThemeAt(x, y)`,所有组件可直接调用,无需 App.vue 中转。

### THEME_TOGGLE_BUTTON
```vue
<!-- SOURCE: C:/Users/woodfish/Desktop/前端/weather/weather/src/components/SiteNavigation.vue:32-37, 150-166 -->
<button @click="emitThemeToggle"
  class="flex h-10 w-10 items-center justify-center text-white opacity-60 hover:opacity-100 transition-opacity duration-300"
  :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'">
  <SunMedium v-if="theme === 'dark'" class="w-5 h-5" stroke-width="1.5" />
  <MoonStar v-else class="w-5 h-5" stroke-width="1.5" />
</button>

<script setup lang="ts">
const emit = defineEmits<{ toggleTheme: [{ x: number; y: number }] }>();
const emitThemeToggle = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    emit('toggleTheme', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    return;
  }
  const bounds = target.getBoundingClientRect();
  emit('toggleTheme', {
    x: event.clientX || bounds.left + bounds.width / 2,
    y: event.clientY || bounds.top + bounds.height / 2,
  });
};
</script>
```

**适配 VueCubeBlog**：
- `SunMedium` / `MoonStar` → **手写 SVG**(避免新增 lucide 依赖)
- 颜色：`text-white` → `text-[var(--stage-fg)]`,让按钮在 night/day 都自动适配

### TOKENS_DUAL_BLOCK
```css
/* SOURCE: C:/Users/woodfish/Desktop/前端/weather/weather/src/style.css:21-49 */
:root { /* dark tokens */ }
html[data-theme="light"] {
  color-scheme: light;
  --color-brand-primary: #0a1220;
  /* ...完整覆盖 */
}
```
**适配**：本项目用 `:root, [data-theme="night"]` 做 night 默认,`[data-theme="day"]` 做 day 覆盖。

### COMPOSABLE_RETURN_SHAPE (geometry)
```ts
// SOURCE: src/composables/useHypercube.ts:8-16
export interface Hypercube {
  group: THREE.Group;
  line: THREE.LineSegments;
  points: THREE.Points;
  hitMesh: THREE.Mesh;
  update: (delta: number) => void;
  lerpColor: (target: THREE.Color, factor: number) => void;
  dispose: () => void;
}
```
新接口 `MobiusStrip` **去掉 points 字段**(仅黑线);两个 composable 共同新增 `setOpacity(alpha)`。

---

## Files to Change

### Phase A — 主题框架 + 舞台层(9 files)
| File | Action | Justification |
|---|---|---|
| `src/composables/useTheme.ts` | CREATE | 主题状态 + localStorage + html data-theme + toggleThemeAt |
| `src/composables/useMobiusStrip.ts` | CREATE | 极简黑线版几何 |
| `src/components/scene/mobius-rotation.ts` | CREATE | 旋转归一化工具(与 hypercube-rotation 等价) |
| `src/components/layout/ThemeToggle.vue` | CREATE | 半月/太阳 SVG 按钮,emit{x,y} |
| `tests/composables/use-theme.test.ts` | CREATE | 切换 / 持久化 / 默认值 |
| `tests/scene/mobius-rotation.test.ts` | CREATE | 镜像 hypercube-rotation.test.ts |
| `tests/layout/theme-toggle.test.ts` | CREATE | 渲染 / 点击 / aria |
| `src/assets/main.css` | UPDATE | 追加 14 个双主题 tokens + view-transition 关键帧 + 纸纹噪点 |
| `src/App.vue` | UPDATE | 挂 useTheme.initializeTheme |
| `index.html` | UPDATE | critical CSS 双主题 + 同步 inline script 防 FOUC |
| `src/views/HomeView.vue` | UPDATE | bg/text token 化;hint reactive |
| `src/composables/useHypercube.ts` | UPDATE | 增加 `setOpacity(alpha)`;材质 transparent: true |
| `src/composables/useStarField.ts` | UPDATE | 暴露 material + `setOpacity(alpha)` |
| `src/components/scene/ThreeSceneCanvas.vue` | UPDATE | 双几何体共存;watch theme;clearColor 与 starfield 同步 |

### Phase B — SiteNav + 面板外壳 token 化(10 files)
| File | Action | Justification |
|---|---|---|
| `src/components/layout/SiteNav.vue` | UPDATE | 嵌入 ThemeToggle;text-gray-400 / text-white → token |
| `src/components/home/AuthorPanel.vue` | UPDATE | text-white/X 与 border-white/X → token |
| `src/components/home/AuthorBio.vue` | UPDATE | 同上 |
| `src/components/home/AuthorContact.vue` | UPDATE | 同上;保留品牌色 hover 不变(#FB7299/#12B7F5/#07C160) |
| `src/components/home/AuthorTimeline.vue` | UPDATE | 同上 |
| `src/components/home/FriendPanel.vue` | UPDATE | 同上 |
| `src/components/home/friend/FriendLinkCard.vue` | UPDATE | 同上 |
| `src/components/home/friend/FriendLinkApplicationForm.vue` | UPDATE | 同上 |
| `src/components/home/WorksPanel.vue` | UPDATE | 同上 |
| `src/components/home/PostPanel.vue` | UPDATE | 同上 |

### Phase C — Blog 子组件 + 文章页 + NotFound(6 files)
| File | Action | Justification |
|---|---|---|
| `src/components/home/blog/BlogResults.vue` | UPDATE | text/border token 化 |
| `src/components/home/blog/BlogResultCard.vue` | UPDATE | 同上 |
| `src/components/home/blog/BlogSearchBar.vue` | UPDATE | 同上 |
| `src/components/home/blog/BlogFilterRail.vue` | UPDATE | 同上 |
| `src/components/home/ReadingOverlay.vue` | UPDATE | 文章遮罩;维持 `--article-*` 已有变量;适配双主题 |
| `src/views/NotFoundView.vue` | UPDATE | bg/text 全 token 化 |
| `src/assets/main.css` (Phase C) | UPDATE | `article-*` 系列变量加 day 主题覆盖块 |

## NOT Building
- 不删除超立方体(双几何体共存)
- 不引入 `prefers-color-scheme` 系统跟随(默认 night,由用户手动切换)
- 不引入 lucide-vue-next 等图标库(半月/太阳手写 SVG)
- 不重构内容生成管道、路由、内容数据模型
- 不修改面板内部品牌色 hover(#FB7299/#12B7F5/#07C160 是 social brand color,与主题独立)

---

## Step-by-Step Tasks

### Phase A: 主题框架 + 舞台层

#### Task A1: 新建 `src/composables/useTheme.ts`
- **ACTION**: 直接移植 weather 项目的 useTheme,适配 night/day 命名与本项目 STORAGE_KEY;并内化 `toggleThemeAt(x, y)`。
- **IMPLEMENT**:
  ```ts
  import { readonly, shallowRef } from "vue";

  export type ThemeMode = "night" | "day";
  const STORAGE_KEY = "vuecubeblog-theme";

  const getPreferredTheme = (): ThemeMode => {
    if (typeof window === "undefined") return "night";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "day" || saved === "night") return saved;
    } catch {
      /* private mode → fall through */
    }
    return "night"; // 不接管 prefers-color-scheme;默认 night
  };

  const theme = shallowRef<ThemeMode>(getPreferredTheme());

  const applyTheme = (next: ThemeMode) => {
    theme.value = next;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next === "day" ? "light" : "dark";
    }
  };

  const writePersisted = (mode: ThemeMode) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const toggleThemeSync = () => {
    const next: ThemeMode = theme.value === "night" ? "day" : "night";
    applyTheme(next);
    writePersisted(next);
    return next;
  };

  export const toggleThemeAt = (x: number, y: number) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const maxX = Math.max(x, window.innerWidth - x);
    const maxY = Math.max(y, window.innerHeight - y);
    const radius = Math.hypot(maxX, maxY);
    root.style.setProperty("--theme-switch-x", `${x}px`);
    root.style.setProperty("--theme-switch-y", `${y}px`);
    root.style.setProperty("--theme-switch-radius", `${radius}px`);

    const clear = () => {
      root.style.removeProperty("--theme-switch-x");
      root.style.removeProperty("--theme-switch-y");
      root.style.removeProperty("--theme-switch-radius");
    };

    type ViewTransitionLike = { finished: Promise<void> };
    const api = (document as Document & {
      startViewTransition?: (cb: () => void | Promise<void>) => ViewTransitionLike;
    }).startViewTransition;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!api || reduced) {
      toggleThemeSync();
      clear();
      return;
    }
    const transition = api.call(document, () => {
      toggleThemeSync();
    });
    transition.finished.finally(clear);
  };

  export const useTheme = () => {
    const initializeTheme = () => applyTheme(getPreferredTheme());
    return {
      theme: readonly(theme),
      initializeTheme,
      toggleThemeSync,
      toggleThemeAt,
    };
  };
  ```
- **MIRROR**: USE_THEME_COMPOSABLE + VIEW_TRANSITION_HANDLER
- **GOTCHA**:
  - 模块级 `shallowRef`：单例。SSR 环境不会重复触发 applyTheme(typeof document 守卫)。
  - localStorage 在隐私模式下抛错;用 try/catch 兜底。
  - `toggleThemeAt` 在 jsdom 中无 `startViewTransition`,自动走降级分支;便于单测。
- **VALIDATE**: Task A6 测试。

#### Task A2: 新建 `src/components/scene/mobius-rotation.ts`
- **ACTION**: 复制 `hypercube-rotation.ts`,类型 `HypercubeRotation` → `MobiusRotation`,导出函数名 `normalizeRotationForTween` 保留。
- **VALIDATE**: Task A6 测试。

#### Task A3: 新建 `src/composables/useMobiusStrip.ts`
- **ACTION**: 极简版：仅 LineSegments + 黑色 LineBasicMaterial + hitMesh;**不创建 PointsMaterial**;接受可选 color 入参。
- **IMPLEMENT**:
  ```ts
  import * as THREE from "three";

  const R = 2;
  const STRIP_HALF_WIDTH = 0.5;
  const U_SEGMENTS = 160;
  const V_SEGMENTS = 8;
  const VERTEX_COUNT = U_SEGMENTS * (V_SEGMENTS + 1);

  export interface MobiusData {
    params: Array<{ u: number; v: number }>;
    edges: number[];
  }

  export function generateMobiusData(): MobiusData {
    const params: Array<{ u: number; v: number }> = [];
    const stride = V_SEGMENTS + 1;
    for (let i = 0; i < U_SEGMENTS; i++) {
      const u = (i / U_SEGMENTS) * Math.PI * 2;
      for (let j = 0; j <= V_SEGMENTS; j++) {
        const v = ((j / V_SEGMENTS) * 2 - 1) * STRIP_HALF_WIDTH;
        params.push({ u, v });
      }
    }
    const edges: number[] = [];
    for (let i = 0; i < U_SEGMENTS; i++) {
      const next = (i + 1) % U_SEGMENTS;
      for (let j = 0; j <= V_SEGMENTS; j++) {
        edges.push(i * stride + j, next * stride + j);
      }
      for (let j = 0; j < V_SEGMENTS; j++) {
        const a = i * stride + j;
        edges.push(a, a + 1);
      }
    }
    return { params, edges };
  }

  export interface MobiusStrip {
    group: THREE.Group;
    line: THREE.LineSegments;
    hitMesh: THREE.Mesh;
    update: (delta: number) => void;
    lerpColor: (target: THREE.Color, factor: number) => void;
    setOpacity: (alpha: number) => void;
    dispose: () => void;
  }

  export function useMobiusStrip(): MobiusStrip {
    const { params, edges } = generateMobiusData();
    const group = new THREE.Group();

    const hitGeom = new THREE.SphereGeometry(3.0, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeom, hitMat);
    group.add(hitMesh);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(VERTEX_COUNT * 3), 3),
    );
    geometry.setIndex(edges);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0a0a0a,
      transparent: true,
      opacity: 0, // 等切换 watcher 推到 1
    });
    const line = new THREE.LineSegments(geometry, lineMaterial);
    group.add(line);

    let elapsed = 0;

    function writePositions(t: number) {
      const positions = geometry.attributes.position.array as Float32Array;
      for (let k = 0; k < params.length; k++) {
        const { u, v } = params[k];
        const breathing = 0.04 * Math.sin(u * 3 + t * 1.4);
        const radius = R + (v + breathing) * Math.cos(u / 2);
        positions[k * 3] = radius * Math.cos(u);
        positions[k * 3 + 1] = radius * Math.sin(u);
        positions[k * 3 + 2] = (v + breathing) * Math.sin(u / 2);
      }
      geometry.attributes.position.needsUpdate = true;
    }
    writePositions(0);

    function update(delta: number) {
      elapsed += delta;
      writePositions(elapsed);
    }
    function lerpColor(target: THREE.Color, factor: number) {
      lineMaterial.color.lerp(target, factor);
    }
    function setOpacity(alpha: number) {
      lineMaterial.opacity = alpha;
    }
    function dispose() {
      hitGeom.dispose();
      hitMat.dispose();
      geometry.dispose();
      lineMaterial.dispose();
    }

    return { group, line, hitMesh, update, lerpColor, setOpacity, dispose };
  }
  ```
- **MIRROR**: COMPOSABLE_RETURN_SHAPE(去 points)
- **GOTCHA**:
  - 初始 opacity=0,避免 mount 时一帧黑色线圈在黑底上抢戏。
  - 不接受 circleTexture 参数;与 Hypercube 接口分流。
- **VALIDATE**: typecheck。

#### Task A4: 修改 `src/composables/useHypercube.ts`
- **ACTION**: 增加 `setOpacity(alpha)`;材质设 `transparent: true, opacity: 1`。
- **IMPLEMENT** — 4 处:
  1. `interface Hypercube` 增加 `setOpacity: (alpha: number) => void;`
  2. `lineMaterial` 选项加 `transparent: true, opacity: 1`
  3. `pointsMaterial` 已有 `transparent: true`,确认即可
  4. 新函数 + return：
     ```ts
     function setOpacity(alpha: number) {
       lineMaterial.opacity = alpha;
       pointsMaterial.opacity = alpha;
     }
     return { ..., setOpacity };
     ```
- **GOTCHA**: 非破坏性变更;既有调用点不受影响。
- **VALIDATE**: typecheck。

#### Task A5: 修改 `src/composables/useStarField.ts`
- **ACTION**: 暴露 material;增加 `setOpacity(alpha)`。
- **IMPLEMENT**:
  ```ts
  export interface StarField {
    group: THREE.Group;
    material: THREE.PointsMaterial;
    update: (delta: number) => void;
    setOpacity: (alpha: number) => void;
    dispose: () => void;
  }
  // 函数体加：
  function setOpacity(alpha: number) {
    material.opacity = alpha;
  }
  // return 加：material, setOpacity
  ```
- **VALIDATE**: typecheck。

#### Task A6: 新建测试三件套
- **`tests/composables/use-theme.test.ts`**(4 case)：默认 night、toggleSync 正确、toggleThemeAt 降级分支、hydrate from localStorage
- **`tests/scene/mobius-rotation.test.ts`**：复制 hypercube-rotation.test.ts,改 import 路径
- **`tests/layout/theme-toggle.test.ts`**(3 case)：渲染太阳(night)、点击切换为月亮、emit 携带 x/y

```ts
// use-theme.test.ts 关键 case
beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

it("defaults to night when no persisted value", () => {
  const { theme, initializeTheme } = useTheme();
  initializeTheme();
  expect(theme.value).toBe("night");
});

it("toggleSync flips and persists", () => {
  const { theme, initializeTheme, toggleThemeSync } = useTheme();
  initializeTheme();
  toggleThemeSync();
  expect(theme.value).toBe("day");
  expect(window.localStorage.getItem("vuecubeblog-theme")).toBe("day");
  expect(document.documentElement.dataset.theme).toBe("day");
});

it("toggleThemeAt falls back to sync in jsdom (no startViewTransition)", () => {
  const { theme, initializeTheme, toggleThemeAt } = useTheme();
  initializeTheme();
  toggleThemeAt(100, 100);
  expect(theme.value).toBe("day");
});

it("hydrates from localStorage", () => {
  window.localStorage.setItem("vuecubeblog-theme", "day");
  const { theme, initializeTheme } = useTheme();
  initializeTheme();
  expect(theme.value).toBe("day");
});
```

> **GOTCHA**：useTheme 内部用 module-level shallowRef,跨测试 case 状态共享。每个 case 用 `initializeTheme()` 重置或显式调用 `applyTheme("night")`。

#### Task A7: 新建 `src/components/layout/ThemeToggle.vue`
- **ACTION**: 半月/太阳手写 SVG 按钮 + emit{x,y}。
- **IMPLEMENT**:
  ```vue
  <script setup lang="ts">
  import type { ThemeMode } from "@/composables/useTheme";

  defineProps<{ theme: ThemeMode }>();
  const emit = defineEmits<{ toggleTheme: [{ x: number; y: number }] }>();

  const emitThemeToggle = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      emit("toggleTheme", { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      return;
    }
    const bounds = target.getBoundingClientRect();
    emit("toggleTheme", {
      x: event.clientX || bounds.left + bounds.width / 2,
      y: event.clientY || bounds.top + bounds.height / 2,
    });
  };
  </script>

  <template>
    <button
      type="button"
      class="pointer-events-auto flex h-10 w-10 items-center justify-center text-[var(--stage-fg)] opacity-60 transition-opacity duration-300 hover:opacity-100"
      :aria-label="theme === 'night' ? '切换到白昼模式' : '切换到黑夜模式'"
      :aria-pressed="theme === 'day'"
      @click="emitThemeToggle"
    >
      <!-- SunMedium(night 时显示,按下切到 day) -->
      <svg
        v-if="theme === 'night'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <!-- MoonStar(day 时显示,按下切到 night) -->
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  </template>
  ```
- **MIRROR**: THEME_TOGGLE_BUTTON
- **GOTCHA**:
  - 不显示文字标签(保持半月图标的极简)。
  - aria-label 用中文(项目首页提示文案也是中文)。
- **VALIDATE**: Task A6 测试。

#### Task A8: 修改 `src/App.vue`
- **ACTION**: 装入 useTheme.initializeTheme;handler 已在 useTheme 内部,App.vue 仅负责一次性初始化。
- **IMPLEMENT**:
  ```vue
  <script setup lang="ts">
  import { onMounted } from "vue";
  import { useTheme } from "@/composables/useTheme";

  const { initializeTheme } = useTheme();
  onMounted(() => {
    initializeTheme();
  });
  </script>

  <template>
    <RouterView />
  </template>
  ```
- **GOTCHA**:
  - 因为 `index.html` 的 inline script 已经设了 `data-theme`,这里 initializeTheme 起的作用是把 module-level shallowRef 同步到 localStorage 中的偏好(若 inline script 设的是 night 默认,initializeTheme 会再次确认)。
- **VALIDATE**: 浏览器 devtools 检查 `<html data-theme="night|day">`,切换后变化。

#### Task A9: 修改 `src/assets/main.css`
- **ACTION**: 在 `:root` 块后追加新 token 双套 + view-transition 关键帧;修改现有 `body` 规则追加 transition;添加纸纹噪点 `body::before`。
- **IMPLEMENT** — 3 个子步骤：
  1. **追加 tokens**：在 `:root { … }` 块之后、`html,body,#app { … }` 块之前插入完整 tokens 块（见 Visual System 节）+ article-* day 覆盖块（Phase C 的一部分也在这里）
  2. **修改现有 body 规则**：找到现有的 `body { color: var(--foreground); background: var(--background); … }`（main.css line 35-42），在其中追加：
     ```css
     transition: background-color 0.4s ease, color 0.4s ease;
     ```
     **注意**：不删原有 `color` / `background` 声明;`--foreground` / `--background` 由 article-page 等使用，与新 `--stage-fg` / `--stage-bg` 并存，命名空间隔离。
  3. **纸纹噪点**（在文件末尾 `.article-view` 等之后插入）：
     ```css
     body::before {
       content: "";
       position: fixed;
       inset: 0;
       pointer-events: none;
       z-index: 1;
       opacity: var(--paper-noise-opacity);
       background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
       transition: opacity 0.4s ease;
     }
     ```
- **GOTCHA**:
  - `[data-theme="day"]` 选择器在 html 上生效(applyTheme 写入 documentElement)。
  - 既有 `--background` / `--foreground` **不删**，因 article-page 等使用了它们;新 token `--stage-*` 与旧 token 并存，命名空间隔离。
  - `--theme-transition` CSS 变量在 tokens 里未单独声明（view-transition 时长 500ms 已在 keyframe 里硬编码），如需动态调整，可在 `[data-theme="night"]` / `[data-theme="day"]` 块内追加 `--theme-transition: 500ms`。
- **VALIDATE**: devtools 检查 `<html data-theme="night|day">`，token 值在两套间切换;纸纹噪点在 day 可见(opacity 0.045)、night 不可见(opacity 0)。

#### Task A10: 修改 `index.html`
- **ACTION**: 防 FOUC inline script + critical CSS 双主题。
- **IMPLEMENT** — 在 `</head>` 前插入：
  ```html
  <script>
    (function () {
      try {
        var t = localStorage.getItem("vuecubeblog-theme");
        if (t === "day" || t === "night") {
          document.documentElement.setAttribute("data-theme", t);
          document.documentElement.style.colorScheme = t === "day" ? "light" : "dark";
        } else {
          document.documentElement.setAttribute("data-theme", "night");
          document.documentElement.style.colorScheme = "dark";
        }
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "night");
      }
    })();
  </script>
  ```
  并把 critical inline CSS 改为：
  ```css
  body { background-color: #050510; color: #ffffff; margin: 0; }
  html[data-theme="day"] body { background-color: #FAFAF7; color: #0A0A0A; }
  #app { min-height: 100vh; }
  ```
- **GOTCHA**:
  - 当前 CSP 允许 `script-src 'self' 'unsafe-inline'`(index.html line 91),inline script 合规。
  - 此 script 同步执行;data-theme 在 main.css 加载前就已设上,避免黑→白闪烁。
- **VALIDATE**: 在 day 模式下硬刷新,无明显黑闪。

#### Task A11: 修改 `src/views/HomeView.vue`
- **ACTION**: bg/text token 化、hint reactive。ThemeToggle 由 SiteNav 承担(Phase B),HomeView 不直接挂。
- **IMPLEMENT**:
  1. line 41 `<main class="... bg-[#050510] text-white">` → `<main class="... text-[var(--stage-fg)]" :style="{ backgroundColor: 'var(--stage-bg)' }">`
  2. line 52 hint：
     ```vue
     <script setup lang="ts">
     import { computed } from "vue";
     import { useTheme } from "@/composables/useTheme";
     const { theme } = useTheme();
     const hintLabel = computed(() =>
       theme.value === "night" ? "点击超立方体进行探索" : "点击莫比乌斯环进行探索",
     );
     </script>
     <!-- template -->
     <div class="animate-bounce text-sm tracking-widest opacity-70" :style="{ color: 'var(--stage-hint)' }">
       {{ hintLabel }}
     </div>
     ```
  3. 其他 `text-white/X` `bg-white/X` `border-white/X` 在 HomeView 内的零散用法 → 用 token：
     - `text-white/50` → `text-[var(--stage-hint)]`
     - `border-white/10` → `border-[var(--border-subtle)]`
     - `bg-white/[0.04]` → `bg-[var(--surface-soft)]`
- **GOTCHA**:
  - Tailwind v4 任意值 `bg-[var(--xxx)]` 已原生支持。
  - 因 BlogPanel/AuthorPanel 等会在 Phase B 改,HomeView 内引用面板的 wrapper 类暂保持现状(黑色渐变在白底上仍是黑卡片 — 编辑感)。
- **VALIDATE**: 浏览器看 home 模式下双主题下文字/背景适配。

#### Task A12: 修改 `src/components/scene/ThreeSceneCanvas.vue`
- **ACTION**: 双几何体共存 + watch theme + clearColor 跟随 + starfield 即时切换(由 view-transition 包裹)。
- **IMPLEMENT** — 关键修改：
  1. 引入 mobius + useTheme：
     ```ts
     import { useMobiusStrip, type MobiusStrip } from "@/composables/useMobiusStrip";
     import { useTheme } from "@/composables/useTheme";
     const { theme } = useTheme();
     let mobius: MobiusStrip | null = null;
     ```
  2. onMounted 内挂载两个几何体：
     ```ts
     hypercube = useHypercube(circleTexture);
     mobius = useMobiusStrip();
     threeScene.scene.add(hypercube.group);
     threeScene.scene.add(mobius.group);
     applyThemeImmediate(theme.value);
     ```
  3. 新增辅助函数：
     ```ts
     function applyThemeImmediate(mode: "night" | "day") {
       if (!threeScene || !hypercube || !mobius || !starField) return;
       const bg = mode === "night" ? "#050510" : "#FAFAF7";
       threeScene.scene.background = new THREE.Color(bg);
       threeScene.renderer.setClearColor(new THREE.Color(bg));
       hypercube.setOpacity(mode === "night" ? 1 : 0);
       hypercube.group.scale.setScalar(mode === "night" ? 1 : 0.001);
       mobius.setOpacity(mode === "day" ? 1 : 0);
       mobius.group.scale.setScalar(mode === "day" ? 1 : 0.001);
       starField.setOpacity(mode === "night" ? 1 : 0);
     }

     watch(() => theme.value, (mode) => {
       applyThemeImmediate(mode);
     });
     ```
  4. tick 内精确修改（关键代码段）：
     ```ts
     // 每帧同时更新两个几何体（update 很轻）
     hypercube.update(delta);
     mobius.update(delta);

     // 自旋只施加在当前可见的几何体上
     if (!store.isFocusing && !rotationTween) {
       const active = theme.value === "night" ? hypercube.group : mobius.group;
       active.rotation.y += delta * 0.1;
       active.rotation.x += delta * 0.05;
     }

     // hover 拾取：用当前可见的 hitMesh
     if (!store.isFocusing) {
       raycaster.setFromCamera(pointer, threeScene.camera);
       const activeHit = theme.value === "night" ? hypercube.hitMesh : mobius.hitMesh;
       const intersects = raycaster.intersectObject(activeHit);
       hovered.value = intersects.length > 0;
     } else {
       hovered.value = false;
     }

     // 颜色 lerp
     const nightHover = new THREE.Color("#7ea8ff");
     const nightIdle = new THREE.Color("#ffffff");
     const dayHover = new THREE.Color("#1E3A8A");
     const dayIdle = new THREE.Color("#0A0A0A");
     if (theme.value === "night") {
       hypercube.lerpColor(hovered.value ? nightHover : nightIdle, 0.1);
     } else {
       mobius.lerpColor(hovered.value ? dayHover : dayIdle, 0.1);
     }
     ```
  5. handleCanvasPointerDown：把 `hypercube` 替换为 active：
     ```ts
     const active = theme.value === "night" ? hypercube : mobius;
     if (!active) return;
     raycaster.setFromCamera(pointer, threeScene.camera);
     const intersects = raycaster.intersectObject(active.hitMesh);
     if (intersects.length > 0) {
       e.stopPropagation();
       savedFocusRotation.copy(active.group.rotation);
       store.goHome();
       store.enterFocus();
       void router.push(getRouteLocationForSiteMode("home"));
     }
     ```
  6. updateHypercubeTransform → **updateGeometryTransform**：内部所有 `hypercube` 替换为 `active`：
     ```ts
     function updateGeometryTransform() {
       if (!threeScene || !container.value) return;
       const active = theme.value === "night" ? hypercube : mobius;
       if (!active) return;
       // ...其余逻辑不变,只把 hypercube → active
       gsap.to(active.group.position, { ... });
       gsap.to(active.group.rotation, { ... });
       gsap.to(active.group.scale, { ... });
     }
     ```
  7. dispose：两个几何体都 dispose;killTweensOf 都加
     ```ts
     starField?.dispose();
     hypercube?.dispose();
     mobius?.dispose();
     // ...
     ```
  8. `<div ref="container" class="absolute inset-0 z-0 bg-[#050510]">` → `bg-[var(--stage-bg)]`
- **GOTCHA**:
  - **关键设计决策**：View Transitions 已经包裹整页(含 canvas 快照),canvas 在转换期间被快照后参与 clip-path。**因此几何体即时切换**(applyThemeImmediate)而非渐变,让 clip-path 自然完成视觉过渡;否则会出现"圆形外圈是新画面、圆心是旧画面叠加正在变化的几何体"的视觉混乱。
  - `useThreeScene` 默认 backgroundColor "#050510" 不变(在 onMounted 立即被 `applyThemeImmediate` 改写)。
- **VALIDATE**: 切换主题瞬间,背景色与几何体在 clip-path reveal 圆圈内自然过渡(500ms)。

### Phase B: SiteNav + 面板外壳(10 files)

#### Task B1: 修改 `src/components/layout/SiteNav.vue`
- **ACTION**: 嵌入 ThemeToggle;nav 文字颜色 token 化;保留 logo `mix-blend-difference`。
- **IMPLEMENT**:
  1. 在 SiteNav 内、`</div data-nav-group="desktop">` 之后(桌面端)和汉堡按钮旁(移动端)插入 ThemeToggle：
     ```vue
     <!-- theme 是 readonly(shallowRef);template 中对 readonly proxy 不会自动解包,需显式 .value -->
     <ThemeToggle :theme="theme.value" @toggle-theme="onToggle" class="ml-6 hidden md:flex" />
     ```
     移动端版本：
     ```vue
     <ThemeToggle :theme="theme.value" @toggle-theme="onToggle" class="md:hidden mr-2" />
     ```
  2. 在 `<script setup>` 顶部加：
     ```ts
     import ThemeToggle from "@/components/layout/ThemeToggle.vue";
     import { useTheme } from "@/composables/useTheme";
     const { theme, toggleThemeAt } = useTheme();
     const onToggle = ({ x, y }: { x: number; y: number }) => toggleThemeAt(x, y);
     ```
  3. nav 链接颜色：
     - `text-gray-400` → `text-[var(--stage-hint)]`
     - `text-blue-300`(active) → `text-[var(--accent)]`
     - `bg-blue-200`(underline) → `bg-[var(--accent)]`
     - `text-white`(mobile menu button) → `text-[var(--stage-fg)]`
     - mobile menu drawer `bg-black/80` → `bg-[var(--surface-2)]`、`border-gray-800` → `border-[var(--border-subtle)]`
- **GOTCHA**:
  - 移动端 ThemeToggle 与汉堡按钮同列;放在汉堡按钮左侧,间距 `gap-2`。
  - `mix-blend-difference` 在 logo 上保留,可让黑/白底都可见。
- **VALIDATE**: 两套主题下 SiteNav 都清晰可读。

#### Task B2-B10: 各 Panel 组件 token 化
- **统一替换规则**(适用于 AuthorPanel/AuthorBio/AuthorContact/AuthorTimeline/FriendPanel/FriendLinkCard/FriendLinkApplicationForm/WorksPanel/PostPanel)：

| Before | After |
|---|---|
| `text-white` | `text-[var(--stage-fg)]` |
| `text-white/90` | `text-[var(--stage-hint-strong)]` |
| `text-white/80` 或 `text-white/[0.8]` | `text-[var(--stage-fg)]` + `opacity-80` |
| `text-white/60` | `text-[var(--stage-hint)]` |
| `text-white/50` | `text-[var(--stage-hint)]` |
| `text-white/40` 或 `text-white/30` | `text-[var(--stage-hint)]` + `opacity-60` |
| `bg-white/[0.04]` 或 `bg-white/[0.03]` | `bg-[var(--surface-soft)]` |
| `bg-black/80` | `bg-[var(--surface-2)]` |
| `border-white/10` | `border-[var(--border-subtle)]` |
| `border-white/[0.04]` | `border-[var(--border-subtle)]` |
| `bg-gradient-to-X from-black/95 via-black/80 to-transparent` | 暂保留 — 黑卡片在白底上即"白纸黑卡",编辑感保留;如需调整另开 plan |
| hover:bg-white hover:text-black(如 AuthorContact 内品牌按钮)| 保留 — 品牌色按钮是独立设计语言,与主题无关 |

- **GOTCHA**：每个文件改完跑一次 `npm run dev` 视觉验收;token 不要漏改某个权重(如 `text-white/35`)。
- **VALIDATE**：白昼模式下面板可读、卡片层次清晰、品牌色 hover 仍正确。

### Phase C: Blog + 文章页 + NotFound(6 files + main.css)

#### Task C1-C4: Blog 子组件 token 化
- 同 Phase B 替换规则;BlogResultCard 内的"日期 / 标签 / 类目"小标签皆走 `--stage-hint`。

#### Task C5: 修改 `src/views/NotFoundView.vue`
- 把 `bg-[#050510]` `text-white` `text-white/40` `border-white/15` 等替换为 token。

#### Task C6: 修改 `src/components/home/ReadingOverlay.vue` + `src/assets/main.css` 的 article-* 系列
- ReadingOverlay 内组件类名替换。
- main.css 中 `--article-surface` `--article-surface-strong` `--article-border` `--article-muted` `--article-accent` 等加 day 覆盖块：
  ```css
  [data-theme="day"] {
    --article-surface: rgba(255, 255, 255, 0.94);
    --article-surface-strong: rgba(255, 255, 255, 0.98);
    --article-surface-soft: rgba(10, 10, 10, 0.04);
    --article-border: rgba(10, 10, 10, 0.08);
    --article-accent: #1E3A8A;
    --article-accent-warm: #C7372F;
    --article-muted: rgba(10, 10, 10, 0.6);
    --article-shadow: 0 32px 110px rgba(10, 10, 10, 0.08);
    --article-code: rgba(10, 10, 10, 0.04);
    --article-quote: rgba(30, 58, 138, 0.08);

    /* 硬编码覆写：nav-link / nav-meta / status 等 */
    .article-page__nav-link,
    .article-page__nav-meta {
      border-color: rgba(10, 10, 10, 0.14);
      background: rgba(255, 255, 255, 0.7);
      color: rgba(10, 10, 10, 0.65);
    }
    .article-page__nav-link:hover {
      color: #0A0A0A;
      border-color: rgba(10, 10, 10, 0.28);
    }
    .article-page__status {
      border-color: rgba(10, 10, 10, 0.1);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(247, 249, 252, 0.88) 100%);
      color: rgba(10, 10, 10, 0.8);
    }
    .article-page__status-label {
      color: #0A0A0A;
    }
  }
  ```
- 文章 prose 内既已用 `var(--article-*)`,自动适配。
- **GOTCHA**：
  - 上述硬编码覆写放在 `[data-theme="day"]` 块内，利用 CSS 嵌套选择器（或追加为独立规则 `[data-theme="day"] .article-page__nav-link { ... }`）。
  - 若浏览器不支持 CSS nesting，改为独立顶层规则（Tailwind v4 的 `@import "tailwindcss"` 已包含 modern CSS 特性，nesting 安全）。

#### Task C7: 端到端浏览器烟测(覆盖三阶段)
- 14 项检查 + 额外：
  - 进入文章页(/posts/<slug>)后切换主题：article-* 颜色平滑过渡
  - blog 模式下 BlogResults 在白昼下可读
  - friend 模式下 FriendLinkCard 卡片在白昼下边框清晰
  - works 模式下 WorksPanel 在白昼下卡片层次明确
- **GOTCHA**：focus 模式下切换主题：莫比乌斯环已可拖动,应不破坏 OrbitControls 状态。

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge Case? |
|---|---|---|---|
| useTheme 默认 | localStorage empty | mode=night | 是 |
| useTheme hydrate | localStorage="day" | initializeTheme 后 mode=day | 是 |
| useTheme toggleSync | from night | mode=day, localStorage=day, html[data-theme=day] | — |
| useTheme toggleThemeAt(降级) | jsdom 无 startViewTransition | 即时切换 | 是 |
| mobius-rotation × 2 | 同 hypercube-rotation | — | — |
| ThemeToggle 渲染 night | theme=night | sun svg 显示,aria-pressed=false | — |
| ThemeToggle 点击 | theme=night | emit 携带 x/y | — |
| ThemeToggle 渲染 day | theme=day | moon svg 显示,aria-pressed=true | — |

### Edge Cases Checklist
- [ ] localStorage 不可用(隐私模式) → 回落 night,不抛错
- [ ] 浏览器不支持 startViewTransition → 即时切换
- [ ] prefers-reduced-motion: reduce → 即时切换
- [ ] view-transition 期间快速点击 → 第二次切换由浏览器自然处理(若 transition.finished 未完成,新调用会创建新 transition)
- [ ] focus 模式下切换主题 → OrbitControls 状态不丢
- [ ] 移动端切换主题(点击坐标在屏幕角落) → 圆形 reveal 半径正确(Math.hypot(maxX, maxY))
- [ ] 黑夜默认(无 localStorage)首次进入 day 切换：FOUC 防护脚本生效,无闪烁

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: 0 错误。

### Unit Tests
```bash
npm run test
```
EXPECT: 既有测试无回归 + 新增 ~10 case 全绿。

### Build
```bash
npm run build
```
EXPECT: typecheck + vite build 成功;产物大小：增量 < 15KB(mobius 几百顶点 + theme css 不到 1KB + ThemeToggle SVG 内联)。

### Browser Validation
```bash
npm run dev
```
- 默认 night,超立方体可见、星空可见
- 点击 SiteNav 内半月按钮：500ms 圆形从按钮位置展开 → day 主题
- 切换瞬间：背景白、莫比乌斯环(黑细线)显示、星空消失、SiteNav 文字反色、面板卡片色顺利切换
- 路由进入 /blog /author /friend /works /posts/<slug> 均双主题可读
- 刷新页面：主题保留
- 移动端汉堡 + ThemeToggle 不重叠

---

## Acceptance Criteria
- [ ] Phase A 完成(主题框架 + 舞台层)
- [ ] Phase B 完成(SiteNav + 面板外壳)
- [ ] Phase C 完成(Blog/文章页/NotFound)
- [ ] `npm run typecheck` 通过
- [ ] `npm run test` 通过(含 ~10 个新增 case)
- [ ] `npm run build` 通过
- [ ] 切换主题：圆形 reveal 从点击点 500ms 展开
- [ ] 莫比乌斯环：仅黑色细线,无顶点点阵
- [ ] 全站颜色协调(无 hardcoded text-white/bg-[#050510] 残留)
- [ ] 偏好持久化到 localStorage
- [ ] FOUC 防护脚本生效
- [ ] 不引入新外部依赖

## Completion Checklist
- [ ] tokens 双套,14 个语义变量 + article-* day 覆盖
- [ ] View Transitions API + clip-path circle 关键帧
- [ ] useTheme 单例 shallowRef + html data-theme + colorScheme
- [ ] 半月/太阳手写 SVG,不依赖图标库
- [ ] hypercube 与 mobius 接口对称(setOpacity)
- [ ] starField.setOpacity 暴露
- [ ] reduced-motion 降级为即时切换
- [ ] localStorage 隐私模式不抛错
- [ ] 不接管 prefers-color-scheme(默认 night)
- [ ] 自包含：实施时无需再查代码

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Safari < 18 不支持 startViewTransition | 中 | 中 | 已降级为即时切换(无动画);用户仍可切主题 |
| View Transitions 与 Vue Transitions(既有 panel 切换动画)冲突 | 低 | 中 | weather 项目同样并存,通过 `::view-transition-old(*) { animation: none }` 让 page-level transition 不参与;只对 `root` 应用 clip-path |
| Phase B 替换面积大,可能漏改个别权重 | 高 | 低 | 每个文件改完执行 `rg "text-white\|bg-\[#" src/ --include='*.vue'` 巡检;用 PR review 兜底 |
| 文章页 article-* tokens 与新 stage-* tokens 命名冲突 | 低 | 低 | 命名空间隔离：stage-*(舞台) / article-*(文章) / surface-*(卡片),互不重叠 |
| 移动端汉堡按钮 + ThemeToggle 同行挤压 | 中 | 低 | ThemeToggle md:hidden 时 size=8 w-8、gap-2;在 SiteNav 内调整布局 |
| critical inline script CSP 触发警告 | 低 | 低 | 当前 CSP 允许 'unsafe-inline',已合规 |
| mobius 在 night 模式下仍占内存(不可见但实例化)| 极低 | 极低 | 几百顶点 + 1 个材质,~20KB;可接受 |
| Phase B 期间 day 主题下 PostPanel/AuthorPanel 视觉未达预期 | 中 | 中 | 编辑感"白底黑卡"是预期设计;如确不满意,可在 Phase B 末做卡片色调微调 |
| `--theme-switch-x/y` CSS 变量 SSR 安全 | 低 | 低 | 仅在 client-side 触发;server 渲染时未读取 |
| useTheme module-level shallowRef 跨测试 case 状态共享 | 中 | 低 | 每个测试 beforeEach 重置 localStorage 与 document attribute,显式 initializeTheme |

## Notes

### 关于"圆形从点击点展开"的视觉效果
当用户在 SiteNav 右侧点击半月按钮,**新主题的整页内容会从按钮坐标为圆心、向外扩散一个圆盘 500ms**。这是 weather 项目最有"指尖魔法"感的细节,比 fade-in 强 10 倍。本 plan 完全保留。

### 关于"为什么不用 GSAP 也做几何体淡入淡出"
View Transitions API 已经包裹了整页(含 canvas),canvas 在转换期间是被快照后参与 clip-path 的 — 因此在 view-transition 内对几何体做额外 GSAP 反而会**让用户看到圆形外圈是新画面、圆心是旧画面叠加正在变化的几何体**,视觉混乱。决策：**view-transition 期间几何体即时切换**,由 clip-path 包裹自然完成视觉过渡。

### 关于黑卡片 vs 白底(Phase B 美学决策)
白昼模式下,面板(如 PostPanel)的渐变背景仍是从黑色出发。这是有意保留的"白纸上的黑色书签"美学,符合 Editorial Paper 方向。如果未来想要"白底白卡片"风格,需要额外重设面板渐变 tokens(建议单独 plan)。

### 关于 prefers-color-scheme
不接管的理由：本博客的核心叙事是深空黑夜美学,默认 night 更忠实于产品意图。用户主动切换 day 时再保留偏好。如未来希望"首次访问根据系统",把 useTheme.getPreferredTheme 改成检查 matchMedia 即可(一行)。

### 关于 useMobiusStrip 不接受参数
与 useHypercube 不同,mobius 是"白底专属"。它不需要 circleTexture(因为不画点)。即使未来想在 night 模式下也显示莫比乌斯环作为彩蛋,那也是新 composable 的事,不污染当前简洁接口。

### 关于阶段顺序
Phase A 是 user 可见的最大变化点(舞台层 + 切换器)。**A 完成后即可上线感受**;B/C 是渐进精修,不阻塞核心体验。建议每个 Phase 独立 PR / 独立 commit 段,便于回滚。

### 关于 weather 项目的二次差异
weather 用的是 `'dark' | 'light'`,本项目用 `'night' | 'day'` — 选择"夜/昼"是因为它更贴近本博客的"星空/纸面"叙事,符合 frontend-design "选一个方向并 commit" 的原则。

### 关于不写 storybook / visual regression
本项目无 storybook 体系;视觉验收靠 dev server 肉眼检查 + e2e 抽样(既有 e2e 在 tests/ 目录有 framework)。若长期维护需要,可在阶段 D 引入 chromatic / percy。
