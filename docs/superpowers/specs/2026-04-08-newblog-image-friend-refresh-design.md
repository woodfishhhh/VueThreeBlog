# VueCubeBlog NewBlog Image Optimization & Friend Refresh Design

## Goal

在 `VueCubeBlog` 中同时完成两项升级：

1. 修复 `/newBlog/` 线上图片访问慢、部分文章图片直接报错的问题
2. 将 `Friend` 页面重构为真正的全页友链网络视图，保留申请友链链路，但把表单下沉到底部

## Scope

- 图片治理
  - 盘点并压缩云服务器当前已上线的 `newBlog` 图片资源
  - 为仓库构建链路新增自动图片优化步骤
  - 处理历史文章中不可用的本地磁盘路径图片引用
  - 保持 `/newBlog/` 下既有资源 URL 尽量稳定
- Friend 页面
  - 把 `friend` 模式从半高底部面板升级为全屏覆盖层
  - 保留 3D 场景背景，但增加淡黑透明遮罩来衬托卡片
  - 让友链卡片网格成为首屏主视觉
  - 保留申请友链表单，但作为底部 section 呈现
- 部署与验证
  - 确保 CI/CD 在 `generate:content` 后自动完成图片优化
  - 验证线上关键图片返回成功且体积下降

## Out Of Scope

- 不恢复 `oldBlog` 部署
- 不把 4 个项目的运维链路整体重做一遍
- 不引入 CDN、图床服务或在线图片裁剪服务
- 不做全站 `picture/srcset` 响应式图片系统
- 不改 `works / author / blog` 的整体视觉语言

## Current State

### 1. Image Pipeline

- 当前工作流只执行：`generate:content -> test -> build -> package -> upload`
- `public/remote-assets`、`public/imported-assets`、`public/content-assets` 没有统一图片优化步骤
- 云服务器 `/opt/blog-stack/sites/newBlog/remote-assets` 中存在大量 `300KB~1.1MB` 的图片
- 当前至少有部分文章正文残留本地磁盘路径图片引用，例如 `C:\...`、`D:\...`
- 这类图片在部署到线上后无法访问，会表现为裂图或加载失败

### 2. Friend Mode

- 当前 `friend` 仍由 `HomeView.vue` 中的底部半屏覆盖容器承载
- `FriendPanel.vue` 目前是“友链卡片网格 + 申请表单”的单列组合
- 首屏视觉重心仍像底部抽屉，而不是独立完整页面

## Approved Decisions

### 1. Image Governance Strategy

- 采用“服务器止血 + 构建链路治理”的双层方案
- 不只修当前线上图片，也要保证后续每次部署自动优化

### 2. Broken Image Policy

- 对仓库中拿不到原图的历史本地磁盘路径图片，采用宽松模式
- 构建时自动移除/跳过这类坏图，并输出 warning
- 目标是避免线上继续出现裂图，而不是让构建直接失败

### 3. Friend Page Direction

- `Friend Links` 升级为全页模式
- 申请友链表单继续保留，但下沉到页面底部 section

### 4. Visual Direction

- 保留现有宇宙感/深色场景背景
- 在 `friend` 全页模式中增加淡黑透明遮罩，让前景卡片更清晰

## Design

### 1. Online Image Stopgap

先直接治理云服务器当前已上线的 `newBlog` 图片资源：

- 目标目录：
  - `/opt/blog-stack/sites/newBlog/remote-assets`
  - `/opt/blog-stack/sites/newBlog/imported-assets`
  - `/opt/blog-stack/sites/newBlog/content-assets`（若存在）
- 处理原则：
  - 优先保留原文件名与 URL，不打断现有页面引用
  - 对 `jpg/jpeg/png/webp` 做轻有损或无损压缩
  - `svg` 保持原样
  - `gif` 只在工具安全可用时处理，否则跳过
- 验收重点：
  - 文件仍可正常访问
  - 抽样 URL 返回 `200`
  - 整体体积下降

### 2. Build-Time Image Optimization

新增统一图片优化脚本，并插入 `generate:content` 之后：

- 扫描目录：
  - `public/remote-assets`
  - `public/imported-assets`
  - `public/content-assets`
- 优化规则：
  - 对较大的 `png/jpg/jpeg/webp` 压缩覆盖原文件
  - 极小文件可跳过，避免收益过低
  - `svg` 不压缩
- 输出摘要：
  - 扫描文件数
  - 优化成功数
  - 跳过数
  - 失败数
  - 总节省体积

默认不在本轮强推 `webp + picture` 全量改写；更激进的格式切换仅在不放大改动面的局部场景使用。

### 3. Broken Local Image References

对于文章 markdown/html 中这类不可部署引用：

- `C:\...`
- `D:\...`
- URL 编码后的 Windows 盘符路径
- 无法解析到仓库内文件的本地图片路径

构建行为调整为：

- 不让这些引用继续进入最终 HTML
- 自动移除对应 `img` 标签或 markdown 图片表达式
- 在生成日志中输出 warning，标记文章 slug 与原始图片路径

策略目标：

- 线上不再出现本地磁盘路径裂图
- 历史问题可追溯，但不阻断部署

### 4. Friend Full-Page Layout

