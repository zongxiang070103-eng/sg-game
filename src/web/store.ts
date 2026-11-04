/** 前端的全部可变状态。视图只读，动作只从 main.ts 进来。 */
import { createBattle } from '../core/battle';
import { CONFIG } from '../core/config';
import { GENERAL_BY_ID, GENERALS } from '../core/data';
import type { BattleState, Faction, GeneralDef } from '../core/types';

export type Screen = 'home' | 'deploy' | 'battle' | 'codex';
export type FactionFilter = 'all' | Faction;

export interface AppState {
  screen: Screen;
  featured: string;
  rosterFilter: FactionFilter;
  rosterPage: number;
  codexFilter: FactionFilter;
  codexQuery: string;
  battle: BattleState | null;
  starters: string[];
  targetId: string | null;
  busy: boolean;
  resultShown: boolean;
  /** 玩家造成的总伤害，结算用。 */
  damage: number;
}

const initialFeatured = GENERAL_BY_ID.guanyu ? 'guanyu' : GENERALS[0].id;

export const app: AppState = {
  screen: 'home',
  featured: initialFeatured,
  rosterFilter: 'all',
  rosterPage: 0,
  codexFilter: 'all',
  codexQuery: '',
  battle: null,
  starters: [],
  targetId: null,
  busy: false,
  resultShown: false,
  damage: 0,
};

export const HOME_PAGE_SIZE = 6;
export const FACTION_ORDER: Faction[] = ['wei', 'shu', 'wu', 'qun'];

export function filteredGenerals(filter: FactionFilter): GeneralDef[] {
  return filter === 'all' ? GENERALS : GENERALS.filter((g) => g.faction === filter);
}

export function homeRoster(): GeneralDef[] {
  const list = filteredGenerals(app.rosterFilter);
  const start = app.rosterPage * HOME_PAGE_SIZE;
  return list.slice(start, start + HOME_PAGE_SIZE);
}

export function homePageCount(): number {
  return Math.max(1, Math.ceil(filteredGenerals(app.rosterFilter).length / HOME_PAGE_SIZE));
}

/** 开一场新的演武：双方各十人，进入布阵。 */
export function newRun(): BattleState {
  const seed = (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
  app.battle = createBattle(seed);
  app.starters = [];
  app.targetId = null;
  app.busy = false;
  app.resultShown = false;
  app.damage = 0;
  return app.battle;
}

export function playerSquad(state: BattleState): string[] {
  return state.units.filter((u) => u.side === 'player').map((u) => u.id);
}

export function enemyField(state: BattleState): string[] {
  return state.units
    .filter((u) => u.side === 'enemy' && state.field.enemy.includes(u.id) && u.alive)
    .map((u) => u.id);
}

export function firstTarget(state: BattleState): string | null {
  return state.field.enemy.find((id): id is string => {
    if (!id) return false;
    const unit = state.units.find((u) => u.id === id);
    return Boolean(unit?.alive);
  }) ?? null;
}

export const FIELD_SIZE = CONFIG.fieldSize;
export const ROSTER_SIZE = CONFIG.rosterSize;
export const MAX_ROUNDS = CONFIG.maxRounds;
