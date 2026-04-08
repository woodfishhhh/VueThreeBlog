# VueCubeBlog Blog Reading & MD Pipeline Design

## Goal

在 `VueCubeBlog` 中完成一次围绕博客系统的定向升级：修复部署在 `/newBlog/` 子路径下的文章图片失效问题，把内容维护体验统一为“只维护 `.md`”，并将阅读页重构为更高级、稳定、适合长文阅读的深色宇宙感阅读器。

## Scope

- 内容链路
  - 以 `content/source/myblog/**/*.md` 作为唯一文章内容源
  - 保留构建期自动生成站点消费数据的流程，但对用户完全透明
  - 修复当前图片资源 URL 与子路径部署不兼容的问题
  - 继续支持远程图片、本地相对路径图片、绝对路径图片的本地化与复制
- 阅读体验
  - 重构文章详情页视觉层级与版式
  - 升级文章目录为滚动联动目录
  - 重做正文中的标题、代码块、引用块、图片、表格与元信息样式
  - 保持现有深色、宇宙感、三维博客品牌语言
- 性能与工程质量
  - 优化阅读页滚动监听、图片加载与交互动效
  - 验证本地构建、类型检查/测试与线上 `/newBlog/` 路径可用性

## Out Of Scope

- 不重做首页三维场景与整体世界观
- 不把站点迁移到 SSR、后端渲染或 CMS
- 不清洗站内所有历史外链图片，只处理当前真实会展示到的图与未来新增内容遵循的新规则
- 不改 `weather / pretext / oldBlog` 仓库
- 不改作者页、友链页、首页作品页的主体交互结构

## Approved Decisions

### 1. Content Source Of Truth

- 用户未来只维护 `.md`
- 文章内容源固定为 `content/source/myblog/**/*.md`
- 构建时允许自动生成 `src/generated/post-index.json` 与 `src/generated/posts/*.json`
- 这些中间产物仅作为站点运行时消费格式，不再是用户手动维护对象

### 2. Asset Localization Strategy

- 本次只处理“当前真实会展示到的图”
- 远程图片继续下载并本地化到站点公共资源目录
- 本地相对路径图片继续复制到文章对应资源目录
- 本地绝对路径图片继续复制到统一导入资源目录
- 关键修复点是统一内容资源 URL 生成逻辑，使其对 `/newBlog/` 子路径部署友好

### 3. Reading Page Direction

- 保留现有深色、偏宇宙感的品牌语言
- 阅读页新方向为“高级 editorial 阅读器”，但不是白底杂志，也不是赛博朋克 HUD
- 优先级选“平衡型”：阅读质感与信息导航都要，但不过度偏向任何一端

### 4. Visual Tone

- 文章容器像悬浮在场景中的深色玻璃舱体
- 强调秩序、留白、材质与光影层次，而不是高饱和炫光
- 通过 typography、节奏与导航质量来体现“高级感”

### 5. Animation & Performance

- 保留轻量的淡入、浮层与进度反馈
- 必须尊重 `prefers-reduced-motion`
- 不为了视觉效果牺牲滚动流畅度与正文可读性

## Current Problem Statement

### 1. Root Cause Of Broken Images

当前文章图片实际已经被下载或复制到站点产物目录，但内容生成器返回的是裸根路径，例如：

- `/${REMOTE_ASSET_DIR}/...`
- `/${CONTENT_ASSET_DIR}/...`
- `/${IMPORTED_ASSET_DIR}/...`

而站点实际部署在 `/newBlog/`，导致文章 HTML 中引用的图片 URL 指向站点根目录而不是站点 base 路径下的真实资源位置，因此线上显示为 404。

### 2. Current Content Flow

- `scripts/content/build-site-content.ts` 从 `content/source/myblog/**/*.md` 收集文章
- 使用 `gray-matter` 解析 frontmatter
- 经过 markdown 清洗、资源路径改写与 HTML 渲染后，输出到 `src/generated/*.json`
- `src/content/posts.ts` 再用 `post-index.json + import.meta.glob("../generated/posts/*.json")` 供前端消费

