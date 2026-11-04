#!/usr/bin/env node
/**
 * 将星谱浏览器冒烟检查。
 *
 * 不依赖 Playwright / Puppeteer：
 *   - 用 Vite 的 Node API 起一个临时开发服务器；
 *   - 用本机 Chrome / Edge 的 DevTools 协议驱动无头浏览器；
 *   - 借助 ?screen=&fast=1 深链直接进入目标界面，几秒内跑完四个屏幕；
 *   - 截图和报告写到 .qa/（已 gitignore）。
 *
 * 用法：
 *   npm run qa
 *   CHROME_PATH="C:\\path\\to\\chrome.exe" npm run qa
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.qa');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------------- 浏览器与端口 ---------------- */

function findChrome() {
  const local = process.env.LOCALAPPDATA ?? '';
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/microsoft-edge',
  ];
  return candidates.find((file) => file && existsSync(file)) ?? null;
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForDevtools(profile) {
  const file = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150; i += 1) {
    try {
      const [first] = (await fs.readFile(file, 'utf8')).split('\n');
      const port = Number(first);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {
      /* Chrome 还没写好端口文件 */
    }
    await sleep(100);
  }
  throw new Error('启动 Chrome 后 15 秒内没有读到 DevToolsActivePort');
}

/* ---------------- 极简 CDP 客户端 ---------------- */

async function connectCDP(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const listeners = new Set();
  let seq = 0;

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error(`无法连接 CDP：${url}`)), { once: true });
  });

  ws.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    for (const fn of listeners) fn(message);
  });

  function send(method, params = {}) {
    seq += 1;
    const id = seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP 超时：${method}`));
      }, 20_000);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  return {
    send,
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close() {
      ws.close();
    },
  };
}

/* ---------------- 运行 ---------------- */

const chromePath = findChrome();
if (!chromePath) {
  console.error('找不到 Chrome / Edge。请设置 CHROME_PATH 指向浏览器可执行文件。');
  process.exit(1);
}

if (typeof WebSocket !== 'function') {
  console.error(`当前 Node ${process.version} 没有内置 WebSocket，请使用 Node 22+。`);
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });

const checks = [];
const errors = [];
const failedRequests = [];
let scenario = 'boot';

function check(label, ok, detail = '') {
  checks.push({ label, ok: Boolean(ok), detail });
  if (ok) process.stdout.write('.');
  else process.stdout.write(`\n  ✗ ${label}${detail ? ` — ${detail}` : ''}\n`);
}

const port = await freePort();
const server = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, 'vite.config.ts'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
await server.listen();
const base = `http://127.0.0.1:${port}/`;

const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'jiangxing-qa-'));
const chromeArgs = [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-sync',
  '--metrics-recording-only',
  '--mute-audio',
  '--hide-scrollbars',
  '--window-size=1440,900',
  'about:blank',
];
if (process.platform === 'linux') chromeArgs.unshift('--no-sandbox');

const chrome = spawn(chromePath, chromeArgs, { stdio: 'ignore' });
let cdp;
let browserPort;

