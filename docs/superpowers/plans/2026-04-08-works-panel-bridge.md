# Works Panel Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `VueCubeBlog` 首页三维场景中新增 `Works` 覆盖面板，串联三个线上项目与三个 GitHub 仓库；同步修正 `weather` 的博客入口，并核对/补齐两个真实本地仓库的 CI/CD 基线。

**Architecture:** 维持现有 `VueCubeBlog` 的单首页三维场景结构，在 `site store` 中增加 `works` 模式，再由 `HomeView` 条件挂载新建的 `WorksPanel`。作品内容从独立数据文件读取，三维场景只增加 `works` 模式下的最小相机与立方体偏移。`weather` 仅修改导航组件外链，同时检查两个本地仓库的 `.github/workflows`，必要时把云上已验证的部署工作流补回真实源码目录。

**Tech Stack:** Vue 3, Pinia, Vue Router, Vite, Vitest, Tailwind CSS, Three.js, GitHub Actions

---

### Task 1: 核对真实本地仓库与 CI/CD 差异

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows\*`（如本地缺失则创建）
- Modify: `C:\Users\woodfish\Desktop\前端\weather\weather\.github\workflows\*`（如本地缺失则创建）
- Reference: `C:\Users\woodfish\.openclaw\workspace\jdcloud-deploy\VueThreeBlog\.github\workflows\*`
- Reference: `C:\Users\woodfish\.openclaw\workspace\jdcloud-deploy\WeatherDemo\.github\workflows\*`

- [ ] **Step 1: 检查两个真实本地仓库当前 workflow 状态**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" status --short
git -C "C:\Users\woodfish\Desktop\前端\weather\weather" status --short
Get-ChildItem "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows"
Get-ChildItem "C:\Users\woodfish\Desktop\前端\weather\weather\.github\workflows"
```

Expected: `VueCubeBlog` 缺少 workflow，`weather` 至少缺少 VPS 部署 workflow。

- [ ] **Step 2: 对比云上已验证目录中的 workflow**

Run:
```bash
Get-ChildItem "C:\Users\woodfish\.openclaw\workspace\jdcloud-deploy\VueThreeBlog\.github\workflows"
Get-ChildItem "C:\Users\woodfish\.openclaw\workspace\jdcloud-deploy\WeatherDemo\.github\workflows"
```

Expected: 可以拿到已跑通的 `ci.yml` / `deploy-vps.yml`。

- [ ] **Step 3: 决定补齐策略**

Action:
- 若真实本地仓库缺失云上已验证的 workflow，则把对应文件补到真实本地仓库。
- 仅搬运当前项目所需的 workflow，不引入无关文件。

- [ ] **Step 4: 提交前再次确认 workflow 路径存在**

Run:
```bash
Get-ChildItem "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows"
Get-ChildItem "C:\Users\woodfish\Desktop\前端\weather\weather\.github\workflows"
```

Expected: `VueCubeBlog` 和 `weather` 都能看到 CI/CD 相关 workflow 文件。

### Task 2: 为 VueCubeBlog 新功能补测试并验证红灯

**Files:**
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\home\works-panel.test.ts`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\stores\site.test.ts`
- Reference: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\tests\setup.ts`

- [ ] **Step 1: 写 `site store` 的失败测试**

Test target:
- `goWorks()` 存在
- 调用后 `mode === "works"`
- 会清理 `activePostSlug`
- 会退出聚焦模式

- [ ] **Step 2: 写 `WorksPanel` 的失败测试**

Test target:
- 渲染后出现 `Selected Works`
- 渲染三张作品卡
- 每张卡同时有 `Live` 和 `GitHub`

- [ ] **Step 3: 运行新测试确认红灯**

Run:
```bash
npm test -- tests/stores/site.test.ts tests/home/works-panel.test.ts
```

Expected: 因 `works` 模式和 `WorksPanel` 尚不存在而失败。

### Task 3: 实现 VueCubeBlog 的 works 模式、面板与三维构图

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\stores\site.ts`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\layout\SiteNav.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\views\HomeView.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\scene\ThreeSceneCanvas.vue`
- Modify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\types\content.ts`（如需要）
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\content\works.ts`
- Create: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\src\components\home\WorksPanel.vue`

- [ ] **Step 1: 在 `site.ts` 中增加 `works` 模式和 `goWorks()`**

