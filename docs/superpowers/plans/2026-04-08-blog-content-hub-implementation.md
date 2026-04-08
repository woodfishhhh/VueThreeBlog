# Blog Content Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `VueCubeBlog` 的 `Blog` 面板升级成内容中枢，补齐 `type / category / tag` 搜索筛选、阅读页右侧 `TOC` 稳定导航，以及 `Friend Links` 的 GitHub issue 申请链路。

**Architecture:** 保持现有首页 3D 场景 + overlay 架构，不新增顶层 nav 项。内容生成层先补齐 `type` 默认值与混合搜索所需的索引字段，前端再把 `Blog` overlay 拆成搜索带、筛选轨道、结果流三段结构，并通过 route query 保留筛选上下文；阅读页与友链页分别补稳定 TOC 轨道和“跳转前提醒 + GitHub issue 预填页”表单链路。

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Vite, Vitest, unified/remark/rehype, GitHub Pages-style `/newBlog/` base path

---

## File Structure

- `src/types/content.ts`
  - 为文章摘要与正文类型补充 `type`、`searchText` 等内容中枢需要的字段
- `scripts/content/build-site-content.ts`
  - 从 markdown frontmatter 生成 `type`，并为混合搜索生成可消费的文本索引字段
- `scripts/content/generator-core.ts`
  - 保持内容生成时的 markdown 规范化与可搜索文本抽取辅助
- `tests/content/build-site-content.test.ts`
  - 锁定 `type` 回填、搜索文本生成与索引输出
- `src/content/posts.ts`
  - 提供文章摘要加载、canonical slug 与内容中枢消费入口
- `src/content/blog-hub.ts`
  - 新增；承载纯函数搜索、筛选、分面聚合与排序逻辑
- `tests/content/blog-hub.test.ts`
  - 新增；锁定混合搜索、筛选组合与排序
- `src/composables/useBlogQueryState.ts`
  - 新增；把 `Blog` 搜索词与筛选条件同步到 `/blog` 路由 query
- `src/components/home/PostPanel.vue`
  - 从简单文章列表升级为内容中枢壳
- `src/components/home/blog/BlogSearchBar.vue`
  - 新增；搜索框、结果概览、清空入口
- `src/components/home/blog/BlogFilterRail.vue`
  - 新增；`type / category / tag / sort` 控件
- `src/components/home/blog/BlogResults.vue`
  - 新增；结果流、空状态、统计提示
- `src/components/home/blog/BlogResultCard.vue`
  - 新增；单篇文章卡片，带 `type / category / tag / reading time`
- `src/views/HomeView.vue`
  - 承载新的 Blog overlay 组合方式
- `tests/home/post-panel.test.ts`
  - 新增；锁定 Blog 内容中枢结构、query 同步和筛选行为
- `src/views/PostView.vue`
  - 保留文章页壳，但补“返回 Blog 上下文”的 back link 逻辑
- `tests/views/post-view.test.ts`
  - 扩展；锁定从 Blog 上下文进入文章后返回链接的目标
- `src/components/article/ArticleContent.vue`
  - 调整 TOC rail 容器与可滚动轨道结构
- `src/components/article/ArticleToc.vue`
  - 增加 sticky 卡片头部和独立滚动区语义
- `src/assets/main.css`
  - 为 Blog 内容中枢、TOC rail、Friend 表单补样式变量和布局
- `tests/article/article-toc.test.ts`
  - 扩展；验证目录标题区和滚动区结构
- `tests/article/article-content.test.ts`
  - 扩展；验证 TOC rail 存在且不与正文耦合
- `src/components/home/FriendPanel.vue`
  - 集成申请友链卡片
- `src/components/home/friend/FriendLinkApplicationForm.vue`
  - 新增；字段输入、校验、提醒弹层、确认跳转
- `src/utils/friend-link-issue.ts`
  - 新增；构造 GitHub new issue URL
- `tests/home/friend-panel.test.ts`
  - 新增；验证字段、提醒文案与跳转 URL 生成

