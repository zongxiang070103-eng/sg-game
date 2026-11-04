import { describe, expect, it } from 'vitest';
import { dummyVerify, hashPassword, verifyPassword } from '../server/password';
import {
  ValidationError,
  validateDisplayName,
  validateLoginPassword,
  validatePassword,
  validateUsername,
} from '../server/validation';

describe('账号校验与密码哈希', () => {
  it('用户名允许中文、字母、数字与下划线', () => {
    expect(validateUsername('曹孟德')).toBe('曹孟德');
    expect(validateUsername('player_01')).toBe('player_01');
    expect(() => validateUsername('ab')).toThrow(ValidationError);
    expect(() => validateUsername('has space')).toThrow(ValidationError);
    expect(() => validateUsername('bad!name')).toThrow(ValidationError);
  });

  it('密码长度受到限制', () => {
    expect(validatePassword('12345678')).toBe('12345678');
    expect(() => validatePassword('short')).toThrow(ValidationError);
    expect(() => validatePassword('x'.repeat(129))).toThrow(ValidationError);
  });

  it('昵称为空时回落到用户名，过长的昵称被拒绝', () => {
    expect(validateDisplayName('', '曹孟德')).toBe('曹孟德');
    expect(validateDisplayName('  孟德  ', 'x')).toBe('孟德');
    expect(() => validateDisplayName('x'.repeat(21), 'x')).toThrow(ValidationError);
  });

  it('登录密码只做长度兜底，不泄露注册规则', () => {
    expect(validateLoginPassword('short')).toBe('short');
    expect(() => validateLoginPassword('')).toThrow(ValidationError);
  });

  it('密码只保存加盐哈希，并能正确校验', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toContain('correct horse battery staple');
    expect(hash.startsWith('scrypt$')).toBe(true);

    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
    expect(await verifyPassword('correct horse battery staple', 'not-a-hash')).toBe(false);
  });

  it('两次哈希同一密码的盐不同', async () => {
    const a = await hashPassword('12345678');
    const b = await hashPassword('12345678');
    expect(a).not.toBe(b);
    expect(await verifyPassword('12345678', a)).toBe(true);
    expect(await verifyPassword('12345678', b)).toBe(true);
  });

  it('用户不存在时的兜底校验也会拒绝错误密码', async () => {
    expect(await dummyVerify('whatever')).toBe(false);
  });
});
