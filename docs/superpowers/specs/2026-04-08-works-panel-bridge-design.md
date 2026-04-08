# VueCubeBlog Works Panel Bridge Design

## Goal

在 `VueCubeBlog` 首页三维场景中新增一个与 `blog / author / friend` 同级的 `works` 覆盖面板，用统一风格串联三个线上项目与三个 GitHub 仓库；同时把 `weather` 项目中导向作者博客的外链更新为京东云线上博客地址。

## Scope

- `VueCubeBlog`
  - 新增 `works` 模式与入口
  - 新增 `WorksPanel` 组件
  - 新增作品集数据源
  - 首页挂载作品集覆盖面板
  - 在 `works` 模式下调整三维场景构图，让视角上抬、超立方体下沉到画面下半区
- `weather`
  - 把“Visit The Journal”按钮从旧域名改为 `http://36.151.148.198/newBlog/`

## Out Of Scope

- 不新增 `VueCubeBlog` 独立路由页面
- 不改 `pretext` 源码
- 不改 `blog / author / friend / reading` 现有内容结构
- 不重做三维场景交互逻辑，只在 `works` 模式追加最小构图偏移
- 不重构现有 CI/CD，只验证它们仍然存在且没有被本次改动破坏

## Approved Decisions

### 1. Interaction Model

- `Works` 作为首页顶部导航里的独立项出现
- 点击 `Works` 后仍停留在首页三维场景，不跳转路由
- `Works` 面板与 `blog / author / friend` 一样，属于同一套覆盖层交互

### 2. Layout Direction

- 采用“A 版”构图
- 作品集面板位于画面上半区，形成明显的内容层
- 超立方体保留在屏幕下半区，强化“视角往上看”的感觉
- 该构图只在 `works` 模式生效

### 3. Visual Language

- 保持 `VueCubeBlog` 现有的冷静、留白、实验感
- 面板使用黑底半透、细边框、低饱和蓝色强调
- 作品以三列等权卡片展示，不做商业化卡片墙
- hover 反馈只做轻微边框和文字提亮

### 4. Content Model

每张作品卡片包含：

- 项目名
- 一句简介
- 类型标签
- `Live` 入口
- `GitHub` 入口

预设内容：

1. `VueCubeBlog`
   - Live: `http://36.151.148.198/newBlog/`
   - GitHub: `https://github.com/woodfishhhh/VueThreeBlog`
2. `WeatherDemo`
   - Live: `http://36.151.148.198/weather/`
   - GitHub: `https://github.com/woodfishhhh/WeatherDemo`
3. `Pretext`
   - Live: `http://36.151.148.198/pretext/`
   - GitHub: `https://github.com/woodfishhhh/Pretext-cube`

## File Plan

### VueCubeBlog

- Modify: `src/stores/site.ts`
  - 扩展 `SiteMode`，新增 `goWorks()`
- Modify: `src/components/layout/SiteNav.vue`
  - 新增 `Works` 导航项
- Modify: `src/views/HomeView.vue`
  - 挂载 `WorksPanel`，定义 `works` 面板位置和显示逻辑
- Modify: `src/components/scene/ThreeSceneCanvas.vue`
  - 追加 `works` 模式下的相机位置、注视点和立方体构图偏移
- Create: `src/components/home/WorksPanel.vue`
  - 独立负责作品集覆盖层 UI
- Create: `src/content/works.ts`
  - 集中维护作品列表数据
- Optionally modify: `src/types/content.ts`
  - 若需要，为作品卡片补充类型定义

### weather

- Modify: `src/components/SiteNavigation.vue`
  - 更新博客外链地址

## Behavior Spec

### Main Path

- WHEN 用户点击 `Works`
- THEN 首页进入 `works` 模式
- AND 顶部导航高亮到 `Works`
- AND 上半区出现 `Selected Works` 作品集面板
- AND 面板中展示三个项目卡片
- AND 每张卡片提供 `Live` 与 `GitHub` 两个外链入口
- AND 三维场景视角上抬，超立方体稳定停在下半区

### Return Path

- WHEN 用户从 `works` 切换回 `home / blog / author / friend`
- THEN `works` 面板隐藏
- AND 三维场景恢复现有模式对应的构图参数

### Weather Link Path

- WHEN 用户在 `weather` 项目中点击 “Visit The Journal ↗”
- THEN 浏览器应打开 `http://36.151.148.198/newBlog/`

## Risks

- `ThreeSceneCanvas.vue` 已较长，新增 `works` 构图逻辑时要保持最小改动，避免影响已有模式
- `HomeView.vue` 当前以条件渲染多个面板，新增 `works` 后要注意定位层级和移动端高度
- 作品集卡片如果直接写死在组件里，后续维护会分散，因此建议单独抽到 `src/content/works.ts`

## Verification Plan

- `VueCubeBlog`
  - 运行 `npm run build`
  - 运行 `npm test`
  - 浏览器检查 `Works` 导航、作品面板、三维构图是否符合设计
- `weather`
  - 运行项目可用的构建或测试命令
  - 浏览器点击 “Visit The Journal ↗” 验证跳转地址
- CI/CD
  - 检查两个项目现有 `.github/workflows/` 是否仍在
  - 确认本次改动未绕开原有部署入口

## Acceptance Criteria

- `VueCubeBlog` 首页出现 `Works` 导航项
- `Works` 以覆盖面板形式出现，而非新路由
- 作品集采用三列等权布局
- 作品集包含三个项目，且每个项目同时有 `Live` 与 `GitHub`
- `works` 模式下画面视角上抬，超立方体位于屏幕下半区
- `weather` 的博客外链指向京东云博客
- 本地构建通过，仓库工作流文件仍完整存在
