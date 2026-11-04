/** 账号接口客户端。网页端走 HttpOnly Cookie；APK 内使用设备本地存储。 */
import { Capacitor } from '@capacitor/core';

export const isNativeAccount = Capacitor.isNativePlatform();

export interface AccountUser {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ApiSuccess {
  ok: true;
  user?: AccountUser;
}

interface ApiFailure {
  ok: false;
  error?: string;
}

export class AccountError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AccountError('无法连接账号服务，请确认已运行 npm run server', 0);
  }

  if (response.status === 204) return undefined as T;

  let data: ApiSuccess | ApiFailure | null = null;
  try {
    data = (await response.json()) as ApiSuccess | ApiFailure;
  } catch {
    // 非 JSON 响应（例如静态托管下的 404 页面）按服务不可用处理。
  }

  if (!response.ok || !data || data.ok !== true) {
    const message =
      data && data.ok === false && data.error
        ? data.error
        : response.status === 404
          ? '账号服务未启动'
          : `请求失败（${response.status}）`;
    throw new AccountError(message, response.status);
  }
  return data as T;
}

const httpAccountApi = {
  me: () => request<ApiSuccess>('/auth/me'),
  login: (username: string, password: string) =>
    request<ApiSuccess>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string, displayName: string) =>
    request<ApiSuccess>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  updateDisplayName: (displayName: string) =>
    request<ApiSuccess>('/account', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<ApiSuccess>('/account/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

/* ---------- APK：设备本地账号 ---------- */

const LOCAL_KEY = 'zhanqi.accounts.v1';
const PBKDF2_ITERATIONS = 210_000;
const USERNAME_RE = /^[\p{L}\p{N}_]{3,20}$/u;

interface StoredAccount {
  id: number;
  username: string;
  displayName: string;
  salt: string;
  hash: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface LocalStore {
  nextId: number;
  currentId: number | null;
  users: StoredAccount[];
}

function loadLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { nextId: 1, currentId: null, users: [] };
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    if (!parsed || !Array.isArray(parsed.users)) throw new Error('bad store');
    return {
      nextId: typeof parsed.nextId === 'number' ? parsed.nextId : parsed.users.length + 1,
      currentId: typeof parsed.currentId === 'number' ? parsed.currentId : null,
      users: parsed.users as StoredAccount[],
    };
  } catch {
    return { nextId: 1, currentId: null, users: [] };
  }
}

function saveLocalStore(store: LocalStore): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

function toPublicUser(user: StoredAccount): AccountUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function normalizeUsername(raw: string): string {
  const value = raw.normalize('NFKC').trim();
  if (!USERNAME_RE.test(value)) {
    throw new AccountError('用户名需为 3–20 位中文、字母、数字或下划线', 400);
  }
  return value;
}

function normalizeDisplayName(raw: string, fallback: string): string {
  const value = raw.trim();
  if (!value) return fallback;
  if (value.length > 20) throw new AccountError('昵称最多 20 个字符', 400);
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new AccountError('昵称包含不可用字符', 400);
  return value;
}

function normalizePassword(raw: string): string {
  if (raw.length < 8 || raw.length > 128) {
    throw new AccountError('密码需为 8–128 位', 400);
  }
  return raw;
}

function normalizeLoginPassword(raw: string): string {
  if (!raw || raw.length > 128) throw new AccountError('请输入密码', 400);
  return raw;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

async function derivePassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64ToBytes(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function currentAccount(store: LocalStore): StoredAccount {
  const user = store.users.find((candidate) => candidate.id === store.currentId);
  if (!user) throw new AccountError('登录已失效，请重新登录', 401);
  return user;
}

const localAccountApi = {
  async me(): Promise<ApiSuccess> {
    const store = loadLocalStore();
    return { ok: true, user: toPublicUser(currentAccount(store)) };
  },

  async login(username: string, password: string): Promise<ApiSuccess> {
    const name = username.normalize('NFKC').trim();
    const secret = normalizeLoginPassword(password);
    const store = loadLocalStore();
    const user = store.users.find(
      (candidate) => candidate.username.toLowerCase() === name.toLowerCase(),
    );
    if (!user) {
      await derivePassword(secret, randomSalt());
      throw new AccountError('用户名或密码不正确', 401);
    }
    const hash = await derivePassword(secret, user.salt);
    if (!sameHash(hash, user.hash)) throw new AccountError('用户名或密码不正确', 401);
    user.lastLoginAt = new Date().toISOString();
    store.currentId = user.id;
    saveLocalStore(store);
    return { ok: true, user: toPublicUser(user) };
  },

  async register(username: string, password: string, displayName: string): Promise<ApiSuccess> {
    const name = normalizeUsername(username);
    const secret = normalizePassword(password);
    const display = normalizeDisplayName(displayName, name);
    const store = loadLocalStore();
    if (store.users.some((candidate) => candidate.username.toLowerCase() === name.toLowerCase())) {
      throw new AccountError('这个用户名已被注册', 409);
    }
    const salt = randomSalt();
    const now = new Date().toISOString();
    const user: StoredAccount = {
      id: store.nextId,
      username: name,
      displayName: display,
      salt,
      hash: await derivePassword(secret, salt),
      createdAt: now,
      lastLoginAt: now,
    };
    store.nextId += 1;
    store.currentId = user.id;
    store.users.push(user);
    saveLocalStore(store);
    return { ok: true, user: toPublicUser(user) };
  },

  async logout(): Promise<void> {
    const store = loadLocalStore();
    store.currentId = null;
    saveLocalStore(store);
  },

  async updateDisplayName(displayName: string): Promise<ApiSuccess> {
    const store = loadLocalStore();
    const user = currentAccount(store);
    user.displayName = normalizeDisplayName(displayName, user.username);
    saveLocalStore(store);
    return { ok: true, user: toPublicUser(user) };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiSuccess> {
    const store = loadLocalStore();
    const user = currentAccount(store);
    const currentHash = await derivePassword(normalizeLoginPassword(currentPassword), user.salt);
    if (!sameHash(currentHash, user.hash)) {
      throw new AccountError('当前密码不正确', 403);
    }
    const secret = normalizePassword(newPassword);
    user.salt = randomSalt();
    user.hash = await derivePassword(secret, user.salt);
    saveLocalStore(store);
    return { ok: true, user: toPublicUser(user) };
  },
};

export const accountApi = isNativeAccount ? localAccountApi : httpAccountApi;

export type { ApiSuccess };
