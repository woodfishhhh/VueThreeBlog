# Friend 页面伪 3D 瀑布流改造计划

## Summary

- 视觉方向：B Editorial Polaroid 纸感错落卡片 + A 的 pointer/hover 轻微 rotateX/rotateY 伪 3D。
- 桌面布局：左侧 fixed 小窗口放提交友链；右侧 fixed 朋友链接瀑布流，占屏幕约 2/3，两列。
- 移动端：提交友链改成抽屉；朋友列表单列 fixed 窗口滚动。
- 无限滑动：采用“循环列表”方案，重复 3 段内容，触顶/触底无感跳回中段。

## Key Changes

- FriendPanel 保持外部接口 links: FriendLinkData[] 不变；内部重排为两个 fixed panes。
- 卡片伪 3D：pointer move 写入 CSS vars，最大倾斜约 ±7deg；pointer leave 回正；prefers-reduced-motion 或 touch 粗指针下禁用 tilt。
- Vue API：用 computed 派生域名/布局，useTemplateRef + nextTick + watch 初始化 scroll，中段重置；用 `<TransitionGroup>` 做卡片进入/移动，用
  `<Transition>` 做移动端抽屉。

## Implementation Details

- 随机瀑布流：每次组件 mount 对链接做 Fisher-Yates shuffle；卡片高度按描述长度 + 小随机 bucket 派生，刷新后位置不同。
- 两列分配：按当前累计高度把下一张卡放到较短列，保证瀑布流自然错落。
- 循环滚动：内容结构为 segment(top clone) + segment(main) + segment(bottom clone)；加载后设置 scrollTop = mainSegmentOffset；滚动接近边界时加/减一个
  segment 高度。
- 可访问性：克隆段设 aria-hidden，其链接 tabindex="-1"；主段保持真实可点击外链。
- 移动端抽屉：固定底部按钮“提交友链”，点击展开 bottom sheet，保留现有 GitHub issue 生成/确认逻辑。
- 不新增依赖；只改现有 Friend 组件与必要 CSS。

## Test Plan

- Unit：FriendPanel 仍渲染卡片、表单入口、issue 提交流程不回归。
- Unit：FriendLinkCard 显示 fomal.cc / blog.mohao.me 等域名，不出现“友情链接”。
- Unit：移动端抽屉按钮可打开/关闭表单。
- Unit：循环列表渲染 3 段，只有主段可聚焦。
- Verification：npm run typecheck、npm test、npm run build。
- Chrome CLI：验证 /friend 桌面与 390x844 移动端；滚轮/触控只滚右侧窗口；hover 后 transform 变化；console 无 error/warn。

## Assumptions

- FriendLinkData 数据结构不改。
- 朋友卡片点击行为保持外链新 tab 打开。
- “无限滑动”定义为手动滚动的视觉循环，不做自动漂流。
- 视觉优先白昼 warm paper；夜间沿用深玻璃但保留同一 3D/瀑布流结构。
