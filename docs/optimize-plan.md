# VueCubeBlog 仓库优化计划

> 生成日期: 2026-05-05
> 扫描方式: repo-scan 四路并行(结构产物 / 源码质量 / 构建性能 / CI 安全)
> 状态: 仅产出计划,尚未动手

---

## 目录

- [优先级总览](#优先级总览)
- [P0 — Critical](#p0--critical-立即修)
  - [P0-1 Three.js 内存泄漏](#p0-1--threejs-内存泄漏)
  - [P0-2 post-index 巨型 chunk](#p0-2--post-index-巨型-chunk)
  - [P0-3 依赖归位](#p0-3--依赖归位)
- [P1 — High](#p1--high-本周内)
  - [P1-4 大组件拆分](#p1-4--大组件拆分)
  - [P1-5 Router + Store 去重](#p1-5--router--store-去重)
  - [P1-6 Vite 构建配置补齐](#p1-6--vite-构建配置补齐)
  - [P1-7 index.html preconnect/preload 去重 + SEO](#p1-7--indexhtml-preconnectpreload-去重--seo)
  - [P1-8 public/ 资源重复清理](#p1-8--public-资源重复清理)
- [P2 — Medium](#p2--medium-近期做)
  - [P2-9 Import 路径统一](#p2-9--import-路径统一)
  - [P2-10 CI/CD 改进](#p2-10--cicd-改进)
  - [P2-11 根目录清理](#p2-11--根目录清理)
- [P3 — Low](#p3--low-机会再做)
- [执行路线](#执行路线建议)

---

## 优先级总览

| 优先级 | 项目 | 涉及文件 | 预期收益 | 风险 |
|---|---|---|---|---|
| P0-1 | Three.js 内存泄漏 | `src/components/scene/ThreeSceneCanvas.vue` | 修复 GPU 内存泄漏,避免 WebGL Context Lost | 低 |
| P0-2 | post-index 巨型 chunk | `vite.config.ts` + 内容生成脚本 | 首屏 JS -600KB(gz -150KB) | 中 |
| P0-3 | 依赖归位 | `package.json` | bundle -30~50KB,避免误打包 | 低 |
| P1-4 | 大组件拆分 | `AuthorPanel.vue` 699L / `ThreeSceneCanvas.vue` 501L | 可维护性 | 中 |
| P1-5 | Router/Store 去重 | `src/router/index.ts` / `src/stores/site.ts` | 代码减少 ~30 行 | 中 |
| P1-6 | Vite 构建参数 | `vite.config.ts` | bundle -5~10%,build 快 5-10% | 低 |
| P1-7 | index.html 去重 + SEO | `index.html` | LCP -100~200ms,SEO 提升 | 低 |
| P1-8 | public/ 资源重复 | `public/imported-assets`/`remote-assets` | 部署包 -6MB | 低 |
| P2-9 | Import 路径统一 | 多文件 | 代码风格一致 | 低 |
| P2-10 | CI/CD 改进 | `.github/workflows/*` | 部署时间减半,自动化更新 | 低 |
| P2-11 | 根目录清理 | 根目录遗留文件 | 仓库整洁 | 低 |
| P3 | content-source 大文件 / three.js 按需 / 测试覆盖率 / CSP | 多处 | 长期治理 | 视情况 |

---

## P0 — Critical (立即修)

### P0-1 · Three.js 内存泄漏

**位置:** `src/components/scene/ThreeSceneCanvas.vue` (L90-202, L482-490)

**根本原因:**
`starGeom / starMat / hitGeom / hitMat / hcGeom / hcMat / hcPointsMat / circleTexture` 全部是 `onMounted` 内部的 `const` 局部变量。`onBeforeUnmount` 作用域之外**根本拿不到引用**,所以即便想 dispose 也无法清理。当前只对 `renderer / controls` 做了 dispose。

**当前代码(简化):**
```ts
onMounted(async () => {
  // L101: const circleTexture = new THREE.CanvasTexture(canvas);
  // L156: const starGeom = new THREE.BufferGeometry();
  // L158: const starMat = new THREE.PointsMaterial({ ... });
  // L177: const hitGeom = new THREE.SphereGeometry(...);
  // L178: const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  // L182: const hcGeom = new THREE.BufferGeometry();
  // L185: const hcMat = new THREE.LineBasicMaterial(...);
  // L190: const hcPointsMat = new THREE.PointsMaterial({ ... });
});

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener("resize", handleResize);
  if (container.value) container.value.removeEventListener("pointermove", handlePointerMove);
  if (canvasRef.value) canvasRef.value.removeEventListener("pointerdown", handleCanvasPointerDown);
  if (renderer) renderer.dispose();
  if (controls) controls.dispose();
  // ❌ geometries / materials / textures 全部泄漏
});
```

**改动方向:**

1. 把上述变量提到 `<script setup>` 顶层,用 `let` 声明(已有 `renderer / controls / camera / scene` 模式可参考):
   ```ts
   let starGeom: THREE.BufferGeometry | null = null;
   let starMat: THREE.PointsMaterial | null = null;
   let hitGeom: THREE.SphereGeometry | null = null;
   let hitMat: THREE.MeshBasicMaterial | null = null;
   let hcGeom: THREE.BufferGeometry | null = null;
   let hcMat: THREE.LineBasicMaterial | null = null;
   let hcPointsMat: THREE.PointsMaterial | null = null;
   let circleTexture: THREE.CanvasTexture | null = null;
   ```
2. `onMounted` 中改为赋值(去掉 `const`)。
3. `onBeforeUnmount` 中循环 dispose:
   ```ts
   onBeforeUnmount(() => {
     if (animationFrameId) cancelAnimationFrame(animationFrameId);
     window.removeEventListener("resize", handleResize);
     container.value?.removeEventListener("pointermove", handlePointerMove);
     canvasRef.value?.removeEventListener("pointerdown", handleCanvasPointerDown);

     [starGeom, hitGeom, hcGeom].forEach(g => g?.dispose());
     [starMat, hitMat, hcMat, hcPointsMat].forEach(m => m?.dispose());
     circleTexture?.dispose();
     scene?.clear();
     renderer?.dispose();
     controls?.dispose();
   });
   ```
4. 进一步重构(可选): 把 starField / hypercube 各自抽到 `useStarField()` / `useHypercube()` composable,内部自带 dispose 逻辑,SFC 仅负责生命周期入口。

**验证方式:**

- Chrome DevTools > Memory > Heap snapshot
- 反复路由进出 home 页 5-10 次,观察 `WebGLRenderer / BufferGeometry / Material` 引用数是否稳定不增长
- `chrome://gpu` 观察 GPU 内存占用

**预期收益:** 修复内存泄漏,长时间使用不会 WebGL Context Lost。

---

### P0-2 · post-index 巨型 chunk

**位置:**

- 产物: `dist/assets/post-index-C603TQ5z.js` **832KB**
- 配置: `vite.config.ts:163-170`(content-vendor manualChunks)
- 内容生成: `scripts/generate-content.mts` + `src/generated/post-index.*`(待确认)

**当前现象:** post 索引被打到 JS chunk,首屏强加载,即便用户不去 `/blog` 也要下载。

**改动方案(三选一):**

#### 方案 A — 改为 JSON 异步加载(推荐)

1. `scripts/generate-content.mts` 把 post 索引产出为 `public/post-index.json`(而非 `src/generated/post-index.ts`)。
2. 前端 `src/composables/useBlogQueryState.ts`(或新建 `usePostIndex.ts`)改为:
   ```ts
   const postIndex = ref<PostIndexEntry[] | null>(null);
   onMounted(async () => {
     const res = await fetch("/post-index.json");
     postIndex.value = await res.json();
   });
   ```
3. Service Worker 已配置 `/post-index.*\.json` 的 NetworkFirst 策略(`vite.config.ts:116-122`),无需改动。

#### 方案 B — 按 tag/year 分片 JSON

适用于文章数 > 100 的情况。首页只 fetch 摘要清单,进入具体 tag 再加载分片。

#### 方案 C — 快速止血(动态 import)

最小改动:在路由守卫或 BlogResults 进入时再 `import()`:
```ts
const blogModule = await import("@/generated/post-index");
```

**预期收益:** 首屏 JS -600KB(gzip -150KB),LCP 提前 300-500ms。

**验证方式:** `npm run build` 后看 dist 体积分布;Lighthouse Performance 测分对比。

---

### P0-3 · 依赖归位

**位置:** `package.json:37-58`

**问题清单:**

| 包 | 当前位置 | 应在 | 原因 |
|---|---|---|---|
| `gray-matter` | dependencies | devDependencies | 仅 `scripts/generate-content` 解析 frontmatter |
| `js-yaml` | dependencies | devDependencies | 同上,构建期使用 |
| `unified` | dependencies | devDependencies | markdown 编译期用,运行时已是 HTML |
| `remark-gfm` / `remark-parse` / `remark-rehype` | dependencies | devDependencies | 同上 |
| `rehype-highlight` / `rehype-raw` / `rehype-slug` / `rehype-stringify` | dependencies | devDependencies | 同上 |
| `@tailwindcss/typography` | dependencies | devDependencies | tailwind 构建期插件 |
| `isomorphic-dompurify` | devDependencies | dependencies(若运行时净化 HTML) | 待确认是否被 src 引用 |

**调查命令(动手前先跑):**
```bash
grep -rn "gray-matter\|js-yaml\|^import .* from ['\"]unified" src/ scripts/
grep -rn "isomorphic-dompurify" src/
```

**改动方式:** 调整 `package.json`,跑 `npm install` 重新生成 lock。

**验证方式:** `npm run build` 后 `grep -r "gray-matter\|js-yaml" dist/` 应无命中。

**预期收益:** bundle -30~50KB,防止误打包。

---

## P1 — High (本周内)

### P1-4 · 大组件拆分

| 文件 | 行数 | 拆分思路 |
|---|---|---|
| `src/components/home/AuthorPanel.vue` | 699 | 拆 `AuthorBio.vue` / `AuthorTimeline.vue` / `AuthorContact.vue`,父组件只负责布局 + props 透传 |
| `src/components/scene/ThreeSceneCanvas.vue` | 501 | 抽 `composables/useThreeScene.ts` / `useStarField.ts` / `useHypercube.ts`,SFC 仅作生命周期入口 |

**约束:** 拆分时保持外部 API(props/emits)不变,确保 `tests/home/` 现有用例继续通过。

---

### P1-5 · Router + Store 去重

**问题 1:** `src/router/index.ts:11-36` 五条路由全部指向 `HomeView`

```ts
{ path: "/", name: "home", component: HomeView },
{ path: "/works", name: "works", component: HomeView },
{ path: "/blog", name: "blog", component: HomeView },
{ path: "/author", name: "author", component: HomeView },
{ path: "/friend", name: "friend", component: HomeView },
```

**改成:**
```ts
{
  path: "/:mode(home|works|blog|author|friend)?",
  name: "home",
  component: HomeView,
  props: true,
}
```
HomeView 内通过 `route.params.mode` 调用 store 的 `syncRouteMode()` 同步。

**注意:** `router.push({ name: 'blog' })` 这类调用都要改,需要先全仓 grep 替换。

---

**问题 2:** `src/stores/site.ts:33-47` 五个 `goX()` 包装器

```ts
goHome()   { this.setPanelMode("home"); }
goBlog()   { this.setPanelMode("blog"); }
goAuthor() { this.setPanelMode("author"); }
goFriend() { this.setPanelMode("friend"); }
goWorks()  { this.setPanelMode("works"); }
```

**两种处置:**

- A) 删除全部 `goX()`,调用方直接 `setPanelMode("blog")`。
- B) 保留作为语义糖,接受。

> 这一项偏维护者口味,如果团队认为 `goBlog()` 比 `setPanelMode("blog")` 可读性更好,可降级到 P3。建议先 grep 调用点数量再决定。

**调查命令:**
```bash
grep -rn "goBlog\|goAuthor\|goFriend\|goWorks\|goHome()" src/
```

---

### P1-6 · Vite 构建配置补齐

**位置:** `vite.config.ts:143-173`

**当前缺失:**

```ts
build: {
  target: "es2020",                      // 显式声明 → 略小 bundle
  cssCodeSplit: true,                    // 显式启用(默认 true)
  reportCompressedSize: false,           // 加快 build,与 vite-plugin-compression 重复
  chunkSizeWarningLimit: 600,            // 当前 832KB chunk 不报警,过宽松
  minify: "esbuild",                     // 显式声明
  rollupOptions: {
    output: {
      manualChunks(id) { /* 现有逻辑 */ },
    },
  },
},
esbuild: {
  drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
},
```

**预期收益:** build 加快 5-10%,产物略小,production 自动剔除 console/debugger。

**验证方式:** `time npm run build` 对比;`grep "console.log" dist/assets/*.js` 应无业务代码命中。

---

### P1-7 · index.html preconnect/preload 去重 + SEO

**位置:** `index.html:24-64`

**问题 1 — 完全重复:** L25-38 与 L51-64 是**同样**的 Google Fonts preconnect+preload+noscript 块。

**改动:** 删 L24-38(保留 L40-64,因为它带详细注释)。

**问题 2 — SEO/分享 缺失:**

```html
<!-- 在 <title> 前补充 -->
<meta name="theme-color" content="#050510" />
<link rel="canonical" href="https://woodfishhhh.xyz/" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="WOODFISH | VueCubeBlog" />
<meta property="og:description" content="WOODFISH | Vue-powered immersive 3D blog experience." />
<meta property="og:url" content="https://woodfishhhh.xyz/" />
<meta property="og:image" content="/og-cover.webp" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="WOODFISH | VueCubeBlog" />
<meta name="twitter:description" content="WOODFISH | Vue-powered immersive 3D blog experience." />
<meta name="twitter:image" content="/og-cover.webp" />
```

**问题 3 — 业务路由 prefetch 缺:**

可在 head 中显式 modulepreload 关键 chunk:
```html
<link rel="modulepreload" href="/assets/HomeView-[hash].js" />
```
但这需要构建后注入 hash,推荐用 vite-plugin-html 或 PWA 插件的 injectManifest 钩子来动态生成。低优先,可后做。

---

### P1-8 · public/ 资源重复清理

**位置:** `public/imported-assets/` (6.1MB) 与 `public/remote-assets/` (6.1MB)

**调查命令:**
```bash
diff -rq public/imported-assets public/remote-assets | head
ls public/imported-assets | wc -l
ls public/remote-assets | wc -l
```

**改动方式:**

1. 若内容完全相同,保留一份(推荐 `imported-assets` 命名更清晰)。
2. grep 全仓库引用:
   ```bash
   grep -rn "remote-assets\|imported-assets" src/ scripts/ content/
   ```
3. 统一改为单一路径。
4. 删除根级 `favicon.svg` / `icons.svg`(若已存在于 public/)。

**预期收益:** 部署包 -6MB,deploy SCP 上传更快。

---

## P2 — Medium (近期做)

### P2-9 · Import 路径统一

**问题文件:**

| 文件 | 行 | 问题 |
|---|---|---|
| `src/main.ts` | 4-7 | `./router`、`./App.vue` 用相对路径 |
| `src/content/author.ts` | 2 | 相对路径 |
| `src/content/posts.ts` | 2-3 | 相对路径 |
| `src/content/friends.ts` | 2 | 相对路径 |
| `src/components/article/ArticleContent.vue` | 6-8 | 相对路径 |

**对比:** `src/router/index.ts:3,5-7` 全用 `@/`,风格不一致。

**改动选择:**

- A) 全部统一为 `@/`,加 ESLint 规则:
  ```js
  "no-restricted-imports": ["error", { "patterns": ["./*", "../*"] }]
  ```
  问题: sibling 之间也用 `@/` 路径会变长。

- B) 折中规则: 同目录用 `./`,跨目录用 `@/`,加 lint 规则约束。

> 建议 B,平衡可读性与一致性。

---

### P2-10 · CI/CD 改进

**1. deploy 复用 CI artifact**

当前 `ci.yml` 与 `deploy-vps.yml` 都跑全套 typecheck+test+build。

改为:
- `ci.yml` 末尾 upload `dist/` artifact
- `deploy-vps.yml` 改为 `workflow_run` 触发或先 download artifact

**2. 添加 `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: "development"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**3. 补 e2e 测试**

已装 `@playwright/test` 但 0 测试。先补 3 条核心流程:

- 首页加载: hypercube 出现 + author panel 可见
- blog 列表: 标签筛选交互
- 文章详情: 进入 PostView + TOC 可点击

**4. 覆盖率门槛**

`vitest.config.ts` 加:
```ts
test: {
  coverage: {
    provider: "v8",
    thresholds: {
      lines: 70, // 先定一个起点,后续逐步上调到 80
      functions: 70,
      statements: 70,
      branches: 60,
    },
  },
},
```
然后在 `ci.yml` 加 `npm run test -- --coverage` 步骤。

---

### P2-11 · 根目录清理

| 文件 | 大小 | 处置建议 |
|---|---|---|
| `Everything_Claude_Code_使用指南.docx` | 45KB | **删除** — 上次会话遗留,与博客业务无关 |
| `generate_ecc_guide.py` | 25KB | **删除** — 同上 |
| `dist-manual-deploy.tar.gz` | 16.5MB | 已 .gitignore;可删本地副本(deploy 流程不需要) |
| `.preview.err.log` / `.preview.out.log` / `.vite-dev.log` | <5KB | 已被 `*.log` 覆盖,可删 |
| `plan.md` | 6KB | 看是否仍在用,若否归档到 `docs/archive/` |
| 多份 `AGENTS.md` (×11) | 3.6KB | 已 `**/AGENTS.md` 忽略,本地保留无碍 |

**.gitignore 补充建议:**

```diff
+ # 历史会话遗留
+ Everything_Claude_Code_使用指南.docx
+ generate_ecc_guide.py
+
+ # 各 IDE/工具
+ .claude/
+ .superpowers/
+ .playwright-mcp/
+ .omx/
```

> 注意: `.claude/` 下若有要共享的配置(如 `.claude/agents/`)需谨慎排除。

---

## P3 — Low (机会再做)

### P3-12 · content/source 37MB

**问题:** `content/source/` 占整个仓库绝大部分,git pack/clone 慢。

**方案:**
- A) 走 git-lfs 跟踪原始素材
- B) 抽到独立私有仓 + git submodule
- C) 部署期外部下载(对象存储)

---

### P3-13 · three.js 按需 import

**目标:** `import { Mesh, BufferGeometry, ... } from 'three'` 替代 `import * as THREE`

**影响面:** ThreeSceneCanvas.vue 全文重写;collateral 收益约 100-200KB。需先做 P1-4 拆 composable。

---

### P3-14 · 测试覆盖率提升

当前文件覆盖比 ~36%(15 测试 / 42 源文件)。优先补:

- `src/composables/`(useArticleReading / useHomePanels / useBlogQueryState)
- `src/utils/`
- `src/components/scene/hypercube-rotation.ts`(已有部分)

---

### P3-15 · CSP 强化

`index.html:91` 当前含 `'unsafe-inline' 'unsafe-eval'`。改为 nonce/hash 模式需要 SSR 注入或构建期处理,SPA 实施成本高;建议保留现状,记录为已知风险。

---

## 执行路线建议

```
Day 1 (半天) — 风险最低,纯修复
  P0-1 内存泄漏
  P0-3 依赖归位
  P1-7 index.html 去重 + 加 SEO meta

Day 2 (1 天) — 性能收益最大
  P0-2 post-index 改 JSON
  P1-6 vite 配置补齐

Day 3 (1 天) — 需要回归测试
  P1-4 大组件拆分
  P1-8 public 去重

Day 4 (按需)
  P2-9 Import 路径统一
  P2-10 CI/CD 改进
  P2-11 根目录清理

Day 5+ (机会)
  P3 系列
```

---

## 验收清单

完成 P0+P1 后应满足:

- [ ] Chrome DevTools 反复路由切换,WebGL renderer 数量稳定
- [ ] `npm run build` dist 内无 `post-index-*.js` 大于 200KB 的 chunk
- [ ] `grep -r "gray-matter\|js-yaml" dist/` 无命中
- [ ] `npm run build` 产物 gzipped 总体积比当前 -10% 以上
- [ ] `npm run test` 全绿
- [ ] Lighthouse Performance ≥ 90 (desktop) / ≥ 75 (mobile)
- [ ] `index.html` 不再有重复的 preconnect/preload
- [ ] `.gitignore` 已覆盖所有遗留文件

---

> 完成项请勾选并附 commit hash;有新发现继续往下追加。