## Task 1: 扩展内容模型，补齐 `type` 与混合搜索索引

**Files:**
- Modify: `src/types/content.ts`
- Modify: `scripts/content/build-site-content.ts`
- Modify: `scripts/content/generator-core.ts`
- Modify: `tests/content/build-site-content.test.ts`

- [ ] **Step 1: 先在内容构建测试里补 `type` 与搜索索引断言**

Add assertions for:
```ts
expect(result.postIndex[0]?.type).toBe("Tutorial");
expect(result.postIndex[1]?.type).toBe("Notes");
expect(result.postIndex[0]?.searchText).toContain("AJAX");
```

- [ ] **Step 2: 运行目标测试确认红灯**

Run:
```bash
npm test -- tests/content/build-site-content.test.ts
```

Expected: `type` 或 `searchText` 相关断言失败。

- [ ] **Step 3: 在类型与生成层补最小实现**

Implementation target:
```ts
export interface PostSummary {
  // existing...
  type: string;
  searchText: string;
}
```

And in `build-site-content.ts`:
- 优先读取 frontmatter 中的 `type`
- 缺失时默认回填 `Notes`
- 从 markdown 正文抽取纯文本作为 `searchText`

- [ ] **Step 4: 回跑测试确认绿灯**

Run:
```bash
npm test -- tests/content/build-site-content.test.ts
```

Expected: 目标测试通过。

- [ ] **Step 5: 提交内容模型改动**

Run:
```bash
git add src/types/content.ts scripts/content/build-site-content.ts scripts/content/generator-core.ts tests/content/build-site-content.test.ts
git commit -m "feat: add blog taxonomy metadata"
```

## Task 2: 把搜索、筛选、排序逻辑下沉成纯函数

**Files:**
- Create: `src/content/blog-hub.ts`
- Create: `tests/content/blog-hub.test.ts`
- Modify: `src/content/posts.ts`

- [ ] **Step 1: 先写纯函数测试锁定行为**

Cover:
- 混合搜索短查询只匹配 `title / excerpt / type / categories / tags`
- 长查询可命中 `searchText`
- `type + category + tag` 组合筛选
- 排序（最新优先、阅读时长优先）

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm test -- tests/content/blog-hub.test.ts
```

Expected: 因 `blog-hub.ts` 不存在或导出缺失而失败。

- [ ] **Step 3: 实现最小搜索与分面聚合层**

Implementation target in `src/content/blog-hub.ts`:
```ts
export function filterBlogPosts(posts, filters) {}
export function buildBlogFacets(posts) {}
export function sortBlogPosts(posts, sortKey) {}
```

And in `src/content/posts.ts`:
- 保持懒加载
- 暴露内容中枢需要的摘要数据入口

- [ ] **Step 4: 回跑测试确认通过**

Run:
```bash
npm test -- tests/content/blog-hub.test.ts
```

Expected: 搜索、筛选、排序逻辑全部通过。

- [ ] **Step 5: 提交纯逻辑层**

Run:
```bash
git add src/content/blog-hub.ts src/content/posts.ts tests/content/blog-hub.test.ts
git commit -m "feat: add blog hub filtering logic"
```

## Task 3: 重构 Blog overlay 为内容中枢，并把筛选状态写进 query

**Files:**
- Create: `src/composables/useBlogQueryState.ts`
- Create: `src/components/home/blog/BlogSearchBar.vue`
- Create: `src/components/home/blog/BlogFilterRail.vue`
- Create: `src/components/home/blog/BlogResults.vue`
- Create: `src/components/home/blog/BlogResultCard.vue`
- Modify: `src/components/home/PostPanel.vue`
- Modify: `src/views/HomeView.vue`
- Create: `tests/home/post-panel.test.ts`

- [ ] **Step 1: 先写 Blog 内容中枢测试**

Cover:
- 渲染搜索框与结果概览
- 渲染 `type / category / tag / sort`
- 输入搜索词后列表收缩
- 选择筛选后 route query 更新
- 点击清空后 query 与结果恢复默认

- [ ] **Step 2: 运行测试确认红灯**

Run:
```bash
npm test -- tests/home/post-panel.test.ts
```

Expected: 因新组件/新 query 行为不存在而失败。

- [ ] **Step 3: 先实现 query 状态同步**

In `useBlogQueryState.ts`:
- 约定 query keys：`q`, `type`, `category`, `tag`, `sort`
- 负责从 route 读默认值
- 负责把 UI 状态同步回 `/blog` query

- [ ] **Step 4: 再拆 Blog UI 组件**

Do:
- `PostPanel.vue` 只做组合与状态编排
- `BlogSearchBar.vue` 管搜索框和结果概览
- `BlogFilterRail.vue` 管筛选器
- `BlogResults.vue` 管列表和空状态
- `BlogResultCard.vue` 管单篇卡片

- [ ] **Step 5: 回跑 Blog 测试**

Run:
```bash
npm test -- tests/home/post-panel.test.ts
```

Expected: Blog 内容中枢行为通过。

- [ ] **Step 6: 提交 Blog 内容中枢**

Run:
```bash
git add src/composables/useBlogQueryState.ts src/components/home/PostPanel.vue src/components/home/blog src/views/HomeView.vue tests/home/post-panel.test.ts
git commit -m "feat: redesign blog overlay as content hub"
```

## Task 4: 保留从 Blog 到阅读页再返回的上下文

**Files:**
- Modify: `src/components/home/blog/BlogResultCard.vue`
- Modify: `src/views/PostView.vue`
- Modify: `tests/views/post-view.test.ts`

- [ ] **Step 1: 扩展文章页测试锁定返回目标**

Add assertions for:
- 当文章来自 `/blog?q=ajax&type=Tutorial`
- back link 应指向 `/blog` 并带上原 query

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm test -- tests/views/post-view.test.ts
```

