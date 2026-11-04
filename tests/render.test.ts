import { describe, expect, it } from 'vitest';
import { GENERAL_BY_ID, GENERALS, SKILL_BY_ID } from '../src/core/data';
import type { Status } from '../src/core/types';
import { detailHTML, statusTagsHTML, viewOfGeneral } from '../src/web/cards';

function status(kind: Status['kind'], label: string, extra: Partial<Status> = {}): Status {
  return { kind, label, turns: 2, appliedAt: 0, ...extra };
}

describe('卡面状态标签', () => {
  const base = viewOfGeneral(GENERAL_BY_ID.guanyu);

  it('最多展示 4 个，其余折叠为 ＋N', () => {
    const html = statusTagsHTML({
      ...base,
      statuses: [
        status('shield', '护盾', { amount: 24 }),
        status('burn', '灼烧', { amount: 9 }),
        status('poison', '中毒', { amount: 7 }),
        status('silence', '沉默'),
        status('stun', '眩晕'),
        status('vulnerable', '易伤', { pct: 0.2 }),
      ],
    });
    expect((html.match(/class="tag /g) ?? []).length).toBe(5);
    expect(html).toContain('盾 24');
    expect(html).toContain('灼 9');
    expect(html).toContain('毒 7');
    expect(html).toContain('＋2');
    expect(html).toContain('眩晕，跳过行动（2 回合）');
    expect(html).toContain('易伤，受到伤害 +20%（2 回合）');
  });

  it('没有状态时不渲染空容器', () => {
    expect(statusTagsHTML(base)).toBe('');
  });

  it('减益标签带 is-bad 标记', () => {
    const html = statusTagsHTML({ ...base, statuses: [status('silence', '沉默')] });
    expect(html).toContain('is-bad');
    expect(html).not.toContain('＋');
  });
});

describe('武将详报', () => {
  it('六十名武将都渲染五维、两个战法与一个天赋', () => {
    expect(GENERALS).toHaveLength(60);
    for (const general of GENERALS) {
      const html = detailHTML(general);
      expect((html.match(/<dt>/g) ?? []).length, `${general.name} 五维`).toBe(5);
      expect(
        (html.match(/class="detail-skill(?: is-talent)?"/g) ?? []).length,
        `${general.name} 技能条目`,
      ).toBe(3);
      expect((html.match(/is-talent/g) ?? []).length, `${general.name} 天赋条目`).toBe(1);

      for (const id of [...general.skills, ...(general.talents ?? [])]) {
        const skill = SKILL_BY_ID[id];
        expect(skill, `${general.name} 引用了不存在的技能 ${id}`).toBeTruthy();
        expect(html).toContain(skill.name);
      }
    }
  });

  it('详报卡面不可点击，避免嵌套交互', () => {
    const html = detailHTML(GENERAL_BY_ID.guanyu);
    expect(html).toContain('role="img"');
    expect(html).not.toContain('role="button"');
  });
});
