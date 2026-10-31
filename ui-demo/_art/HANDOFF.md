# 图鉴角色立绘 · 交接说明（2026-11-01）

下次打开这个项目，从这里接着做。

## 目标（用户原话要点）

- 图鉴里的图不是古版画，而是**角色事件立绘**：像神赵云那样，画面本身在讲该角色在某个历史事件里的一刻。
- 画风 **二次元**（赛璐璐），57 位角色**统一画风**。
- 本轮只换图，不动界面结构。图鉴内容已于 2026-11-01 改成**游戏信息**（属性、战法、定位），见 `codex-roster.js`。
- 开源项目：不得使用《三国杀》/光荣特库摩等商业素材。

## 当前进度

已完成：

- 57 位角色的提示词表：`_art/gen-portraits.py`（`PROMPTS` 字典，`--list` 可打印）。
- 固定画风段 `STYLE`（中英双语：全身立绘、赛璐璐平涂、干净线稿、背景简洁、无文字/水印），每条提示词自动拼接，保证同一套视觉。
- 两个出图脚本：
  - `_art/gen-ark.py` —— 火山方舟 Doubao Seedream 5 Pro（**已选定渠道**，`ARK_API_KEY` 从环境变量读，不落盘）。
  - `_art/gen-portraits.py` —— 备用：Hugging Face FLUX 演示空间（免费额度极小，仅作备选）。
- 样张（`_art-review/`，已用资源管理器打开过）：
  - `style-04-diaochan-seedream.webp` —— 貂蝉，全身二次元，最接近目标方向。
  - `style-05-zhugeliang-seedream.webp` —— 诸葛亮，画质好但成了半身，且模型自己写了竹简文字；新 `STYLE` 已强化「从头到脚、无文字」。
  - `style-01..03` 是更早的 FLUX 试做，仅作对比。

**未完成（阻塞点）**：火山方舟账户欠费。第 3 张起返回
`HTTP 403 AccountOverdueError: your account has an overdue balance`。
`doubao-seedream-5-0-pro-260628` 已开通；`doubao-seedream-5-0-flash-260915` 显示未开通（ModelNotOpen）。

## 下次继续的步骤

1. 充值（或换一个有余额的 key）。key 只放环境变量，**不要写进仓库**：
   ```bash
   export ARK_API_KEY=...            # 或从 ~/.claude/keys/ 之类的仓库外文件读取
   ```
2. 先出一张验证画风与全身构图：
   ```bash
   cd anqi/ui-demo
   python -I _art/gen-ark.py --only guanyu
   ```
   看 `_art/out/guanyu.webp`：是否全身、甲胄/兵器是否符合汉末三国、有无乱码文字、与貂蝉样张是否同一画风。
   不合格就调 `_art/gen-portraits.py` 里的 `STYLE` 或该角色提示词，用 `--force` 重出。
3. 全量生成（已存在的会跳过，约 50 秒/张，57 张约 45–55 分钟）：
   ```bash
   python -I _art/gen-ark.py
   python -I _art/gen-ark.py --only caocao,guanyu --force    # 单张重出
   ```
4. 复核：拼一张 contact sheet 逐张看（武器、服饰、构图、文字、是否同一画风），列出问题 id 后批量重出。
5. 接入图鉴（只换图）：
   - 图片放 `assets/codex/portrait/<id>.webp`（864×1152，3:4）。
   - 改 `codex.js` 的 `PLATE_OVERRIDES`：改成 `portrait/<id>.webp`，`color: true`，去掉 `fit: 'print'`（不再做版画纸色叠加）。
   - 图注：卡片/册页的「清刻 / 公有领域」改为「角色立绘 · AI 生成」。
   - 人物页原来解释古版画事件的段落已随 `event` / `eventText` 字段移除；册页题签现在取称号与势力，不需要再改正文。
   - `index.html` 图鉴说明与 `assets/codex/SOURCE.md` 里仍写「公有领域古版画」的地方同步改成立绘说明。
6. 文档同步：`README.md`、`DESIGN.md`、`assets/codex/SOURCE.md` 里 57 张古版画的说明改为立绘 + AI 生成说明；注明 Seedream 生成、不冒充古画。
7. 验证：`file://` 直接打开，确认 57 张全部加载、无 404、无横向溢出（1440/1024/760/390），详情翻页与 `Esc` 正常。

## 目录

```text
ui-demo/
  _art/
    HANDOFF.md          本文件
    README.md           生成流程与画风约束
    gen-portraits.py    57 条提示词 + 固定 STYLE + FLUX 备用后端
    gen-ark.py          Seedream/Ark 批量出图（读 ARK_API_KEY）
    out/                生成结果 <id>.webp + manifest.json（模型、种子、提示词）
  _art-review/          样张，评审用
```

## 注意事项

- 现有 `assets/codex/*.webp` 仍是 57 张公有领域古版画，**尚未替换**；当前界面看起来和之前一样。
- 图鉴面板已完成：图鉴收录的 17 名演武场武将取 `data/generals.json`、`skills.json` 原值，其余 40 人在 `codex-roster.js` 中按同一区间补齐；换立绘不影响这套数据。
- AI 生成图用于开源项目时，建议在 `SOURCE.md` 写明由 Seedream 生成、生成日期与提示词来源，并提醒发布前按所用模型的商用条款复核。
- key 曾在对话里出现过；若会话记录会分享，重置一次。
