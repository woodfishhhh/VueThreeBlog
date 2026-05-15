# VueCubeBlog Migration Plan

## Goal

- 将 `../3Dblog` 无缝迁移为 Vue 3 静态站点，输出到当前 `VueCubeBlog`。
- 保留沉浸式首页、阅读浮层、独立文章页、全部文章内容与旧 slug 兼容能力。
- 运行方式保持静态托管友好，不依赖 Node 运行时读取本地文件。

## Scope

- 技术栈固定为 `Vite + Vue 3 + TypeScript + Vue Router + Pinia + Three.js`。
- 内容源固定为 `../3Dblog/content/source/myblog/**/*.md`。
- 构建期生成：
  - `src/generated/post-index.json`
  - `src/generated/posts/<slug>.json`
  - `src/generated/author.json`
  - `src/generated/friends.json`
- 运行时提供：
  - `/` 首页三维场景与面板交互
  - `/posts/:slug` 独立文章路由
  - 旧英文 slug 与中文别名 slug 解析

## Out Of Scope

- 不迁回 Next.js 能力，不保留 SSR。
- 不引入服务端数据库、CMS 或 API。
- 不重做原站视觉语言，只做必要的静态化适配与性能收口。
- 不批量修复历史 Markdown 中所有外链图片源。

## Acceptance

1. 首页可进入博客、作者、友链与阅读浮层。
2. 全量文章都能从生成产物中访问，并存在独立文章页。
3. `/posts/:canonicalSlug` 与 `/posts/:aliasSlug` 都能正确打开文章。
4. `npm run typecheck`、`npm test`、`npm run build` 通过。
5. 浏览器烟测确认关键交互可用。

## Delivery Status

- [x] 初始化 Vite Vue 3 项目与依赖
- [x] 搭建路由、Pinia、全局样式与页面骨架
- [x] 实现构建期内容生成脚本与 JSON 产物
- [x] 为 slug 解析、内容生成补充单测
- [x] 实现首页面板、阅读浮层、独立文章页
- [x] 实现 Three.js 场景与聚焦模式交互
- [x] 生成 101 篇文章的静态内容
- [x] 补充浏览器烟测证据
- [x] 对 Vite 构建做依赖拆包，降低单一大 chunk 风险

## Verified Evidence

- `npm run generate:content`：成功生成文章索引、文章 JSON、作者与友链数据。
- `npm run typecheck`：通过。
- `npm test`：3 个测试文件，8 个测试通过。
- `npm run build`：通过。
- 浏览器烟测已确认：
  - 首页加载成功
  - 首页文章列表可打开阅读浮层
  - `/posts/ajax-basics-intro` 可直达
  - `/posts/AJAX%20基础入门教程` 可通过别名解析到 canonical slug
  - 作者面板、友链面板、Three 聚焦模式可进入与退出

## Remaining Risks

- 历史内容中仍存在大量 `https://www.woodfishhhh.xyz/images/...` 外链图片。
- 这些外链在当前浏览器环境下会触发 `net::ERR_CERT_AUTHORITY_INVALID`，主要影响友链头像与部分文章插图。
- 该问题来自源内容依赖的远程图片证书，不影响主交互与核心静态路由，但会影响部分图片展示完整性。

## Next Options

1. [x] 成功复刻 Next.js 中的 3D星空与超立方体特效。
2. [ ] **正在进行**：重构文章阅读页面 (Typography & Glassmorphism)，提升设计高级感与实用性。
3. 如需彻底去掉外链图片风险，可以做“远程图片本地化迁移”专项。
4. 如需进一步压缩首屏体积，可以继续做首页 Three 场景异步加载。

---

## Typography & Glassmorphism Refactor Plan (Current Phase)

### 目标 (Goal)

将原版粗糙的文章阅读页面重构为具备现代高级感、极佳阅读体验并在毛玻璃面板中优雅展示的界面。完全复刻并采用 Next.js 原项目中的 Google `Inter` 字体。

### 阶段 1：全局排版与字体基础配置 (Typography & Fonts Setup)

- [ ] **引入 Inter 字体**：在 `index.html` 头部加入 Google Fonts `Inter` 预加载与引用代码。
- [ ] **Tailwind 字体配置**：在 `tailwind.config.ts` (或 css 文件中) 将 `Inter` 变更为 `sans` 字体族的首选字体。
- [ ] **排版插件支持**：安装并配置 `@tailwindcss/typography` 插件，启用现代博客常用的 `prose` 渲染模式，这能自动化优化 Markdown 原生标签（如 `h1`-`h6`, `p`, `blockquote`, `ul`, `ol` 等）的行高、外边距、颜色和响应式缩放。

### 阶段 2：页面布局与毛玻璃基建 (Layout & Glassmorphism)

- [ ] **重构 `PostView.vue`**：
  - 取消原有的死板背景，使用透明或极暗色的遮罩。
  - 创建一个居中的宽体容器（如 `max-w-3xl` 或 `max-w-4xl`），配合适当的内边距 (`px-6 md:px-12`)。
  - 为该容器添加现代高级毛玻璃效果：`bg-white/5` 或 `bg-[#050510]/60`, `backdrop-blur-xl`, `border border-white/10`, `shadow-2xl`，辅以圆角 (`rounded-2xl` 或 `rounded-3xl`)。
- [ ] **导航与返回按钮优化**：
  - 将 `Back Home` 按钮设计为干净的悬浮态或拥有呼吸效果的纯净文字/图标组合，左上角固定或跟随顶部。
  - 增加页面平滑的 Fade-in / Slide-up 进入动画 (可通过 CSS 或 Vue `<transition>` 完成)。

### 阶段 3：文章内容区精细化打磨 (Article Content Refinement)

- [ ] **重构 `ArticleContent.vue`**：
  - **头部元数据**：标题（Title）应用大字号与较重的字重（如 `font-bold text-3xl md:text-5xl tracking-tight`）；日期和标签用柔和的次要颜色 (`text-gray-400` / `text-gray-500`) 单独排布。
  - **正文内容区域 (Markdown Render)**：应用 `prose prose-invert prose-lg` 甚至自定制的 Tailwnind Typography CSS 变量，使得原生的深色模式表现更加细腻。
  - **细节重设**：
    - **代码块**：确保 `highlight.js` 样式的背景不显得突兀，可尝试覆盖为更深邃的极暗底色并带上微妙的内阴影与圆角。
    - **引用 (`blockquote`)**：调整左侧边框颜色（比如亮蓝色或灰白色主调）及背景。
    - **链接 (`a`)**：提供优雅的 hover 下划线动画或颜色过渡。
    - **图片 (`img`)**：居中、大圆角，并带柔和阴影。

### 阶段 4：功能与响应式适配校验 (Responsive & Functionality Check)

- [ ] **移动端体验**：校验移动设备上的容器内边距、字号表现，确保毛玻璃层在窄屏依然清晰易读，不会被背景星空干扰过度。
- [ ] **滚动体验**：隐藏原生丑陋滚动条，使用自定义细长滚动条 (Tailwind 自定义 Scrollbar 设置)。
- [ ] **构建并本地测试**：`npm run typecheck` 等等...

