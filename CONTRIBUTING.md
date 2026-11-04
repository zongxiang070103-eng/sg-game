# 参与贡献

感谢你对「将星谱」的关注。本文说明如何搭建环境、提交改动、走分支与评审流程，以及提交前需要完成的检查。参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 开始之前

- 先读 [README.md](README.md) 了解玩法、规则与目录结构。
- 体系结构与模块边界见 [docs/架构说明.md](docs/架构说明.md)。
- 分支模型、合并策略与冲突处理见 [docs/分支管理.md](docs/分支管理.md)。
- 战略与产品分析见 [docs/五看三定.md](docs/五看三定.md)。
- 安全问题请不要公开提 Issue，按 [SECURITY.md](SECURITY.md) 私下报告。

## 环境要求

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| Node.js | 22 及以上（CI 使用 24） | 开发、测试、构建 |
| npm | 随 Node 附带 | 依赖管理 |
| Chrome 或 Edge | 近两年版本 | `npm run qa` 无头浏览器冒烟 |
| Git | 2.40 及以上 | 版本管理 |

```bash
git clone https://github.com/zongxiang070103-eng/sg-game_37.git
cd sg-game_37
npm ci
npm run dev        # http://localhost:5173
```

## 常用命令

```bash
npm run dev        # 开发服务器（/api 代理到 8787）
npm run typecheck  # TypeScript 类型检查
npm test           # 单元测试，45 项
npm run qa         # 无头浏览器冒烟 + 10 张截图（需 Chrome / Edge）
npm run build      # 类型检查 + 生产构建
npm run sim        # 双方 AI 跑 300 局，观察平衡
```

改 UI 时必须用真实浏览器验证，至少覆盖 `1440×900` 与 `390×844` 两个宽度，确认没有横向溢出、控制台错误和失败请求。`npm run qa` 会把截图与报告写到 `.qa/`，该目录不入库。

## 分支模型

`main` 始终保持可构建、可运行、测试通过。所有改动都从 `main` 切出短生命周期分支，通过 Pull Request 合并。

| 前缀 | 用途 | 示例 |
| --- | --- | --- |
| `feature/` | 新功能 | `feature/battle-replay` |
| `fix/` | 缺陷修复 | `fix/codex-search-empty` |
| `docs/` | 文档与注释 | `docs/contributing` |
| `refactor/` | 不改变行为的重构 | `refactor/core-events` |
| `chore/` | 构建、依赖、CI | `chore/node-24` |

- 分支名用小写英文与连字符，避免下划线和中文。
- 一个分支只做一件事；预计超过 400 行改动时先开 Issue 对齐方案。
- 从最新 `main` 切出，合并前先 `git fetch` 并同步。

```bash
git switch main
git pull --ff-only
git switch -c feature/battle-replay
```

## 提交信息

采用 Conventional Commits 的中文写法：

```
<type>(<scope>): <一句话说明>

<可选正文：为什么改、影响范围、验证方式>
```

`type` 使用 `feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `style` / `perf`。例如：

```
feat(battle): 支持战报逐回合回放

- 核心层新增回放事件流，不依赖 DOM
- 战场抽屉增加上一回合 / 下一回合
- 补充 3 条单元测试，npm test 48 项通过
```

不要在一个提交里混入无关的格式化改动。生成物（`dist/`、`.qa/`、`node_modules/`）和本地数据库不入库。

## Pull Request

1. 推送分支并在 GitHub 创建 PR，标题与提交信息保持同一风格。
2. 填写 PR 模板：改了什么、为什么、如何验证、关联 Issue。
3. 确认 CI 的 `typecheck`、`test`、`build` 全部通过。
4. 至少一位维护者 Approve；涉及规则或数值的改动需要说明平衡依据。
5. 使用 **Create a merge commit** 合并，保留分支历史；合并后删除远程分支。

评审关注点：

- `src/core/` 是否仍然不依赖 DOM，规则是否可单测。
- 数值与技能改动是否附模拟结果（`npm run sim`）或对局复盘。
- 新素材是否有明确许可，是否登记在对应的 `SOURCE.md`。
- 文案是否符合文言、克制、低饱和的界面语气。
- 移动端是否仍可操作，触控目标是否足够大。

## 冲突处理

合并 `main` 出现冲突时，不要直接丢弃任何一方的改动：

```bash
git fetch origin
git switch feature/your-branch
git merge origin/main
# 编辑冲突文件，保留双方意图，删除 <<<<<<< ======= >>>>>>>
git add <冲突文件>
git commit            # 完成合并提交
npm test && npm run typecheck
git push
```

无法判断如何合并时，在 PR 里说明两边的意图并请求维护者协助，不要用 `-X ours` / `-X theirs` 静默覆盖。

## 素材与许可

- 代码与文档以 [MIT](LICENSE) 发布；提交代码即表示你同意以 MIT 授权。
- 美术资源单独说明，见 [NOTICE](NOTICE)；`src/assets/portraits/` 不在 MIT 范围内。
- 新增图片、字体、音频必须写明来源、许可与处理方式，并在 `src/assets/*/SOURCE.md` 登记。
- 禁止提交商业游戏素材、来源不明的图片或去除授权水印后仍不允许再分发的资源。
- 引用第三方代码需保留原许可与版权声明，并在 PR 中说明。

## Issue

- 提 Issue 前先搜索是否已有相同问题。
- Bug 请附复现步骤、浏览器与系统版本、控制台报错、截图或 `.qa/report.json` 片段。
- 功能建议请说明使用场景与预期行为，而不是只写「加一个 XX」。
- 适合新贡献者的任务会标记 `good first issue`，欢迎认领并在 Issue 下留言。

## 行为准则

请保持专业、具体、对事不对人。骚扰、歧视、人身攻击、泄露他人隐私都会被处理，详见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
