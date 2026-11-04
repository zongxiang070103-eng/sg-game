# 将星谱 · 协作说明（给 Claude / 协作者）

3v3 明牌回合制卡牌演武。单页面、离线可玩；核心规则在 `src/core/`，界面在 `src/web/`，六十名武将与一百八十个战法由 `data/*.json` 驱动。

## 先读这几条

- **每一项交付控制在 30 分钟内**。先给可验证的结果，再继续打磨；不要连续跑几十分钟的全流程浏览器操作。
- 大改视觉前先说明方案（布局、尺寸、断点、影响文件），征得同意再动手。
- 改 UI 必须用真实浏览器验证，不能只凭构建通过就宣布完成。
- 美术保持**国风赛璐璐**：历史向、非 Q 版、非卡通；不得引入商业游戏素材。
- 修改数据 / 规则的边界：`src/core` 不依赖 DOM；`src/web` 只做展示与交互；账号服务 `server/` 可选，不参与单页游戏。

## 常用命令

```bash
npm run dev          # 开发服务器 5173（/api 代理到 8787）
npm run typecheck    # 类型检查（秒级）
npm test             # 单元测试 45 项，约 10 秒
npm run qa           # 无头浏览器冒烟 + 10 张截图，约 15 秒
npm run build        # 类型检查 + 生产构建
npm run sim          # 双方 AI 跑 300 局，调平衡用
npm run sim -- --seed 42   # 指定种子打印一整局
```

需要本机 Chrome / Edge。非标准安装位置用：

```bash
CHROME_PATH="C:\\path\\to\\chrome.exe" npm run qa
```

`npm run qa` 会自行起临时 Vite 服务器、驱动无头浏览器，结束时关闭；截图与报告在 `.qa/`（已 gitignore，不入库）。失败时看 `.qa/report.json` 的 `errors` / `failedRequests`，并逐张看截图。

## 快速验证（不要每次都从头点）

调试深链同时支持普通查询串和 hash 查询串，例如：

| 目标 | URL |
| --- | --- |
| 点将台 | `/?screen=home` |
| 图鉴 | `/?screen=codex` |
| 布阵（未选人） | `/?screen=deploy&seed=42` |
| 布阵（预选三人） | `/?screen=deploy&seed=42&starters=P0,P1,P2` |
| 战场 | `/?screen=battle&seed=42&starters=P0,P1,P2&fast=1` |
| 结算海报 | `/?screen=result&outcome=victory&round=9&damage=1234&seed=7&fast=1` |

- `screen`：`home` / `codex` / `deploy` / `battle` / `result`。`result` 落到战场并直接弹出结算。
- `outcome`：`victory`（默认）或 `defeat`；`round`、`damage` 写入结算数据。
- `starters`：`P0,P1,P2` 或武将 id（如 `guanyu,zhangfei,zhaoyun`），最多三人；不传则取编队前三。
- `seed`：固定随机种子，复现同一战局。
- `fast=1`（或 `fast`）：关闭 CSS 动画与 JS 动作时序，用于截图和自动化。

控制台入口：

```js
jiangxing.debug.finish('victory', 9, 777) // 直接结束当前战局并弹结算
jiangxing.debug.go('codex')               // 切屏
jiangxing.debug.newRun(42)                // 新开一局（可传种子）
jiangxing.app                             // 全局可变状态
jiangxing.renderBattle(false)             // 无动画重绘战场
```

**验证优先级**：先深链直达目标屏幕 → 只截需要的那一屏 → 只有测引擎规则时才跑完整战斗。需要完整战局时用 `npm run sim -- --seed 42`，不要在浏览器里逐回合点几十次。

## 架构地图

```
data/                 武将、技能、配置、界面元数据（可 mod）
src/core/             纯逻辑，无 DOM
  battle.ts             出手队列、伤害、状态、冷却、事件、换将、判定
  data.ts               读取 / 校验 JSON
  ai.ts / rng.ts        启发式 AI、种子随机
src/web/              浏览器界面
  main.ts               入口、hash 路由、深链与中央点击分发
  deeplink.ts           调试深链（屏幕、种子、首发、结算）
  url.ts                查询参数与 fast 模式
  store.ts              全局状态、编队、筛选
  home.ts / deploy.ts / battle.ts / codex.ts   四个屏幕
  cards.ts              卡面 / 场上卡 / 详报共用渲染
  meta.ts               势力配色、立绘与图版映射
  ui.ts / fx.ts / audio.ts                    浮层、特效、声音
  style.css / codex.css / merged.css          主样式、图鉴、合并补充
tests/                战斗、账号、渲染单元测试
scripts/qa.mjs        无依赖 CDP 冒烟检查
server/               可选账号服务（Node + SQLite）
```