这套流程本身是可用的，真正的问题不是“有 JSON”，而是：

- 用户体验上不应该要求手动碰 JSON
- 资源 URL 生成没有尊重站点 base

## File Plan

### Content Pipeline

- Modify: `scripts/content/generator-core.ts`
  - 统一远程、本地相对、绝对路径资源的 public URL 生成方式
  - 引入 base-aware 资源 URL helper，避免继续返回裸 `/...`
- Modify: `scripts/content/build-site-content.ts`
  - 维持 `.md -> generated JSON` 的透明构建流程
  - 确保生成 HTML 的资源引用与新的 base-aware 资源规则一致
- Optionally modify: `scripts/content/*`
  - 若现有职责过于分散，可新增小型 helper 文件承载内容资源 URL 规则，但避免大规模重写

### Reading Experience

- Modify: `src/views/PostView.vue`
  - 保持路由与状态壳职责，升级 loading / not-found / article 三态表现
- Modify: `src/components/article/ArticleContent.vue`
  - 作为阅读页主编排层，承载 hero / meta / prose / toc 布局
- Modify: `src/components/article/ArticleToc.vue`
  - 从“点击高亮”升级为“滚动联动高亮”
- Modify: `src/assets/main.css`
  - 重构阅读页核心样式变量与文章组件样式
- Optionally create: `src/components/article/ArticleHero.vue`
  - 抽离文章头部信息区
- Optionally create: `src/components/article/ArticleProse.vue`
  - 抽离正文渲染壳，统一正文语义类与装饰样式
- Optionally create: `src/composables/useArticleReading.ts`
  - 集中管理阅读进度、active heading、平滑锚点跳转与滚动观察逻辑

### Runtime Content Access

- Modify: `src/content/posts.ts`
  - 保持现有按需加载模型，但确保内容消费层与新的 `.md`-first / generated-data 流程语义清晰
- Optionally modify: `src/types/content.ts`
  - 若需要，为阅读页增强元信息字段、封面字段或阅读体验相关字段

## Design

### 1. MD-First Content Pipeline

- `content/source/myblog/**/*.md` 是唯一内容源
- 用户新增文章时，只需要放入 markdown 与所需图片资源
- 构建期自动完成：
  - frontmatter 解析
  - slug 解析与兼容
  - 图片 URL 改写与本地化
  - 目录提取
  - HTML 渲染
  - 摘要、标签、分类等索引生成
- 运行时仍然使用 `generated JSON`，因为它已经适合当前 Vite 站点按需加载，不需要在本轮做激进替换

### 2. Base-Aware Asset URL Rule

- 所有内容资源 URL 统一由一个 helper 生成
- 该 helper 不直接返回裸 `/remote-assets/...`
- 该 helper 必须输出“站点 base + 资源路径”的兼容结果，使本地开发与 `/newBlog/` 线上部署共用一套规则
- 远程图片、本地相对路径图片、绝对路径图片都必须走同一套 URL 组装心智模型
- 目标不是为当前线上站点写死 `/newBlog/`，而是让规则随构建 base 一起变化

### 3. Reading Page Architecture

- `PostView.vue` 作为 route-level 壳组件，负责：
  - 读取 slug
  - 调用文章加载逻辑
  - 管理页面标题
  - 显示 loading / not-found / article 三种视图
- 阅读页主视图拆成四层：
  - 返回与路径导航层
  - 文章头部信息层
  - 正文阅读层
  - 目录导航层
- 若 `ArticleContent.vue` 继续膨胀，则拆出 `ArticleHero / ArticleProse / useArticleReading`

### 4. Reading Page Visual System

- 底色继续使用深黑蓝体系，避免白底化
- 文章容器以“深色玻璃舱体”呈现：
  - 低饱和玻璃感
  - 克制边框
  - 精细阴影
  - 降低大面积高成本 blur 的滥用
- 标题区强化层次：
  - 更强的标题排版
  - 更精致的摘要
  - 日期、分类、标签、阅读时长等以低噪音方式集中展示
