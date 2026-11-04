/** URL 参数：同时支持普通查询串和 hash 查询串。 */
const search = new URLSearchParams(location.search);
const hashQuery = new URLSearchParams(location.hash.split('?')[1] ?? '');

export function param(name: string): string | null {
  return hashQuery.get(name) ?? search.get(name);
}

export function hasParam(name: string): boolean {
  return hashQuery.has(name) || search.has(name);
}

/** `?fast=1` 或 `?fast` 关闭动画等待，供自动化测试与快速调试。 */
export function fastMode(): boolean {
  if (!hasParam('fast')) return false;
  const value = param('fast');
  return value === null || value === '' || value === '1' || value === 'true';
}

/** 可分享的固定战局种子。 */
export function seedParam(): number | null {
  const raw = param('seed');
  if (raw === null || raw.trim() === '') return null;
  const seed = Number(raw);
  return Number.isFinite(seed) && seed >= 0 ? Math.trunc(seed) >>> 0 : null;
}