Expected: back link 仍指向默认首页或不保留 query。

- [ ] **Step 3: 实现最小上下文恢复**

Implementation target:
- 文章卡片链接把 Blog query 带到文章页
- `PostView.vue` 识别来自 Blog 的 query
- back link 优先返回带原筛选的 `/blog`

- [ ] **Step 4: 回跑测试确认通过**

Run:
```bash
npm test -- tests/views/post-view.test.ts
```

Expected: 文章页返回 Blog 时保留搜索与筛选上下文。

- [ ] **Step 5: 提交阅读返回链路**

Run:
```bash
git add src/components/home/blog/BlogResultCard.vue src/views/PostView.vue tests/views/post-view.test.ts
git commit -m "feat: preserve blog filters across reading"
```

## Task 5: 强化阅读页右侧 TOC，保证 sticky 与独立滚动

**Files:**
- Modify: `src/components/article/ArticleContent.vue`
- Modify: `src/components/article/ArticleToc.vue`
- Modify: `src/assets/main.css`
- Modify: `tests/article/article-toc.test.ts`
- Modify: `tests/article/article-content.test.ts`

- [ ] **Step 1: 先补结构测试而不是直接写样式**

Add assertions for:
- TOC 存在标题区域
- TOC 存在独立滚动容器，例如 `data-testid="article-toc-scroll"`
- 内容壳保留单独 rail 容器

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm test -- tests/article/article-toc.test.ts tests/article/article-content.test.ts
```

Expected: 因缺少滚动容器或结构钩子而失败。

- [ ] **Step 3: 调整组件结构与样式**

Do:
- `ArticleToc.vue` 拆出头部和可滚动 items 区
- `ArticleContent.vue` 保持右侧 rail 边界清晰
- `main.css` 为 rail 卡片增加 `sticky + max-height + overflow-y: auto`

- [ ] **Step 4: 回跑测试确认绿灯**

Run:
```bash
npm test -- tests/article/article-toc.test.ts tests/article/article-content.test.ts
```

Expected: TOC 结构测试全部通过。

- [ ] **Step 5: 提交 TOC 轨道强化**

Run:
```bash
git add src/components/article/ArticleContent.vue src/components/article/ArticleToc.vue src/assets/main.css tests/article/article-toc.test.ts tests/article/article-content.test.ts
git commit -m "feat: stabilize article toc rail"
```

## Task 6: 为 Friend Links 增加申请表单与 GitHub issue 跳转提醒

**Files:**
- Create: `src/components/home/friend/FriendLinkApplicationForm.vue`
- Create: `src/utils/friend-link-issue.ts`
- Modify: `src/components/home/FriendPanel.vue`
- Create: `tests/home/friend-panel.test.ts`

- [ ] **Step 1: 先写申请链路测试**

Cover:
- 表单字段完整：`Site Name / Site URL / Avatar URL / Short Description / Your Name / Contact`
- 点击提交先出现提醒文案：`即将跳到 GitHub issue 页面提交`
- 用户确认后生成正确的 GitHub issue URL

- [ ] **Step 2: 运行测试确认红灯**

Run:
```bash
npm test -- tests/home/friend-panel.test.ts
```

Expected: 因表单/提醒/URL helper 尚不存在而失败。

- [ ] **Step 3: 实现 issue URL helper 与表单卡片**

Do:
- `friend-link-issue.ts` 负责生成 issue 标题与 body
- `FriendLinkApplicationForm.vue` 管字段、校验、提醒弹层
- `FriendPanel.vue` 把表单卡片挂到友链展示区下方

- [ ] **Step 4: 回跑测试确认通过**

Run:
```bash
npm test -- tests/home/friend-panel.test.ts
```

Expected: 字段、提醒、跳转 URL 行为全部通过。

- [ ] **Step 5: 提交 Friend Links 申请链路**

Run:
```bash
git add src/components/home/FriendPanel.vue src/components/home/friend/FriendLinkApplicationForm.vue src/utils/friend-link-issue.ts tests/home/friend-panel.test.ts
git commit -m "feat: add friend link application flow"
```

## Task 7: 全量验证、视觉复查与最终提交

**Files:**
- Verify: `src/generated/**/*`
- Verify: `public/remote-assets/**/*`
- Verify: `.github/workflows/ci.yml`
- Verify: `.github/workflows/deploy-vps.yml`

- [ ] **Step 1: 重跑内容生成**

Run:
```bash
$env:VITE_BASE_PATH='/newBlog/'; npm run generate:content
```

Expected: 成功生成内容，不引入新的显示用远程图片字段。

- [ ] **Step 2: 跑类型检查、单测、构建**

Run:
```bash
npm run typecheck
npm run test
$env:VITE_BASE_PATH='/newBlog/'; npm run build
```

Expected: 全部通过。

- [ ] **Step 3: 浏览器人工检查**

Check:
- `/newBlog/blog` 中搜索、`type / category / tag`、清空筛选可用
- 从带筛选的 Blog 进入文章再返回时，上下文保留
- 文章页右侧 TOC sticky，长目录可独立滚动
- `Friend Links` 表单点击提交前先提醒“即将跳到 GitHub issue 页面提交”

- [ ] **Step 4: 提交最终实现**

Run:
```bash
git add src scripts tests docs/superpowers/specs docs/superpowers/plans
git commit -m "feat: build blog content hub and friend link workflow"
```

## Final Verification Checklist

- [ ] 文章摘要与正文数据拥有稳定的 `type` 字段，历史文章缺失时默认回填 `Notes`
- [ ] Blog 内容中枢支持混合搜索
- [ ] Blog 内容中枢支持 `type / category / tag / sort / clear`
- [ ] `/blog` 的 query 能表达并恢复当前筛选状态
- [ ] 从 Blog 进入文章页再返回时，筛选上下文不丢失
- [ ] 阅读页右侧 `TOC` 保持稳定，过长时支持独立滚动
- [ ] `Friend Links` 页面新增申请友链卡片
- [ ] 点击提交前会明确提醒：`即将跳到 GitHub issue 页面提交`
- [ ] 确认后跳转到预填好的 GitHub issue 创建页
- [ ] `npm run generate:content`、`npm run typecheck`、`npm run test`、`npm run build` 全部通过
