/**
 * 账号服务：注册、登录、会话、资料与密码修改。
 *
 *   npm run server        默认 http://localhost:8787
 *
 * 开发时由 Vite 把 /api 反向代理到这里；生产时这个进程同时托管 dist/。
 */
import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import {
  createSession,
  createUser,
  db,
  deleteOtherSessions,
  deleteSession,
  findSessionUser,
  findUserById,
  findUserByUsername,
  hashToken,
  toPublicUser,
  touchLogin,
  updateDisplayName,
  updatePassword,
  type UserRow,
} from './db';
import { dummyVerify, hashPassword, verifyPassword } from './password';
import {
  ValidationError,
  validateDisplayName,
  validateLoginPassword,
  validatePassword,
  validateUsername,
} from './validation';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';
const DIST = resolve(process.cwd(), 'dist');
const SESSION_COOKIE = 'zq_session';
const SESSION_DAYS = 30;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
  headers: Record<string, string> = {},
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function sendNoContent(res: ServerResponse, headers: Record<string, string> = {}): void {
  res.writeHead(204, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end();
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const type = String(req.headers['content-type'] ?? '');
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, '请使用 JSON 格式提交');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > 16 * 1024) throw new HttpError(413, '请求内容过大');
    chunks.push(buf);
  }
  if (size === 0) throw new HttpError(400, '请求内容为空');
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, '请求内容不是合法 JSON');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, '请求内容格式不正确');
  }
  return value as Record<string, unknown>;
}

/* ---------------- Cookie 与会话 ---------------- */

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function isSecure(req: IncomingMessage): boolean {
  const socket = req.socket as { encrypted?: boolean };
  return (
    Boolean(socket.encrypted) ||
    String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() === 'https'
  );
}

function sessionCookie(req: IncomingMessage, token: string, maxAge: number): string {
  const secure = isSecure(req) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie(req: IncomingMessage): string {
  return sessionCookie(req, '', 0);
}

function sessionToken(req: IncomingMessage): string | undefined {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  return token || undefined;
}

function currentUser(req: IncomingMessage): UserRow | undefined {
  const token = sessionToken(req);
  if (!token) return undefined;
  return findSessionUser(hashToken(token));
}

function requireUser(req: IncomingMessage): UserRow {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, '请先登录');
  return user;
}

function startSession(userId: number): { token: string; maxAge: number } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  createSession(userId, hashToken(token), expiresAt);
  return { token, maxAge: SESSION_DAYS * 86_400 };
}

/* ---------------- 登录限流 ---------------- */

const attempts = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 8;
const WINDOW_MS = 10 * 60 * 1000;

function rateKey(req: IncomingMessage, username: string): string {
  return `${req.socket.remoteAddress ?? 'unknown'}|${username.toLowerCase()}`;
}

function rateLimited(key: string): number {
  const item = attempts.get(key);
  if (!item) return 0;
  if (item.resetAt <= Date.now()) {
    attempts.delete(key);
    return 0;
  }
  return item.count >= LIMIT ? Math.ceil((item.resetAt - Date.now()) / 1000) : 0;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const item = attempts.get(key);
  if (!item || item.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    item.count += 1;
  }
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
  }
}

function clearFailures(key: string): void {
  attempts.delete(key);
}

/* ---------------- 跨站请求防护 ---------------- */

const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function originAllowed(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '');
    if (host && parsed.host === host) return true;
    const local =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]';
    return process.env.NODE_ENV !== 'production' && local;
  } catch {
    return false;
  }
}

/* ---------------- 路由 ---------------- */