Implementation notes:
- 扩展 `SiteMode`
- 沿用 `goBlog/goAuthor/goFriend` 的写法

- [ ] **Step 2: 在 `SiteNav.vue` 中增加 `Works` 导航项**

Implementation notes:
- 桌面端和移动端都要出现
- 点击行为与现有导航一致

- [ ] **Step 3: 新建 `works.ts` 维护作品集数据**

Implementation notes:
- 抽离项目名、简介、标签、Live、GitHub
- 保持数据纯函数/纯对象，避免把展示逻辑写进数据层

- [ ] **Step 4: 新建 `WorksPanel.vue`**

Implementation notes:
- 结构对齐现有 `PostPanel/FriendPanel`
- 上半区阅读节奏优先
- 三列等权卡片
- 每卡双按钮：`Live` / `GitHub`

- [ ] **Step 5: 在 `HomeView.vue` 中挂载 `WorksPanel`**

Implementation notes:
- 只在 `siteStore.mode === "works"` 时渲染
- 面板定位在上半区
- 不影响 `blog / author / friend / reading` 现有分支

- [ ] **Step 6: 在 `ThreeSceneCanvas.vue` 中追加 `works` 构图偏移**

Implementation notes:
- `works` 模式单独设置 targetPos / targetLook
- 增加超立方体轻微下沉或整体位置偏移
- 不重构整套场景逻辑，只做最小分支扩展

- [ ] **Step 7: 运行新测试确认绿灯**

Run:
```bash
npm test -- tests/stores/site.test.ts tests/home/works-panel.test.ts
```

Expected: 两个新增测试通过。

### Task 4: 修正 weather 博客入口并用测试锁定

**Files:**
- Modify: `C:\Users\woodfish\Desktop\前端\weather\weather\src\components\SiteNavigation.vue`
- Create: `C:\Users\woodfish\Desktop\前端\weather\weather\src\components\__tests__\SiteNavigation.spec.ts`

- [ ] **Step 1: 写 `SiteNavigation` 的失败测试**

Test target:
- “Visit The Journal ↗” 链接存在
- `href === "http://36.151.148.198/newBlog/"`

- [ ] **Step 2: 运行单测确认红灯**

Run:
```bash
npm run test:unit -- src/components/__tests__/SiteNavigation.spec.ts
```

Expected: 在链接尚未更新前失败。

- [ ] **Step 3: 修改 `SiteNavigation.vue` 外链地址**

Implementation notes:
- 仅改目标地址，不改其它文案和交互

- [ ] **Step 4: 再跑单测确认绿灯**

Run:
```bash
npm run test:unit -- src/components/__tests__/SiteNavigation.spec.ts
```

Expected: 测试通过。

### Task 5: 构建验证、浏览器验证与提交

**Files:**
- Verify: `C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog`
- Verify: `C:\Users\woodfish\Desktop\前端\weather\weather`

- [ ] **Step 1: 运行 VueCubeBlog 全量验证**

Run:
```bash
npm test
npm run build
```

Expected: 测试与构建通过。

- [ ] **Step 2: 运行 weather 全量验证**

Run:
```bash
npm run test:unit
npm run build
```

Expected: 测试与构建通过。

- [ ] **Step 3: 浏览器验证关键交互**

Check:
- `VueCubeBlog` 出现 `Works`
- 作品集面板位置在上半区
- 超立方体在下半区
- 三张卡片双链接都可点击
- `weather` 的博客按钮跳到京东云博客

- [ ] **Step 4: 检查 CI/CD 文件仍在**

Run:
```bash
Get-ChildItem "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog\.github\workflows"
Get-ChildItem "C:\Users\woodfish\Desktop\前端\weather\weather\.github\workflows"
```

Expected: workflow 文件存在，未被本次改动破坏。

- [ ] **Step 5: 分仓库提交**

Run:
```bash
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" add .
git -C "C:\Users\woodfish\Desktop\前端\three.js.learn\VueCubeBlog" commit -m "feat: add works panel bridge"

git -C "C:\Users\woodfish\Desktop\前端\weather\weather" add .
git -C "C:\Users\woodfish\Desktop\前端\weather\weather" commit -m "fix: point journal link to jdcloud blog"
```

Expected: 两个仓库各自产生一条清晰提交记录。
