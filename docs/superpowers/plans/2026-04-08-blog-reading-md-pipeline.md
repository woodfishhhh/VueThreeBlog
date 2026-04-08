# Blog Reading & MD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `VueCubeBlog` 变成一个真正的 `.md`-first 博客：文章内容在仓库内可维护、图片在 `/newBlog/` 子路径下可靠可用、阅读页升级为高级深色阅读器，并让 CI/CD 在 push 后自动完成内容构建与部署。

**Architecture:** 先把当前依赖外部 `../3Dblog` 的内容源迁回 `VueCubeBlog` 仓库内，保留现有“构建期生成 `src/generated/*.json`、运行时按需加载 JSON”的整体架构。然后在内容脚本层统一 base-aware 资源 URL 与文章元信息生成，再把阅读页拆成更清晰的 `hero / prose / toc / reading-state` 边界，最后让 GitHub Actions 走 `generate-content + verify + deploy` 的完整链路。

**Tech Stack:** Vue 3, TypeScript, Vite, Vue Router, Pinia, Vitest, Tailwind CSS, unified/remark/rehype, GitHub Actions

---

## File Structure

- `content/source/myblog/**/*`
  - 仓库内文章正文唯一来源；从当前兄弟目录 `../3Dblog/content/source/myblog` 一次性迁入并继续在本仓库维护
- `content/posts/**/*`
  - 旧博客文章目录；保留用于 legacy slug 指纹映射，避免现有文章链接失效
- `content/source/blog/source/_data/about.yml`
  - 作者数据本地副本，供内容生成脚本在 CI 中可用
- `content/source/blog/source/_data/link.yml`
  - 友情链接数据本地副本，供内容生成脚本在 CI 中可用
- `content/source/blog/_config.yml`
  - 站点作者/副标题等配置副本，供内容生成脚本在 CI 中可用
- `scripts/generate-content.mts`
  - 内容构建入口；改为读取仓库内内容源，不再依赖外部 `../3Dblog`
- `scripts/content/generator-core.ts`
  - 文章资源本地化核心；统一远程图/相对图/绝对图的 public URL 生成规则
- `scripts/content/build-site-content.ts`
  - 从本地内容源生成文章索引、文章详情、作者数据、友链数据
- `src/types/content.ts`
  - 扩展文章阅读页需要的新元信息字段，例如 `readingMinutes`、`coverImage`
- `src/content/posts.ts`
  - 继续保留 generated JSON 的运行时加载入口，但与新 schema 对齐
- `src/components/article/ArticleHero.vue`
  - 新增；文章头部信息、标题、摘要、元信息
- `src/components/article/ArticleProse.vue`
  - 新增；正文渲染壳与 markdown 区域语义样式挂载点
- `src/composables/useArticleReading.ts`
  - 新增；阅读进度、active heading、平滑跳转、scroll/observer 协调
- `src/components/article/ArticleContent.vue`
  - 重构为阅读页编排层，组合 hero / prose / toc
- `src/components/article/ArticleToc.vue`
  - 改成受控目录组件，通过 `activeId` + 事件与阅读状态解耦
- `src/views/PostView.vue`
  - 只保留路由和页面状态壳职责，并升级 loading / not-found 视觉
- `src/assets/main.css`
  - 重做阅读页视觉系统与文章元素样式
- `.github/workflows/ci.yml`
  - 改成在 CI 中生成内容后再做 typecheck / test / build
- `.github/workflows/deploy-vps.yml`
  - 改成在部署前生成最新内容并校验构建
- `tests/content/generator-core.test.ts`
  - 加入 base-aware 资源 URL 与远程图片本地化断言
- `tests/content/build-site-content.test.ts`
  - 加入文章元信息、作者/友链资源路径与新 schema 断言
- `tests/article/article-toc.test.ts`
  - 新增；锁定目录受控高亮与点击行为
- `tests/article/article-content.test.ts`
  - 新增；锁定阅读页 hero / metadata / prose / progress 的结构输出
- `tests/views/post-view.test.ts`
  - 新增；锁定 loading / not-found / article 三态
- `tests/setup.ts`
  - 补充 `IntersectionObserver`、`scrollIntoView` 等测试桩

## Task 1: 把博客内容源迁回 VueCubeBlog 仓库内

**Files:**
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\myblog\**\*.md`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\posts\**\index.md`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\source\_data\about.yml`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\source\_data\link.yml`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\_config.yml`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\generate-content.mts`

- [ ] **Step 1: 先确认当前脚本确实仍依赖外部 `../3Dblog`**

Run:
```bash
Get-Content "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\generate-content.mts"
Test-Path "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content"
```

Expected: `generate-content.mts` 仍然把 `sourceProjectRoot` 指向 `../3Dblog`，而仓库内尚无 `content/` 目录。