async function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
  const method = req.method ?? 'GET';

  if (method !== 'GET' && method !== 'HEAD' && !originAllowed(req)) {
    throw new HttpError(403, '请求来源不被允许');
  }

  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    const user = currentUser(req);
    if (!user) throw new HttpError(401, '未登录');
    sendJson(res, 200, { ok: true, user: toPublicUser(user) });
    return;
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await readJson(req);
    const username = validateUsername(body.username);
    const password = validatePassword(body.password);
    const displayName = validateDisplayName(body.displayName, username);
    if (findUserByUsername(username)) throw new HttpError(409, '用户名已被占用');

    const passwordHash = await hashPassword(password);
    let user: UserRow;
    try {
      user = createUser(username, displayName, passwordHash);
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed')) {
        throw new HttpError(409, '用户名已被占用');
      }
      throw error;
    }
    touchLogin(user.id);
    const session = startSession(user.id);
    res.setHeader('Set-Cookie', sessionCookie(req, session.token, session.maxAge));
    sendJson(res, 201, { ok: true, user: toPublicUser(findUserById(user.id)!) });
    return;
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await readJson(req);
    const rawUsername =
      typeof body.username === 'string' ? body.username.normalize('NFKC').trim() : '';
    const key = rateKey(req, rawUsername);
    const retryAfter = rateLimited(key);
    if (retryAfter > 0) {
      throw new HttpError(429, '尝试次数过多，请稍后再试', { 'Retry-After': String(retryAfter) });
    }

    let password: string;
    try {
      password = validateLoginPassword(body.password);
    } catch {
      recordFailure(key);
      throw new HttpError(401, '用户名或密码不正确');
    }
    const user = rawUsername ? findUserByUsername(rawUsername) : undefined;
    const valid = user
      ? await verifyPassword(password, user.password_hash)
      : await dummyVerify(password);
    if (!user || !valid) {
      recordFailure(key);
      throw new HttpError(401, '用户名或密码不正确');
    }

    clearFailures(key);
    touchLogin(user.id);
    const session = startSession(user.id);
    res.setHeader('Set-Cookie', sessionCookie(req, session.token, session.maxAge));
    sendJson(res, 200, { ok: true, user: toPublicUser(findUserById(user.id)!) });
    return;
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = sessionToken(req);
    if (token) deleteSession(hashToken(token));
    res.setHeader('Set-Cookie', clearSessionCookie(req));
    sendNoContent(res);
    return;
  }

  if (pathname === '/api/account' && method === 'PATCH') {
    const user = requireUser(req);
    const body = await readJson(req);
    const displayName = validateDisplayName(body.displayName, user.display_name);
    if (displayName !== user.display_name) updateDisplayName(user.id, displayName);
    sendJson(res, 200, { ok: true, user: toPublicUser(findUserById(user.id)!) });
    return;
  }

  if (pathname === '/api/account/password' && method === 'POST') {
    const user = requireUser(req);
    const body = await readJson(req);
    let currentPassword: string;
    try {
      currentPassword = validateLoginPassword(body.currentPassword);
    } catch {
      throw new HttpError(403, '当前密码不正确');
    }
    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      throw new HttpError(403, '当前密码不正确');
    }
    const nextPassword = validatePassword(body.newPassword);
    if (nextPassword === currentPassword) {
      throw new HttpError(400, '新密码不能与当前密码相同');
    }
    updatePassword(user.id, await hashPassword(nextPassword));
    const token = sessionToken(req);
    if (token) deleteOtherSessions(user.id, hashToken(token));
    sendJson(res, 200, { ok: true });
    return;
  }

  throw new HttpError(404, '接口不存在');
}

/* ---------------- 静态文件 ---------------- */

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json; charset=utf-8',
};

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { ok: false, error: '不支持的请求方法' });
    return;
  }
  if (!existsSync(DIST)) {
    sendJson(res, 503, { ok: false, error: '前端尚未构建，请先运行 npm run build' });
    return;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    sendJson(res, 400, { ok: false, error: '路径格式不正确' });
    return;
  }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = resolve(DIST, relative);
  if (resolved !== DIST && !resolved.startsWith(DIST + sep)) {
    sendJson(res, 403, { ok: false, error: '禁止访问' });
    return;
  }

  let file = resolved;
  if (!existsSync(file) || !statSync(file).isFile()) file = resolve(DIST, 'index.html');
  const ext = extname(file).toLowerCase();
  const isHtml = ext === '.html';
  const hashedAsset = relative.replace(/\\/g, '/').startsWith('assets/');

  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': String(statSync(file).size),
    'Cache-Control': hashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    ...(isHtml ? { 'Content-Security-Policy': CSP } : {}),
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

/* ---------------- 服务入口 ---------------- */

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
    } else {
      serveStatic(req, res, url.pathname);
    }
  } catch (error) {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (error instanceof HttpError) {
      sendJson(res, error.status, { ok: false, error: error.message }, error.headers);
    } else if (error instanceof ValidationError) {
      sendJson(res, 400, { ok: false, error: error.message });
    } else {
      console.error('[account]', error);
      sendJson(res, 500, { ok: false, error: '服务器内部错误' });
    }
  }
}

const server = createServer((req, res) => {
  void handle(req, res);
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`账号服务已启动：http://${displayHost}:${PORT}`);
  console.log(`数据库：${process.env.DB_PATH ?? 'server/data/accounts.db'}`);
});

function shutdown(): void {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
