/** 调试深链：让 QA 与协作者直接落到指定界面/战局，不必每次从头点。 */
import { deploy } from '../core/battle';
import type { BattleState, Outcome } from '../core/types';
import type { Screen } from './store';
import { app, FIELD_SIZE, newRun, playerSquad } from './store';
import { param, seedParam } from './url';

const SCREENS: Screen[] = ['home', 'deploy', 'battle', 'codex'];

function pickStarters(state: BattleState): string[] {
  const squad = playerSquad(state);
  const units = state.units.filter((u) => u.side === 'player');
  const byId = new Map<string, string>();
  for (const unit of units) {
    byId.set(unit.id, unit.id);
    byId.set(unit.generalId, unit.id);
  }

  const raw = param('starters');
  const picked = raw
    ? raw
        .split(',')
        .map((part) => byId.get(part.trim()))
        .filter((id): id is string => Boolean(id))
    : [];

  const unique = [...new Set(picked.length >= FIELD_SIZE ? picked : squad)];
  return unique.slice(0, FIELD_SIZE);
}

/**
 * 支持：
 *   ?screen=deploy&seed=42
 *   ?screen=battle&seed=42&starters=P0,P1,P2&fast=1
 *   ?screen=result&outcome=defeat&round=18&damage=880&fast=1
 */
export function applyDeepLink(): Screen | null {
  const requested = param('screen');
  if (!requested) return null;
  const screen: Screen = requested === 'result' ? 'battle' : (requested as Screen);
  if (!SCREENS.includes(screen)) return null;
  if (screen === 'home' || screen === 'codex') return screen;

  const state = newRun(seedParam() ?? undefined);
  if (screen === 'deploy') {
    app.starters = param('starters') ? pickStarters(state) : [];
    return 'deploy';
  }
  app.starters = pickStarters(state);

  app.battle = deploy(state, app.starters.slice());
  app.busy = false;

  if (requested === 'result' || param('outcome')) {
    const outcome: Outcome = param('outcome') === 'defeat' ? 'defeat' : 'victory';
    const round = Number(param('round') ?? 12);
    const damage = Number(param('damage') ?? 0);
    app.battle.phase = 'over';
    app.battle.outcome = outcome;
    app.battle.round = Number.isFinite(round) && round > 0 ? Math.trunc(round) : 12;
    app.damage = Number.isFinite(damage) && damage > 0 ? Math.trunc(damage) : 0;
  }

  return 'battle';
}
