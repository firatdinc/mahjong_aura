import {LayoutTemplate} from '../../types/tileMatch';

export interface LevelConfig {
  minLevel: number;
  maxLevel: number;
  tileTypes: number;
  totalTiles: number;
  layers: number;
  timerSeconds: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {minLevel: 1, maxLevel: 10, tileTypes: 6, totalTiles: 30, layers: 2, timerSeconds: 180},
  {minLevel: 11, maxLevel: 20, tileTypes: 8, totalTiles: 48, layers: 3, timerSeconds: 150},
  {minLevel: 21, maxLevel: 30, tileTypes: 10, totalTiles: 60, layers: 3, timerSeconds: 120},
  {minLevel: 31, maxLevel: 50, tileTypes: 12, totalTiles: 72, layers: 4, timerSeconds: 90},
  {minLevel: 51, maxLevel: 999, tileTypes: 14, totalTiles: 90, layers: 5, timerSeconds: 90},
];

export const BAR_SIZE = 7;
export const MATCH_COUNT = 3;

export const LAYOUT_ORDER: LayoutTemplate[] = ['rectangle', 'pyramid', 'diamond', 'cross'];

export function getLevelConfig(levelNumber: number): LevelConfig {
  for (const config of LEVEL_CONFIGS) {
    if (levelNumber >= config.minLevel && levelNumber <= config.maxLevel) {
      return config;
    }
  }
  return LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
}

export function getLevelLayout(levelNumber: number): LayoutTemplate {
  return LAYOUT_ORDER[(levelNumber - 1) % LAYOUT_ORDER.length];
}

export const INITIAL_POWERUPS: Record<string, number> = {
  undo: 1,
  shuffle: 1,
  remove: 0,
};