- [ ] **Step 2: 一次性迁入内容源和 legacy slug 数据**

Run:
```bash
New-Item -ItemType Directory -Force -Path "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source" | Out-Null
New-Item -ItemType Directory -Force -Path "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\source\_data" | Out-Null
Copy-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\3Dblog\content\source\myblog" "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\" -Recurse
Copy-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\3Dblog\content\posts" "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\" -Recurse
Copy-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\3Dblog\content\source\blog\source\_data\about.yml" "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\source\_data\about.yml"
Copy-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\3Dblog\content\source\blog\source\_data\link.yml" "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\source\_data\link.yml"
Copy-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\3Dblog\content\source\blog\_config.yml" "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\content\source\blog\_config.yml"
```

Expected: `VueCubeBlog/content/` 内已经具备文章、legacy slug、作者、友链所需数据。

- [ ] **Step 3: 改 `generate-content.mts` 让它默认读取当前仓库**

Implementation target:
```ts
const projectRoot = path.resolve(currentDir, "..");
const sourceProjectRoot = projectRoot;
```

Also do:
- 删除对 `../3Dblog/public` 的强依赖
- 保留 `public/` 作为内容构建输出目录
- 不再要求 CI 机器存在兄弟目录 `3Dblog`

- [ ] **Step 4: 跑一次内容生成，确认本地仓库已自洽**

Run:
```bash
Remove-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\generated\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\public\content-assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\public\imported-assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\public\remote-assets" -Recurse -Force -ErrorAction SilentlyContinue
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run generate:content
```

Expected: 生成成功，不依赖 `../3Dblog`。

- [ ] **Step 5: 提交这一步的内容源迁移**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" add content scripts/generate-content.mts src/generated public
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" commit -m "chore: localize blog content source"
```

Expected: 仓库以后单独 checkout 也能生成博客内容。

## Task 2: 用测试锁定 base-aware 资源 URL 与文章元信息

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\content\generator-core.test.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\content\build-site-content.test.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\types\content.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\content\generator-core.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\content\build-site-content.ts`

- [ ] **Step 1: 在 `generator-core.test.ts` 加一个会失败的 base-path 断言**

Add test:
```ts
it("rewrites localized asset paths with the deployment base path", async () => {
  const result = await rewriteMarkdownAssetPaths("![relative](images/demo.png)", {
    sourceFilePath,
    canonicalSlug: "ajax-day-01",
    publicDir,
    siteBasePath: "/newBlog/",
  });

  expect(result.markdown).toContain("/newBlog/content-assets/ajax-day-01/images/demo.png");
});
```

- [ ] **Step 2: 在 `build-site-content.test.ts` 加 schema 断言**

Add assertions for:
```ts
expect(result.postIndex[0]?.readingMinutes).toBeGreaterThan(0);
expect(result.postsBySlug["ajax-basics-intro"]?.coverImage).toBeNull();
expect(result.friendLinks[0]?.avatar).toMatch(/^\/newBlog\/remote-assets\/[a-f0-9]{40}\.[a-z0-9]+$/);
```

Also extend the fixture markdown with enough body text so `readingMinutes` 不是硬编码 0。

- [ ] **Step 3: 在 `src/types/content.ts` 先声明目标字段，故意让实现侧还跟不上**

Target shape:
```ts
export interface PostSummary {
  // existing...
  readingMinutes: number;
  coverImage?: string | null;
}
```

- [ ] **Step 4: 运行内容测试确认红灯**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" test -- tests/content/generator-core.test.ts tests/content/build-site-content.test.ts
```

Expected: 因 `siteBasePath`、`readingMinutes`、`coverImage` 尚未实现而失败。

## Task 3: 实现内容脚本的 base-aware URL、阅读元信息与图片增强

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\content\generator-core.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\content\build-site-content.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\scripts\generate-content.mts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\types\content.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\content\posts.ts`

- [ ] **Step 1: 给内容脚本增加统一 public path helper**

Implementation shape:
```ts
function toPublicAssetUrl(siteBasePath: string, ...segments: string[]) {
  const normalizedBase = normalizeBase(siteBasePath);
  return `${normalizedBase}${segments.join("/")}`.replace(/(?<!:)\/{2,}/g, "/");
}
```

Requirements:
- `"/"` -> `/remote-assets/...`
- `"/newBlog/"` -> `/newBlog/remote-assets/...`
- 不允许继续手写裸 `/${REMOTE_ASSET_DIR}/...`

- [ ] **Step 2: 让 `rewriteMarkdownAssetPaths()` 接收 `siteBasePath`**

Implementation target:
```ts
export interface RewriteMarkdownAssetOptions {
  sourceFilePath: string;
  canonicalSlug: string;
  publicDir: string;
  siteBasePath?: string;
}
```

