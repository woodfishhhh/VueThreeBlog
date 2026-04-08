# VueCubeBlog Blog Content Hub Design

## Goal

在 `VueCubeBlog` 中把当前偏“文章列表面板”的 `Blog` 覆盖层升级为一个真正可探索的内容中枢，同时增强阅读页目录导航与 `Friend Links` 申请链路，保持现有深色、宇宙感、悬浮面板式的品牌语言，不把站点做成普通博客后台。

## Scope

- `Blog` 覆盖层
  - 新增搜索
  - 新增 `type / category / tag` 三层筛选
  - 新增结果概览、排序、清空筛选等探索控制
  - 保持为首页三维场景上的覆盖面板，不新增顶层 nav 项
- 阅读页
  - 右侧 `Table of Contents` 随滚动保持稳定
  - 目录过长时支持独立滚动
  - 保持阅读进度与当前章节高亮联动
  - 保持从 `Blog` 覆盖层进入阅读页时的上下文连续性
- `Friend Links`
  - 在现有友链展示区下新增“申请友链”卡片区
  - 以纯前端方式跳转到预填好的 GitHub issue 创建页
  - 跳转前必须明确提醒用户“即将跳到 GitHub issue 页面提交”

## Out Of Scope

- 不重做首页三维场景世界观
- 不把搜索、标签、分类入口塞进顶部主 nav
- 不引入后端搜索服务或独立数据库
- 不新增服务端接口来接收友链申请
- 不重构 `oldBlog / weather / pretext`
- 不把博客改造成白底、工具后台或 Hexo 主题复刻品

## Current State

### 1. Blog Overlay

- 当前 `src/components/home/PostPanel.vue` 仍是“Recent Posts + 滚动列表”结构
- 已有文章索引数据具备：
  - `title`
  - `excerpt`
  - `publishedAt / publishedLabel`
  - `readingMinutes`
  - `categories`
  - `tags`
- 当前缺少：
  - 搜索入口
  - `type` 维度
  - 多维筛选与结果汇总
  - 保留筛选状态的明确机制

### 2. Reading Page

- 当前 `src/components/article/ArticleContent.vue` 已具备正文与右侧 rail 布局
- 当前 `src/components/article/ArticleToc.vue` 只负责渲染目录按钮与 active 样式
- 当前目录卡片还没有：
  - sticky 定位
  - 最大高度控制
  - 独立滚动容器

### 3. Friend Links

- 当前 `src/components/home/FriendPanel.vue` 只有友链展示网格
- 缺少：
  - 申请友链入口
  - 表单字段
  - GitHub issue 跳转链路
  - 提交前提醒

## Approved Decisions

### 1. Overall Direction

- 采用“内容中枢型”方案
- `Blog` 不再只是文章列表，而是首页覆盖层里的内容探索中心

### 2. Search Mode

- 搜索采用混合模式：
  - 默认搜索 `title / excerpt / type / categories / tags`
  - 对较长查询再扩展到正文内容

### 3. Taxonomy Model

- 内容结构使用三层：
  - `type`：一级内容类型，如 `Tutorial / Notes / Project / Essay`
  - `categories`：主题域
  - `tags`：细粒度标签

### 4. Friend Submission Path

- 友链申请采用纯前端跳转 GitHub issue 创建页
- 不直接提交 issue
- 用户点击提交后，先明确提醒：
  - `即将跳到 GitHub issue 页面提交`

### 5. Friend Form Fields

- 申请字段固定为：
  - `Site Name`
  - `Site URL`
  - `Avatar URL`
  - `Short Description`
  - `Your Name / Contact`
- 不加入 `Why we should connect`
- 不加入 `Message`

## Design

### 1. Blog Content Hub Architecture

`Blog` 覆盖层升级为三段式结构，但仍保持现有悬浮面板语义：

1. 顶部检索带
   - 左侧：`Blog` 标题与站点内容统计
   - 中部：主搜索框
   - 右侧：当前结果概览与筛选状态
2. 中部内容区
   - 左侧主区：文章结果流
   - 右侧控制轨道：`type / category / tag / sort / clear`
3. 底部辅助区
   - 放轻量的辅助入口，如热门标签、最近更新、分类分布

桌面端维持双栏结构；移动端筛选区收纳为顶部折叠筛选层或抽屉，不在小屏上长期占位。

### 2. Blog Search Strategy

搜索采用两段式评分：

