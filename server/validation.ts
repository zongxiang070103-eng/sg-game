/** 账号相关的输入校验。错误信息会直接展示给用户，因此保持中文、可读。 */
export class ValidationError extends Error {}

const USERNAME_RE = /^[\p{L}\p{N}_]{3,20}$/u;
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

export function validateUsername(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('请输入用户名');
  const username = raw.normalize('NFKC').trim();
  if (username.length < 3 || username.length > 20) {
    throw new ValidationError('用户名需为 3–20 个字符');
  }
  if (!USERNAME_RE.test(username)) {
    throw new ValidationError('用户名只能包含文字、字母、数字和下划线');
  }
  return username;
}

export function validatePassword(raw: unknown): string {
  if (typeof raw !== 'string') throw new ValidationError('请输入密码');
  if (raw.length < 8) throw new ValidationError('密码至少 8 位');
  if (raw.length > 128) throw new ValidationError('密码不能超过 128 位');
  return raw;
}

export function validateLoginPassword(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 128) {
    throw new ValidationError('用户名或密码不正确');
  }
  return raw;
}

export function validateDisplayName(raw: unknown, fallback: string): string {
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw !== 'string') throw new ValidationError('昵称格式不正确');
  const name = raw.normalize('NFKC').trim();
  if (name.length === 0) return fallback;
  if (name.length > 20) throw new ValidationError('昵称不能超过 20 个字符');
  if (CONTROL_RE.test(name)) throw new ValidationError('昵称包含不可见字符');
  return name;
}
