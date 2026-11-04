---
description: 运行无头浏览器冒烟检查并定位失败项
---

运行浏览器冒烟检查：

1. 执行 `npm run qa`（需要本机 Chrome / Edge；非标准路径先设 `CHROME_PATH`）。
2. 打开 `.qa/report.json`，先看 `ok`、`errors`、`failedRequests`，再看失败的 `checks`。
3. 按失败项查看对应截图（`home-1440.png`、`codex-1440.png`、`deploy-1440.png`、`battle-1440.png`、`detail-1440.png`、`result-1440.png`、`*-390.png`）。
4. 用一句话汇报：通过多少项、哪些失败、最可能的原因。
5. 如果失败与本次改动无关，指出是既有问题；不要为了“让 QA 变绿”而放宽检查阈值。

不要额外启动 Playwright / Puppeteer，也不要让浏览器跑完整战局；QA 已通过 `?screen=result&fast=1` 和 `debug.finish` 走捷径。