- 正文采用更明确的 editorial 节奏：
  - 更合理的行宽与行高
  - 更清楚的 `h2 / h3 / h4` 层级
  - 更精细的段落留白与列表节奏
- 元素重做方向：
  - 代码块：像控制台面板，但以可读性优先
  - 引用块：有更明显但克制的语义识别
  - 图片：更稳定的居中、边框、背景承托与不炸布局策略
  - 表格：深色背景下可读、可横向处理但避免全局横向滚动
- 若 frontmatter 提供封面图，则允许头部使用高级头图；否则走纯 typography 头部

### 5. Navigation & Reading Feedback

- 目录从“点击时高亮”升级为“滚动联动高亮当前章节”
- 顶部阅读进度保留，但表现为更细、更克制的仪表线
- 锚点跳转保持平滑滚动，并处理标题吸顶偏移
- 移动端目录不强制常驻右侧，可折叠或在内容上方轻量呈现

## Behavior Spec

### Content Authoring Path

- WHEN 用户向 `content/source/myblog/**/*.md` 放入一篇新文章
- THEN 构建流程自动扫描该 markdown
- AND 自动生成站点所需的文章数据与索引
- AND 用户不需要手动维护任何 JSON

### Asset Localization Path

- WHEN 文章正文中包含远程图片、本地相对路径图片或绝对路径图片
- THEN 构建流程应把图片同步到站点可访问目录
- AND 生成的文章 HTML 应引用与站点 base 兼容的资源 URL
- AND 线上 `/newBlog/` 路径下访问文章时图片应正常显示

### Reading Flow

- WHEN 用户进入文章详情页
- THEN 页面展示与站点品牌一致的深色阅读器
- AND 第一屏清晰呈现标题、摘要与核心元信息
- AND 目录可以反映当前阅读位置
- AND 正文中的图片、代码块、引用块、表格都具有一致的视觉语言

### Responsive Flow

- WHEN 用户在移动端阅读文章
- THEN 页面不应出现全局横向滚动
- AND 目录、代码块与表格应保持可读
- AND 图片不应撑破布局

### Reduced Motion Flow

- WHEN 用户系统启用了 `prefers-reduced-motion`
- THEN 阅读页保留必要反馈
- AND 不强制滚动特效、过重动效或会造成不适的动态表现

## Risks

- `scripts/content/generator-core.ts` 已承担多种资源处理职责，若直接在原函数里继续叠条件，容易增加维护成本
- `ArticleContent.vue` 当前已同时承担布局与部分阅读状态逻辑，继续扩展前应优先守住边界
- 阅读页若过度追求 blur、阴影或高光，容易损伤深色主题下的对比度与性能
- 目录滚动联动若仍使用高频 `scroll` 监听而不做收敛，可能导致阅读页滚动体验下降

## Verification Plan

### Content Pipeline

- 运行内容构建流程，确认 markdown 能自动生成文章数据
- 至少选择：
  - 一篇包含远程图片的文章
  - 一篇包含本地相对路径图片的文章
- 检查生成 HTML 中的资源 URL 是否遵循新的 base-aware 规则

### Frontend

- 运行 `npm run build`
- 运行仓库现有类型检查、测试或等价命令
- 本地打开文章页，检查：
  - loading / not-found / 正常文章
  - 目录滚动联动
  - 阅读进度
  - 图片、代码块、引用块、表格、移动端适配

### Deployment

- 确认线上 `/newBlog/` 路径下文章图片请求返回成功
- 新增一篇 `.md` 后，确认 CI/CD 可以把新内容自动带到线上

## Acceptance Criteria

- 用户未来只需维护 `.md`，不需要手动维护 JSON
- 当前真实展示到的文章图片在线上 `/newBlog/` 下全部可正常访问
- 内容资源 URL 规则不再依赖裸根路径
- 阅读页保留深色宇宙感品牌，但视觉层级、版式与阅读质感明显升级
- 目录可随滚动联动高亮
- 移动端阅读不出现明显横向炸裂或卡片/代码块不可读问题
- 阅读页新增的动效遵守 `prefers-reduced-motion`
- 本地构建与线上部署验证通过