Then apply the same base-aware rule to:
- `copyRelativeAsset`
- `copyAbsoluteAsset`
- `localizeRemoteAsset`

- [ ] **Step 3: 在 `build-site-content.ts` 中生成阅读页需要的新元信息**

Implement:
- `readingMinutes`
  - 按正文纯文本字数/单词数估算，最少为 `1`
- `coverImage`
  - 若 frontmatter 指定封面，则做同样的本地化/URL 规范化；没有则为 `null`

Reference shape:
```ts
const entry: GeneratedPostArticle = {
  // existing...
  readingMinutes: estimateReadingMinutes(rewritten.markdown),
  coverImage: await resolveCoverImage(parsed.data.cover, { ... }),
};
```

- [ ] **Step 4: 在 HTML 渲染后给正文图片补懒加载属性**

Prefer build-time enhancement, not runtime DOM patching:
```ts
html = html.replace(/<img /g, '<img loading="lazy" decoding="async" ');
```

Only apply once, avoid duplicate attributes.

- [ ] **Step 5: 跑内容测试与生成命令确认绿灯**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" test -- tests/content/generator-core.test.ts tests/content/build-site-content.test.ts
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run generate:content
```

Expected:
- 内容测试通过
- 新生成的文章 JSON 含 `readingMinutes` / `coverImage`
- 文章图片 URL 带正确 base

- [ ] **Step 6: 提交内容脚本修复**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" add scripts src/types/content.ts src/content/posts.ts tests/content src/generated public
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" commit -m "fix: make blog assets respect base path"
```

## Task 4: 先用测试锁定阅读页的新交互边界

**Files:**
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\article\article-toc.test.ts`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\article\article-content.test.ts`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\views\post-view.test.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\setup.ts`

- [ ] **Step 1: 在 `tests/setup.ts` 中补浏览器 API 测试桩**

Add:
```ts
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
Element.prototype.scrollIntoView = vi.fn();
```

- [ ] **Step 2: 写 `ArticleToc` 的失败测试**

Test target:
```ts
expect(wrapper.find("[data-toc-item='section-a']").attributes("aria-current")).toBe("true");
await wrapper.find("[data-toc-item='section-b']").trigger("click");
expect(wrapper.emitted("jump")).toEqual([["section-b"]]);
```

Behavior:
- 接收外部 `activeId`
- 点击只发事件，不在组件内部私自维护状态

- [ ] **Step 3: 写 `ArticleContent` 的失败测试**

Test target:
- 渲染 hero 标题、摘要、日期、阅读时长
- 渲染正文壳与目录
- 当 `overlay` 为真时显示阅读进度线

Fixture example:
```ts
const article = {
  canonicalSlug: "ajax-basics-intro",
  title: "AJAX 基础入门教程",
  publishedLabel: "Dec 20, 2025",
  excerpt: "这是摘要",
  readingMinutes: 6,
  coverImage: null,
  categories: ["前端开发"],
  tags: ["AJAX基础"],
  html: "<h2 id='core'>核心概念</h2><p>正文</p>",
  toc: [{ id: "core", level: 2, text: "核心概念" }],
};
```

- [ ] **Step 4: 写 `PostView` 的失败测试**

Test target:
- 初始显示 loading
- `loadPostArticle` 返回 `null` 时显示 not-found
- 返回文章时挂载 `ArticleContent`

Use `vi.mock("@/content/posts", ...)` 控制加载分支。

- [ ] **Step 5: 运行阅读页测试确认红灯**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" test -- tests/article/article-toc.test.ts tests/article/article-content.test.ts tests/views/post-view.test.ts
```

Expected: 因 `ArticleToc`、`ArticleContent`、`PostView` 仍是旧结构而失败。

## Task 5: 实现新的阅读页组件边界、滚动联动与视觉系统