try {
  browserPort = await waitForDevtools(profile);
  const targets = await (await fetch(`http://127.0.0.1:${browserPort}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('Chrome 没有可用的页面目标');
  cdp = await connectCDP(page.webSocketDebuggerUrl);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');

  const requestUrls = new Map();
  cdp.on((message) => {
    if (message.method === 'Network.requestWillBeSent') {
      requestUrls.set(message.params.requestId, message.params.request.url);
      return;
    }
    if (message.method === 'Network.responseReceived') {
      const { response } = message.params;
      if (response.status >= 400 && !response.url.startsWith('data:')) {
        failedRequests.push({ scenario, status: response.status, url: response.url });
      }
      return;
    }
    if (message.method === 'Network.loadingFailed') {
      const { requestId, errorText, canceled } = message.params;
      if (canceled || errorText === 'net::ERR_ABORTED') return;
      failedRequests.push({ scenario, status: 0, url: requestUrls.get(requestId) ?? '', error: errorText });
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      errors.push({
        scenario,
        kind: 'exception',
        text: detail.exception?.description ?? detail.text,
      });
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push({
        scenario,
        kind: 'console',
        text: message.params.args
          .map((arg) => arg.value ?? arg.description ?? '')
          .join(' '),
      });
      return;
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push({ scenario, kind: 'log', text: message.params.entry.text });
    }
  });

  async function evaluate(expression) {
    const result = await cdp.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  }

  async function waitFor(expression, timeout = 12_000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      try {
        if (await evaluate(expression)) return true;
      } catch {
        /* 页面切换中，下一轮再试 */
      }
      await sleep(80);
    }
    return false;
  }

  async function go(query, width, height, label) {
    scenario = label;
    const errorStart = errors.length;
    const requestStart = failedRequests.length;
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
      screenWidth: width,
      screenHeight: height,
    });
    await cdp.send('Page.navigate', { url: `${base}?${query}` });
    const ready = await waitFor(
      `document.readyState === 'complete' && Boolean(document.querySelector('.screen.is-active'))`,
    );
    check(`${label}：页面加载并渲染`, ready);
    await evaluate('document.fonts.ready.then(() => true)').catch(() => undefined);
    await sleep(180);
    return { errorStart, requestStart };
  }

  function checkErrors(label, errorStart, requestStart) {
    const pageErrors = errors.slice(errorStart);
    const badRequests = failedRequests.slice(requestStart);
    check(
      `${label}：无控制台错误`,
      pageErrors.length === 0,
      pageErrors.map((item) => item.text).join(' | ').slice(0, 500),
    );
    check(
      `${label}：无失败请求`,
      badRequests.length === 0,
      badRequests.map((item) => `${item.status || item.error} ${item.url}`).join(' | ').slice(0, 500),
    );
  }

  async function shot(name) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await fs.writeFile(path.join(OUT, name), Buffer.from(data, 'base64'));
  }

  const noOverflow = `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`;
  const screenInfo = (id) => `(() => {
    const active = document.querySelector('.screen.is-active');
    return {
      active: active?.id ?? '',
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      activeCount: document.querySelectorAll('.screen.is-active').length,
      expected: ${JSON.stringify(id)},
    };
  })()`;

  /* ---------- 桌面：点将台 ---------- */
  {
    const marks = await go('screen=home', 1440, 900, '桌面·点将台');
    const info = await evaluate(`(() => {
      const grid = document.querySelectorAll('#roster-grid .card').length;
      const feature = document.querySelectorAll('#feature-card .card').length;
      return { ...${screenInfo('screen-home')}, grid, feature };
    })()`);
    check('桌面·点将台：激活首页', info.activeCount === 1 && info.active === 'screen-home', info.active);
    check('桌面·点将台：点将列 6 张卡', info.grid === 6, `实际 ${info.grid}`);
    check('桌面·点将台：主将卡存在', info.feature === 1, `实际 ${info.feature}`);
    check('桌面·点将台：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('home-1440.png');
    checkErrors('桌面·点将台', marks.errorStart, marks.requestStart);
  }

  /* ---------- 桌面：图鉴 ---------- */
  {
    const marks = await go('screen=codex', 1440, 900, '桌面·图鉴');
    const loaded = await waitFor(`document.querySelectorAll('#cx-char-groups .card').length === 60`);
    const info = await evaluate(`(() => ({
      ...${screenInfo('screen-codex')},
      cards: document.querySelectorAll('#cx-char-groups .card').length,
      groups: document.querySelectorAll('.cx-group').length,
      total: document.querySelector('#cx-total')?.textContent?.trim() ?? '',
    }))()`);
    check('桌面·图鉴：加载 60 名武将', loaded && info.cards === 60, `实际 ${info.cards}`);
    check('桌面·图鉴：按四势力分组', info.groups === 4, `实际 ${info.groups}`);
    check('桌面·图鉴：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('codex-1440.png');

    await evaluate(`(() => {
      const input = document.querySelector('#cx-search');
      input.value = '关羽';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    const searched = await waitFor(
      `document.querySelectorAll('#cx-char-groups .card').length > 0 && document.querySelectorAll('#cx-char-groups .card').length < 60`,
    );
    const found = await evaluate(`(() => {
      const cards = [...document.querySelectorAll('#cx-char-groups .card')];
      return { count: cards.length, names: cards.map((card) => card.getAttribute('aria-label') ?? '').join('|') };
    })()`);
    check('桌面·图鉴：搜索“关羽”可筛选', searched && found.count > 0, `实际 ${found.count}`);
    check('桌面·图鉴：搜索结果包含关羽', found.names.includes('关羽'), found.names.slice(0, 80));
    checkErrors('桌面·图鉴', marks.errorStart, marks.requestStart);
  }

  /* ---------- 桌面：布阵 ---------- */
  {
    const marks = await go('screen=deploy&seed=42&fast=1', 1440, 900, '桌面·布阵');
    const loaded = await waitFor(`document.querySelectorAll('.deploy-slot').length === 10`);
    let info = await evaluate(`(() => ({
      ...${screenInfo('screen-deploy')},
      slots: document.querySelectorAll('.deploy-slot').length,
      picked: document.querySelectorAll('.deploy-slot.is-picked').length,
      disabled: document.querySelector('#deploy-start')?.disabled,
    }))()`);
    check('桌面·布阵：十人可选', loaded && info.slots === 10, `实际 ${info.slots}`);
    check('桌面·布阵：初始未选人', info.picked === 0, `实际 ${info.picked}`);
    check('桌面·布阵：未满三人时开战禁用', info.disabled === true);
    for (let i = 0; i < 3; i += 1) {
      await evaluate(`document.querySelector('.deploy-slot:not(.is-picked)')?.click()`);
      await sleep(90);
    }
    info = await evaluate(`(() => ({
      ...${screenInfo('screen-deploy')},
      picked: document.querySelectorAll('.deploy-slot.is-picked').length,
      disabled: document.querySelector('#deploy-start')?.disabled,
      count: document.querySelector('#deploy-count')?.textContent?.trim() ?? '',
    }))()`);
    check('桌面·布阵：点选三名首发', info.picked === 3 && info.count === '3', `实际 ${info.picked}/${info.count}`);
    check('桌面·布阵：满三人后开战可用', info.disabled === false);
    check('桌面·布阵：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('deploy-1440.png');
    checkErrors('桌面·布阵', marks.errorStart, marks.requestStart);
  }

  /* ---------- 桌面：战场 + 调试结算 ---------- */
  {
    const marks = await go(
      'screen=battle&seed=42&starters=P0,P1,P2&fast=1',
      1440,
      900,
      '桌面·战场',
    );
    const loaded = await waitFor(`document.querySelectorAll('#ally-team .card-slot').length === 3`);
    const info = await evaluate(`(() => {
      const bar = document.querySelector('#action-bar')?.getBoundingClientRect();
      return {
        ...${screenInfo('screen-battle')},
        ally: document.querySelectorAll('#ally-team .card-slot').length,
        enemy: document.querySelectorAll('#enemy-team .card-slot').length,
        allyBench: document.querySelectorAll('#ally-bench .bench-slot').length,
        enemyBench: document.querySelectorAll('#enemy-bench .bench-slot').length,
        actions: document.querySelectorAll('#action-bar .action').length,
        barBottom: bar ? Math.round(bar.bottom) : -1,
        innerHeight: window.innerHeight,
      };
    })()`);
    check('桌面·战场：双方各三名上场', loaded && info.ally === 3 && info.enemy === 3, `${info.ally} vs ${info.enemy}`);
    check('桌面·战场：双方各七名后援', info.allyBench === 7 && info.enemyBench === 7, `${info.allyBench}/${info.enemyBench}`);
    check('桌面·战场：军令栏渲染', info.actions >= 3, `实际 ${info.actions}`);
    check('桌面·战场：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    check('桌面·战场：军令栏在视口内', info.barBottom <= info.innerHeight + 1, `bottom ${info.barBottom} / ${info.innerHeight}`);
    await shot('battle-1440.png');

    await evaluate(`window.jiangxing.debug.finish('victory', 9, 777)`);
    const resultReady = await waitFor(`!document.querySelector('#result')?.hidden`);
    const result = await evaluate(`(() => {
      const poster = document.querySelector('.result-poster')?.getBoundingClientRect();
      return {
        stamp: document.querySelector('#result-stamp')?.textContent?.trim() ?? '',
        round: document.querySelector('#result-round')?.textContent?.trim() ?? '',
        damage: document.querySelector('#result-damage')?.textContent?.trim() ?? '',
        poster: poster ? { top: Math.round(poster.top), left: Math.round(poster.left), bottom: Math.round(poster.bottom), right: Math.round(poster.right) } : null,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      };
    })()`);
    check('桌面·结算：debug.finish 打开结算', resultReady);
    check('桌面·结算：胜利文案正确', result.stamp === '大捷', result.stamp);
    check('桌面·结算：回合与伤害传入', result.round === '9' && result.damage === '777', `${result.round}/${result.damage}`);
    check(
      '桌面·结算：结算海报在视口内',
      Boolean(result.poster) &&
        result.poster.top >= -1 &&
        result.poster.left >= -1 &&
        result.poster.bottom <= result.innerHeight + 1 &&
        result.poster.right <= result.innerWidth + 1,
      JSON.stringify(result.poster),
    );
    await shot('result-1440.png');
    checkErrors('桌面·战场与结算', marks.errorStart, marks.requestStart);
  }

  /* ---------- 窄屏：点将台 ---------- */
  {
    const marks = await go('screen=home', 390, 844, '窄屏·点将台');
    const info = await evaluate(`(() => ({
      ...${screenInfo('screen-home')},
      grid: document.querySelectorAll('#roster-grid .card').length,
      bodyWidth: document.body.getBoundingClientRect().width,
    }))()`);
    check('窄屏·点将台：激活首页', info.active === 'screen-home', info.active);
    check('窄屏·点将台：点将列渲染', info.grid === 6, `实际 ${info.grid}`);
    check('窄屏·点将台：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('home-390.png');
    checkErrors('窄屏·点将台', marks.errorStart, marks.requestStart);
  }

  /* ---------- 窄屏：图鉴 ---------- */
  {
    const marks = await go('screen=codex', 390, 844, '窄屏·图鉴');
    const loaded = await waitFor(`document.querySelectorAll('#cx-char-groups .card').length === 60`);
    const info = await evaluate(`(() => {
      const card = document.querySelector('#cx-char-groups .card')?.getBoundingClientRect();
      return {
        ...${screenInfo('screen-codex')},
        cards: document.querySelectorAll('#cx-char-groups .card').length,
        cardWidth: card ? Math.round(card.width) : -1,
      };
    })()`);
    check('窄屏·图鉴：加载 60 名武将', loaded && info.cards === 60, `实际 ${info.cards}`);
    check('窄屏·图鉴：卡面为双列宽度', info.cardWidth > 120 && info.cardWidth < 200, `卡宽 ${info.cardWidth}`);
    check('窄屏·图鉴：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('codex-390.png');
    checkErrors('窄屏·图鉴', marks.errorStart, marks.requestStart);
  }

  /* ---------- 窄屏：战场 ---------- */
  {
    const marks = await go(
      'screen=battle&seed=42&starters=P0,P1,P2&fast=1',
      390,
      844,
      '窄屏·战场',
    );
    const loaded = await waitFor(`document.querySelectorAll('#ally-team .card-slot').length === 3`);
    const info = await evaluate(`(() => {
      const bar = document.querySelector('#action-bar')?.getBoundingClientRect();
      return {
        ...${screenInfo('screen-battle')},
        ally: document.querySelectorAll('#ally-team .card-slot').length,
        bench: document.querySelectorAll('#ally-bench .bench-slot').length,
        actions: document.querySelectorAll('#action-bar .action').length,
        barBottom: bar ? Math.round(bar.bottom) : -1,
        innerHeight: window.innerHeight,
      };
    })()`);
    check('窄屏·战场：三名上场七名后援', loaded && info.ally === 3 && info.bench === 7, `${info.ally}/${info.bench}`);
    check('窄屏·战场：军令栏渲染', info.actions >= 3, `实际 ${info.actions}`);
    check('窄屏·战场：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    check('窄屏·战场：军令栏在视口内', info.barBottom <= info.innerHeight + 1, `bottom ${info.barBottom} / ${info.innerHeight}`);
    await shot('battle-390.png');
    checkErrors('窄屏·战场', marks.errorStart, marks.requestStart);
  }

  /* ---------- 窄屏：结算深链 ---------- */
  {
    const marks = await go(
      'screen=result&seed=7&outcome=victory&round=9&damage=1234&fast=1',
      390,
      844,
      '窄屏·结算',
    );
    const ready = await waitFor(`!document.querySelector('#result')?.hidden`);
    const info = await evaluate(`(() => {
      const poster = document.querySelector('.result-poster')?.getBoundingClientRect();
      return {
        ...${screenInfo('screen-battle')},
        stamp: document.querySelector('#result-stamp')?.textContent?.trim() ?? '',
        round: document.querySelector('#result-round')?.textContent?.trim() ?? '',
        damage: document.querySelector('#result-damage')?.textContent?.trim() ?? '',
        note: document.querySelector('#result-note')?.textContent?.trim() ?? '',
        poster: poster ? { top: Math.round(poster.top), left: Math.round(poster.left), bottom: Math.round(poster.bottom), right: Math.round(poster.right) } : null,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        locked: document.body.classList.contains('is-locked'),
      };
    })()`);
    check('窄屏·结算：结果深链自动弹出结算', ready);
    check('窄屏·结算：胜利文案正确', info.stamp === '大捷', info.stamp);
    check('窄屏·结算：回合与伤害传入', info.round === '9' && info.damage === '1234', `${info.round}/${info.damage}`);
    check(
      '窄屏·结算：海报在视口内',
      Boolean(info.poster) &&
        info.poster.top >= -1 &&
        info.poster.left >= -1 &&
        info.poster.bottom <= info.innerHeight + 1 &&
        info.poster.right <= info.innerWidth + 1,
      JSON.stringify(info.poster),
    );
    check('窄屏·结算：背景滚动锁定', info.locked);
    check('窄屏·结算：无横向溢出', info.overflowX <= 1, `溢出 ${info.overflowX}px`);
    await shot('result-390.png');
    checkErrors('窄屏·结算', marks.errorStart, marks.requestStart);
  }

  const failed = checks.filter((item) => !item.ok);
  const report = {
    ok: failed.length === 0 && errors.length === 0 && failedRequests.length === 0,
    at: new Date().toISOString(),
    base,
    chrome: chromePath,
    viewportNote: 'desktop 1440x900, mobile 390x844; deviceScaleFactor=1',
    checks,
    errors,
    failedRequests,
  };
  await fs.writeFile(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

  console.log('\n');
  if (errors.length) {
    console.log(`控制台错误 ${errors.length} 条：`);
    for (const item of errors) console.log(`  [${item.scenario}] ${item.text}`);
  }
  if (failedRequests.length) {
    console.log(`失败请求 ${failedRequests.length} 条：`);
    for (const item of failedRequests) console.log(`  [${item.scenario}] ${item.status || item.error} ${item.url}`);
  }
  console.log(`截图与报告：${path.join(OUT, 'report.json')}`);
  console.log(
    `${report.ok ? '✓ QA 通过' : '✗ QA 未通过'} — ${checks.length - failed.length}/${checks.length} 项检查通过，截图 9 张。`,
  );

  if (!report.ok) process.exitCode = 1;
} catch (error) {
  console.error('\nQA 运行失败：', error);
  process.exitCode = 1;
} finally {
  try {
    cdp?.close();
  } catch {
    /* ignore */
  }
  chrome.kill();
  await sleep(250);
  await server.close();
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => undefined);
}
