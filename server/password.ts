/** 密码只保存 scrypt 加盐哈希，不保存明文。 */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // 只接受本项目生成的参数范围，避免异常数据拖垮进程。
  if (n !== N || r !== R || p !== P) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length !== KEYLEN) return false;

  const derived = await scryptAsync(password, salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** 用户不存在时也做一次同等开销的校验，减少通过响应时间枚举用户名的可能。 */
let dummyHashPromise: Promise<string> | null = null;
export function dummyVerify(password: string): Promise<boolean> {
  dummyHashPromise ??= hashPassword(randomBytes(18).toString('base64'));
  return dummyHashPromise.then((hash) => verifyPassword(password, hash));
}