**Files:**
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\article\ArticleHero.vue`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\article\ArticleProse.vue`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\composables\useArticleReading.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\article\ArticleContent.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\article\ArticleToc.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\views\PostView.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\assets\main.css`

- [ ] **Step 1: 新建 `ArticleHero.vue` 承载标题区**

Props shape:
```ts
defineProps<{
  title: string;
  excerpt: string;
  publishedLabel: string;
  readingMinutes: number;
  categories: string[];
  tags: string[];
  coverImage?: string | null;
}>();
```

Render:
- eyebrow
- title
- excerpt
- metadata pills
- optional cover image

- [ ] **Step 2: 新建 `ArticleProse.vue` 承载正文壳**

Props:
```ts
defineProps<{
  html: string;
}>();
```

Responsibilities:
- 只负责 `v-html`
- 暴露稳定的 `data-testid`
- 不混入阅读状态逻辑

- [ ] **Step 3: 新建 `useArticleReading.ts`**

Composable responsibilities:
- 维护 `readProgress`
- 维护 `activeHeadingId`
- 通过 `IntersectionObserver` 跟踪 `h2/h3/h4`
- 提供 `jumpToHeading(id)`

Target API:
```ts
const {
  articleRef,
  readProgress,
  activeHeadingId,
  syncHeadings,
  jumpToHeading,
} = useArticleReading();
```

- [ ] **Step 4: 重构 `ArticleToc.vue` 为受控组件**

Props:
```ts
defineProps<{
  items: TocItem[];
  activeId?: string;
}>();
```

Emits:
```ts
defineEmits<{
  jump: [id: string];
}>();
```

Remove:
- 组件内部 `activeId` 状态源

- [ ] **Step 5: 重构 `ArticleContent.vue` 组合新边界**

Implementation notes:
- 组合 `ArticleHero + ArticleProse + ArticleToc`
- 调用 `useArticleReading`
- 将 `activeHeadingId` 传入 `ArticleToc`
- overlay 模式下显示细阅读进度线

- [ ] **Step 6: 精简 `PostView.vue`，只保留页面状态壳**

Implementation notes:
- loading / not-found / article 三态更统一
- 页面标题更新保留
- 不在 view 组件里堆阅读交互细节

- [ ] **Step 7: 在 `main.css` 中重做阅读页视觉系统**

Must cover:
- 深色玻璃舱体容器
- 更强的标题层级
- 更好的段落、列表、blockquote、table、code、image 样式
- 无全局横向滚动
- `prefers-reduced-motion`

Suggested rule blocks:
```css
.article-hero {}
.article-hero__cover {}
.article-prose {}
.article-toc__item[aria-current="true"] {}
@media (prefers-reduced-motion: reduce) {}
```

- [ ] **Step 8: 运行阅读页测试确认绿灯**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" test -- tests/article/article-toc.test.ts tests/article/article-content.test.ts tests/views/post-view.test.ts
```

Expected: 三组新测试通过。

- [ ] **Step 9: 提交阅读页重构**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" add src/components/article src/composables src/views/PostView.vue src/assets/main.css tests/article tests/views tests/setup.ts
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" commit -m "feat: redesign blog reading experience"
```

## Task 6: 对齐 CI/CD，让 push 后自动生成内容并部署

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows\ci.yml`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows\deploy-vps.yml`
- Reference: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\package.json`

- [ ] **Step 1: 先让 CI 走内容生成**

Target change in `ci.yml`:
```yml
- name: Generate content
  run: npm run generate:content

- name: Type check
  run: npm run typecheck

- name: Unit tests
  run: npm run test

- name: Build
  run: npm run build
```

Why:
- 让内容脚本在 CI 中真实执行
- 保证 `.md` 改动不会绕过构建检查

- [ ] **Step 2: 让 VPS 部署工作流也走同样顺序**

Target change in `deploy-vps.yml`:
```yml
- name: Generate content
  run: npm run generate:content
```

Then keep:
- test
- build
- package archive
- upload + activate release

- [ ] **Step 3: 本地按 workflow 顺序跑一遍完整验证**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run generate:content
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run typecheck
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run test
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run build
```

Expected: 与 CI 相同顺序的本地验证全部通过。

- [ ] **Step 4: 预览并人工检查关键阅读场景**

Run:
```bash
npm --prefix "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" run preview
```

Check:
- 文章首屏层级
- `/newBlog/posts/:slug` 下图片正常显示
- 目录高亮随滚动变化
- 移动端无全局横向滚动
- `prefers-reduced-motion` 下无强制动效

- [ ] **Step 5: 提交 workflow 与最终验证结果**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" add .github/workflows
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" commit -m "ci: generate blog content before build"
```

Expected: push 到 `main` 后，CI/CD 会基于仓库内 `.md` 自动生成内容并部署。

## Final Verification Checklist

- [ ] `content/` 已经存在于 `VueCubeBlog` 仓库内，不再依赖外部 `../3Dblog`
- [ ] `npm run generate:content` 在单仓库 checkout 场景下可运行
- [ ] `tests/content/generator-core.test.ts` 与 `tests/content/build-site-content.test.ts` 全部通过
- [ ] `tests/article/article-toc.test.ts`、`tests/article/article-content.test.ts`、`tests/views/post-view.test.ts` 全部通过
- [ ] `npm run typecheck`、`npm run test`、`npm run build` 全部通过
- [ ] 线上 `/newBlog/` 子路径下当前可见文章图片返回 200
- [ ] 新增一篇 `.md` 后无需手改 JSON 即可在构建产物中出现
- [ ] `.github/workflows/ci.yml` 与 `.github/workflows/deploy-vps.yml` 已和新内容流对齐