路由：`#/home`、`#/deploy`、`#/battle`、`#/codex`。`deploy` / `battle` 需要已有战局，直接打开会回落。

## 工作流（按此执行）

1. **定位交付物**：一句话说清改哪个屏幕、验收标准是什么。
2. **复现**：UI 问题先开对应深链截图；核心规则问题先写 / 跑单元测试。
3. **小步改**：每次只动一个关注点，保留现有约定（命名、CSS 令牌、四屏结构）。
4. **分层验证**：

   | 改动 | 最低验证 |
   | --- | --- |
   | 纯类型 / 工具函数 | `npm run typecheck` |
   | 战斗规则、状态、天赋 | `npm test`（必要时加用例） |
   | 卡面 / 布局 / CSS / 深链 | `npm run qa`，看对应截图 |
   | 准备提交 | `npm run build` |

5. **提交检查点**：一组相关改动完成就 commit，不要攒几十个文件再提交。提交信息写清“改了什么、为什么”。

### 节省时间的做法

- 不要重复启动 Vite：先看 5173 是否已在运行，有则复用。
- 不要用长时间 `sleep` 等动画；加 `fast=1` 或直接调 debug 接口。
- 不要每轮都跑 `npm run build`；类型检查 / QA 更快，构建留给提交前。
- 截图只截受影响的界面和宽度，常见组合：`1440×900` + `390×844`；必要时加 `760×900`。
- 不要在浏览器里手动打完整局。结算样式用 `screen=result`，战局逻辑用 `sim`。
- 后台进程用完即停，避免占内存；`.qa/` 只保留最近一次即可。

## 断点与布局约定

- 全局断点：`1280 / 1080 / 900 / 760 / 520 / 480`；矮屏另有 `max-height: 850 / 820 / 800`。
- 图鉴列数：6 → 5 → 4 → 3 →（≤760）3 →（≤520）2。
- 布阵列数：5 →（≤1080）4 →（640–760）4 →（≤480）2。
- 战场卡宽由 `--battle-card` 控制，窄屏军令栏固定五行、隐藏战报按钮。
- 高度媒体查询必须放在基础规则**之后**，否则会被后者覆盖（曾导致 1440×802 布阵溢出）。

## 容易踩的坑

- `applyDeepLink()` 返回的是 `Screen` 字符串，不是 `{ screen }` 对象；`main.ts` 里曾因此写到 `#/undefined`。
- `screen=deploy` 不带 `starters` 时应保持未选人；否则无法验证“选三人才能开战”。
- 布阵点选会同步重绘 DOM，自动化里必须一次点一个、等一帧再点下一个。
- `document.readyState === 'complete'` 会被大图 / 懒加载拖慢；等待具体选择器而不是死等 load。
- 卡面状态最多显示 4 个，其余折叠为 `＋N`；改这里同时跑 `tests/render.test.ts`。
- Windows 提交时 Git 的 LF→CRLF 提示正常，不是错误。
- 本项目为原创游戏，不提交第三方游戏包体、APK、账号数据库（见 `.gitignore`）。

## 视觉与交互基线

- 界面语言是“点将台 / 布阵 / 战场 / 图鉴 / 详报 / 结算”，保持文言、克制、低饱和金红配色。
- 主要交互必须可键盘操作；卡面有 `role`、`aria-label`，弹层要能 Esc 关闭。
- 武将主视觉优先用 `src/assets/portraits/` 的整幅水墨场景（640×915 WebP，满铺卡面）；缺图时才回落到 `src/assets/cards/` 透明立绘或 `src/assets/codex/` 古版画，再缺才用内置 SVG。新增场景图需同时跑 `tests/render.test.ts`，确保 60 人全覆盖。
- 原图 172MB 不进入仓库；只提交优化后的 WebP，来源与裁切参数写在 `src/assets/portraits/SOURCE.md`。右下角生成平台水印在优化时裁掉，公开发布前确认素材授权。
- 改完 UI 用 `web-design-engineer` / `frontend-design` 技能复核排版、溢出、对比度与窄屏。