- 基础命中：
  - `title`
  - `excerpt`
  - `type`
  - `categories`
  - `tags`
- 扩展命中：
  - 当查询长度或关键词数量达到阈值时，再纳入正文文本

这样可以兼顾：

- 短搜索时结果干净
- 长搜索时仍能找到深埋内容

搜索栏不进入主 nav，而是内聚在 `Blog` 覆盖层顶部，符合“不让顶部拥挤”的要求。

### 3. Taxonomy & Content Model

当前仓库已有 `categories` 与 `tags`。为支持新的“内容中枢”模型，需要引入 `type`，但不强制一次性重写全部历史文章。

建议内容模型升级为：

- `type`
  - 用于一级内容性质筛选
  - 前端优先展示
- `categories`
  - 用于主题域归类
- `tags`
  - 用于细粒度探索与交叉搜索

迁移策略：

- 新文章推荐在 markdown frontmatter 中显式写 `type`
- 历史文章若缺失 `type`，由内容构建层使用默认值回填
- 默认值建议为 `Notes`
- 若后续需要，可再做更细的规则映射，但本轮不做复杂迁移脚本

这保证本轮可以先把信息架构跑起来，不会被历史内容清洗卡住。

### 4. Blog Result Presentation

结果流不再是单行列表，而是更完整的内容卡片，每篇至少呈现：

- 标题
- 发布时间
- excerpt
- reading time
- `type`
- 主要 `categories`
- 主要 `tags`

结果卡依然服务于“阅读”，不是做商业化磁贴墙，因此视觉方向为：

- 深色玻璃卡
- 轻边框
- 克制 hover 提亮
- 重点放在 typography、信息节奏和筛选反馈

### 5. Reading Page & TOC

阅读页保持现有沉浸式深色宇宙感，但右侧 rail 升级为阅读导航轨道：

- `Table of Contents` 在阅读布局内采用 `sticky`
- 目录卡片本身有最大高度控制
- 目录条目区域可以独立滚动
- 标题区固定，滚动区只负责目录项
- 当前阅读章节继续高亮联动
- `h2 / h3 / h4` 通过层级缩进与亮度差异体现结构

移动端不强制保留右侧 rail，而是折叠为目录按钮或底部抽屉，避免小屏阅读被侧栏挤压。

### 6. Reading Flow Continuity

当用户从 `Blog` 内容中枢进入文章详情页，再返回 `Blog` 时，应尽量保留：

- 搜索词
- 当前 `type`
- 当前 `categories`
- 当前 `tags`
- 排序方式

这样用户不会因为阅读一篇文章而丢失前面的探索上下文。

### 7. Friend Links Submission Experience

`Friend Links` 页面采用双区结构：

1. 上半区
   - 继续展示现有友链卡片
   - 对卡片秩序与 hover 做轻量统一
2. 下半区
   - 新增“申请友链”卡片
   - 使用与站点一致的深色悬浮卡片语言

表单字段：

- `Site Name`
- `Site URL`
- `Avatar URL`
- `Short Description`
- `Your Name / Contact`

提交链路：

1. 用户填写表单
2. 点击提交按钮
3. 页面先弹出提醒：
   - `即将跳到 GitHub issue 页面提交`
4. 用户确认后，跳转到预填好的 GitHub new issue URL
5. 用户在 GitHub 页面完成最终提交

本轮采用“预填 issue 页”而不是“直接调 GitHub API”，是为了保持：

- 无后端依赖
- 无 token 暴露
- 实现稳定
- 用户知道自己即将离开当前页面

## Behavior Spec

### Blog Search

- WHEN 用户进入 `Blog` 覆盖层
- THEN 页面应展示搜索框、结果概览与筛选轨道
- AND 用户不需要切换顶层 nav 就能完成内容检索

- WHEN 用户输入短查询
- THEN 搜索优先匹配 `title / excerpt / type / categories / tags`

- WHEN 用户输入较长查询
- THEN 搜索结果可以进一步匹配正文内容

### Blog Filtering

- WHEN 用户选择 `type`
- THEN 结果列表立即缩小到该内容类型

- WHEN 用户继续选择 `category` 或 `tag`
- THEN 页面应展示组合筛选结果
- AND 当前筛选状态应有清晰反馈

- WHEN 用户点击清空筛选
- THEN 搜索词与多维筛选恢复默认状态

### Reading Flow

- WHEN 用户从 `Blog` 结果卡点击文章
- THEN 进入文章详情页
- AND 阅读页保持深色沉浸体验

