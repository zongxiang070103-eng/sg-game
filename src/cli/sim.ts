/**
 * 无头模拟器：双方都用同一套 AI 自动开打，用来检验数值与节奏。
 *
 *   npm run sim                 跑 300 局，统计胜率与平均回合
 *   npm run sim -- --seed 42    打印指定种子的完整一战
 */
import { autoAction } from '../core/ai';
import { CONFIG } from '../core/config';
import {
  createBattle,
  deploy,
  takeAction,
  unitById,
  unitScore,
} from '../core/battle';
import type { BattleState } from '../core/types';

/** 模拟玩家也按综合战力挑首发，保证双方起点公平。 */
function pickStarters(s: BattleState): string[] {
  return [...s.bench.player]
    .sort((a, b) => unitScore(unitById(s, b)) - unitScore(unitById(s, a)))
    .slice(0, CONFIG.fieldSize);
}

function play(seed: number, trace = false): BattleState {
  let s = createBattle(seed);
  s = deploy(s, pickStarters(s));
  if (trace) printLog(s);

  let guard = 0;
  while (s.phase === 'battle' && guard++ < 800) {
    s = takeAction(s, autoAction(s));
    if (trace) printLog(s);
  }
  return s;
}

let printed = 0;
function printLog(s: BattleState): void {
  for (; printed < s.log.length; printed++) {
    const entry = s.log[printed];
    const prefix = entry.kind === 'round' ? '' : '  ';
    console.log(`${prefix}${entry.text}`);
  }
}

const argv = (globalThis as { process?: { argv: string[] } }).process?.argv ?? [];
const seedFlag = argv.indexOf('--seed');

if (seedFlag >= 0) {
  const seed = Number(argv[seedFlag + 1] ?? Date.now());
  console.log(`种子 ${seed}\n`);
  const game = play(seed, true);
  console.log(`\n结局：${game.outcome === 'victory' ? '我军胜' : '我军败'} · 共 ${game.round} 回合`);
} else {
  const total = 300;
  let victories = 0;
  let rounds = 0;
  let longest = 0;

  for (let seed = 1; seed <= total; seed++) {
    const game = play(seed);
    if (game.outcome === 'victory') victories += 1;
    rounds += game.round;
    longest = Math.max(longest, game.round);
  }

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
  console.log(`AI 对 AI · ${total} 局`);
  console.log(`我军胜 ${pct(victories)}  败 ${pct(total - victories)}`);
  console.log(`平均 ${(rounds / total).toFixed(1)} 回合，最长 ${longest} 回合`);
  console.log('\n双方同 AI、同编队规则，五五开说明数值对称；偏差过大就要调武将强度。');
}
