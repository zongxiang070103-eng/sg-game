import raw from '../../data/config.json';

export interface GameConfig {
  /** 双方各自的编队人数（含首发与后援）。 */
  rosterSize: number;
  /** 同时在场人数。 */
  fieldSize: number;
  /** 回合上限：打满仍未分胜负时，按剩余兵力判定。 */
  maxRounds: number;
}

export const CONFIG: GameConfig = raw;