- WHEN 用户滚动文章正文
- THEN `TOC` 保持在右侧稳定位置
- AND 当前章节在目录中高亮

- WHEN 目录长度超过用户屏幕
- THEN `TOC` 条目区域独立滚动
- AND 目录标题区域保持可见

- WHEN 用户返回 `Blog`
- THEN 先前搜索词与筛选状态应尽量恢复

### Friend Submission

- WHEN 用户进入 `Friend Links`
- THEN 页面上半区显示现有友链
- AND 下半区显示申请友链卡片

- WHEN 用户填写申请信息并点击提交
- THEN 页面必须先提醒：
  - `即将跳到 GitHub issue 页面提交`

- WHEN 用户确认提醒
- THEN 跳转到预填好的 GitHub issue 创建页

## File Plan

### Blog Hub

- Modify: `src/components/home/PostPanel.vue`
  - 从单纯文章列表升级为内容中枢壳
- Optionally create: `src/components/home/blog/BlogSearchBar.vue`
  - 承载主搜索框与结果提示
- Optionally create: `src/components/home/blog/BlogFilterRail.vue`
  - 承载 `type / category / tag / sort / clear`
- Optionally create: `src/components/home/blog/BlogResults.vue`
  - 承载结果流与空状态
- Optionally create: `src/components/home/blog/BlogResultCard.vue`
  - 承载单篇内容卡
- Modify: `src/types/content.ts`
  - 为文章摘要与正文数据增加 `type`
- Modify: `src/content/posts.ts`
  - 提供带 `type` 的消费模型与必要聚合辅助
- Modify: `scripts/content/*`
  - 从 markdown frontmatter 生成或回填 `type`

### Reading Page

- Modify: `src/components/article/ArticleContent.vue`
  - 明确正文列与右侧导航轨道边界
- Modify: `src/components/article/ArticleToc.vue`
  - 加入 sticky 容器、独立滚动区与层级样式
- Optionally modify: `src/composables/useArticleReading.ts`
  - 保持 active heading 与阅读进度逻辑
- Optionally modify: `src/assets/main.css`
  - 补充目录轨道与阅读页布局变量

### Friend Links

- Modify: `src/components/home/FriendPanel.vue`
  - 新增申请友链卡片区
- Optionally create: `src/components/home/friend/FriendLinkApplicationForm.vue`
  - 管理字段、校验、提醒弹层与 GitHub issue URL 生成

## Risks

- `PostPanel.vue` 若继续无限堆逻辑，会很快变成另一个大而难维护的单文件；本轮应优先拆出博客子组件
- 历史文章当前没有统一 `type`，若没有合理默认值，筛选会出现空维度
- 搜索若一开始就全量正文扫描，可能让 overlay 交互变钝，需要控制匹配策略与计算时机
- `TOC` sticky 若直接套死样式，可能和当前 overlay 容器的滚动上下文打架
- GitHub issue 预填链接需要控制内容长度与编码，避免长文本字段导致 URL 过长

## Verification Plan

### Blog Hub

- 确认内容中枢存在：
  - 搜索框
  - `type / category / tag` 筛选
  - 结果概览
  - 清空筛选
- 验证短查询与长查询分别命中不同范围
- 验证缺失 `type` 的历史文章有默认回填值

### Reading Page

- 桌面端验证：
  - `TOC` 随正文滚动保持稳定
  - 长目录可独立滚动
  - active heading 高亮正确
- 移动端验证：
  - 目录不挤压正文
  - 页面无明显横向爆裂

### Friend Links

- 验证申请卡片字段完整
- 验证点击提交前会先出现提醒
- 验证确认后跳转到正确的 GitHub issue 创建页
- 验证 issue 标题与正文预填内容可读

## Acceptance Criteria

- `Blog` 覆盖层从简单文章列表升级为内容中枢
- 搜索支持混合模式，不依赖主 nav 扩容
- 用户可以按 `type / category / tag` 多维筛选文章
- 历史文章即使没有 `type` 也能得到合理默认值
- 阅读页右侧 `TOC` 保持稳定，长目录可以独立滚动
- 用户从 `Blog` 进入阅读页再返回时，不会明显丢失探索上下文
- `Friend Links` 页面新增友链申请区
- 点击提交前会明确提醒：
  - `即将跳到 GitHub issue 页面提交`
- 友链申请通过 GitHub issue 预填页完成，不引入后端接口