`friend` 模式由半高面板升级为全屏覆盖层，结构改为三段：

1. 顶部 Hero
   - 标题 `Friend Links`
   - 一句网络说明文案
   - 轻量统计信息（数量/状态）
2. 中部友链主网格
   - 友链卡片成为首屏主体
   - 桌面端 3~4 列，移动端单列
   - 滚动交给整页，而非内部小容器
3. 底部申请区
   - 保留现有 GitHub issue 申请链路
   - 表单作为页面底部 section 出现，不抢首屏

### 5. Friend Visual Treatment

- 保留底部 3D 场景作为背景层
- `friend` 全页前景增加一层淡黑透明遮罩
- 遮罩叠加轻微径向渐变，强化中心阅读区
- 卡片方向为“星球档案卡”而不是轻列表项：
  - 头像
  - 名称
  - 简介
  - 外链提示
- 卡片 hover 保持克制，只做提亮和边框增强

### 6. Mobile Behavior

移动端要求：

- 单列卡片流
- 无全局横向滚动
- 顶部标题区和底部申请区按自然顺序堆叠
- 表单字段保持可读的纵向节奏

## Behavior Spec

### Image Pipeline

- WHEN `generate:content` 完成
- THEN 图片优化脚本自动处理 `public` 下生成出的图片资源

- WHEN 文章正文里存在本地磁盘路径图片
- THEN 该图片不进入最终 HTML
- AND 构建输出 warning

- WHEN 工作流部署到 VPS
- THEN 上传的是已经完成图片优化的站点产物

### Friend Page

- WHEN 用户进入 `friend` 模式
- THEN 页面应以全屏覆盖层显示，而不是底部半高面板

- WHEN 用户浏览 `Friend Links`
- THEN 首屏主体应是友链卡片网格
- AND 背景存在淡黑透明遮罩以提升卡片识别度

- WHEN 用户继续向下滚动
- THEN 页面底部应出现申请友链 section
- AND 既有 GitHub issue 提交提醒链路继续可用

## File Plan

### Image Pipeline

- Modify: `package.json`
  - 增加图片优化脚本命令
- Create: `scripts/optimize-images.mts`
  - 统一优化 `public/*assets`
- Modify: `scripts/generate-content.mts`
  - 让生成流程为图片优化提供稳定输入
- Modify: `scripts/content/generator-core.ts`
  - 识别并移除不可部署的本地磁盘路径图片引用
- Optionally modify: `.github/workflows/ci.yml`
  - 将图片优化纳入 CI 验证顺序
- Optionally modify: `.github/workflows/deploy-vps.yml`
  - 将图片优化纳入 VPS 部署顺序

### Friend UI

- Modify: `src/views/HomeView.vue`
  - 将 `friend` 模式容器升级为全屏覆盖层
- Modify: `src/components/home/FriendPanel.vue`
  - 重构为页面壳 + Hero + 主网格 + 底部申请区
- Modify: `src/components/home/friend/FriendLinkApplicationForm.vue`
  - 调整为适配底部 section 的视觉与节奏
- Optionally create: `src/components/home/friend/FriendLinkGrid.vue`
  - 承担主网格呈现
- Optionally create: `src/components/home/friend/FriendLinkCard.vue`
  - 承担单卡片渲染

### Tests

- Modify: `tests/home/friend-panel.test.ts`
  - 对齐新的全页结构与申请表单位置
- Modify or create: `tests/content/generator-core.test.ts`
  - 增加本地磁盘路径图片被剔除/告警的断言
- Optionally add: `tests/content/build-site-content.test.ts`
  - 覆盖坏图 warning 或优化后资源行为

## Risks

- 图片压缩若直接原地覆盖，需要控制算法，避免肉眼可见劣化
- `gif` 压缩若选型不当可能破坏动画或收益极低
- 若对所有无法解析的图片一律移除，需确保 warning 信息足够可追踪
- `friend` 全页改造若只改容器高度不改滚动逻辑，容易出现内部滚动和整页滚动打架
- 服务器现有图片压缩属于线上变更，必须在操作前留有体积与文件清单证据

## Verification Plan

### Image

- 本地运行：
  - `npm run generate:content`
  - `npm run typecheck`
  - `npm run test`
  - `VITE_BASE_PATH=/newBlog/ npm run build`
- 确认：
  - 生成日志包含坏图 warning 摘要
  - 生成产物不再包含 `C:\` / `D:\` 本地磁盘路径图片
  - 图片优化脚本输出节省体积摘要
- 服务器确认：
  - 抽样大图压缩前后体积变化
  - 抽样线上 URL 返回 `200`

### Friend

- 桌面端：
  - `friend` 模式为全屏覆盖层
  - 首屏主视觉为友链卡片网格
  - 申请区位于页面底部
- 移动端：
  - 页面无横向滚动
  - 卡片与表单保持单列节奏

## Acceptance Criteria

- 当前线上 `newBlog` 图片体积得到明显压缩
- 以后每次部署都会自动执行图片优化
- 历史文章中的本地磁盘路径图片不再在线上表现为裂图
- `friend` 模式升级为全页友链网络视图
- 背景存在淡黑透明遮罩，卡片识别度明显提升
- 申请友链表单继续保留，但明确下沉到底部 section
