# VueCubeBlog Blog Editorial Right Rail Design

## Goal

把当前偏“玻璃卡片堆”的 `Blog` 面板改成更有编辑感的文章索引：左侧展示文章目录，右侧首屏固定筛选轨，保留 Three.js 宇宙舞台和深色品牌气质。

## Approved Direction

采用 `Editorial Observatory` 方向。

- 桌面端：左侧约 `2/3` 屏宽为文章索引，右侧约 `1/3` 屏宽为筛选轨。
- 右侧筛选轨必须在首屏可见，不能继续落到 101 篇文章列表后面。
- 文章列表减少“每篇一张厚卡片”的感觉，改成目录式行项目。
- 保留暗色、星场、轻玻璃、cyan 细节，但降低圆角、阴影、边框数量。

## Visual Thesis

深色观测台式文章目录：克制、清晰、有空间感，用细线、日期列和轻玻璃筛选轨替代厚重卡片。

## Content Plan

### Blog Header

- 标识：`Blog Archive`
- 主标题：一句偏编辑型的 archive 标题，例如 `Field notes for code, study, and small systems.`
- 说明文案：中文短句，说明可搜索标题、摘要、类型、标签与正文。
- 搜索框与排序控件放在标题区下方。

### Article Index

每条文章使用横向目录行：

- 左列：日期、类型、阅读时长。
- 右列：标题、两行以内摘要、分类和标签。
- 行之间用细分隔线，不再用大面积独立卡片。

### Filter Rail

右侧 rail 内容：

- 顶部：`筛选轨道` + 当前结果数量。
- `Type`
- `Category`
- `Tag`
- 清空筛选入口。

筛选按钮继续使用 pill，但数量多时 rail 内部滚动或分组截断，避免拖长整页。

## Layout

### Desktop

`PostPanel.vue` 的主体布局改为两栏：

- `grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr)`
- 左侧为 header + search + article rows。
- 右侧为 sticky rail，`top` 与 nav / panel padding 对齐。
- Blog 覆盖层不能继续限制在 `md:w-1/2`，需要扩展为更宽的工作区，例如 `md:w-[78vw]` 或 `lg:w-[82vw]`，给 2/3 + 1/3 布局足够空间。

### Mobile

- 单列布局。
- 搜索优先。
- 筛选轨折叠到搜索下方，或作为横向 chips 区。
- 文章行退化为纵向：meta 在标题上方，摘要最多两到三行。

## Component Plan

- `src/views/HomeView.vue`
  - 调整 blog 覆盖层宽度、padding、滚动区域。
- `src/components/home/PostPanel.vue`
  - 维持查询状态与筛选逻辑。
  - 调整布局结构为左 index + 右 rail。
- `src/components/home/blog/BlogSearchBar.vue`
  - 减少厚卡片外壳。
  - 变为 header/search 区。
- `src/components/home/blog/BlogResults.vue`
  - 保持空状态。
  - 渲染新的目录式列表。
- `src/components/home/blog/BlogResultCard.vue`
  - 可重命名为 `BlogResultRow.vue`，或保留文件名但改为 row 视觉。
- `src/components/home/blog/BlogFilterRail.vue`
  - 保持功能。
  - 改为首屏右 rail 样式，控制内部高度与滚动。
- `src/assets/main.css`
  - 只添加必要的 blog 专用类或变量；避免全站视觉回归。

## Interaction Thesis

- Blog 面板进入时：标题、搜索、文章行轻微 stagger fade/translate。
- 文章行 hover：标题提亮、左侧日期列或分隔线出现 cyan 细线。
- 筛选 rail sticky：滚动文章时保持上下文稳定。

必须尊重 `prefers-reduced-motion`。

## Data Flow

沿用现有数据流：

- `useBlogQueryState()` 管理 query、type、category、tag、sort。
- `buildBlogFacets()` 生成 rail 数据。
- `filterBlogPosts()` 与 `sortBlogPosts()` 生成结果。
- 点击文章继续携带 query context 到阅读页。

本次不引入新依赖、不新增后端、不改内容生成格式。

## Testing

需要覆盖：

- blog 搜索仍能过滤文章。
- type/category/tag toggle 行为不变。
- sort 行为不变。
- clear filters 行为不变。
- 点击文章仍携带 `q/type/category/tag/sort` query。
- 桌面布局下筛选 rail 位于首屏右侧。
- 移动布局无水平溢出，搜索、筛选、文章标题不重叠。

建议验证命令：

- `npm test`
- `npm run typecheck`
- `npm run build`

视觉验证：

- Playwright 截图桌面 `1440x900`
- Playwright 截图移动 `390x844`
- 检查 night/day 两种主题。

## Risks

- Blog 覆盖层变宽后可能与 Three.js 主体构图冲突，需要用截图确认右侧仍有足够舞台留白。
- 标签数量多时 rail 可能过长，必须限制 rail 内部滚动或只显示高频项。
- 当前工作树已有未提交改动，实现时必须避免覆盖无关文件。
