import {LayoutTemplate} from '../../types/tileMatch';

export interface LevelConfig {
  minLevel: number;
  maxLevel: number;
  tileTypes: number;
  totalTiles: number;
  layers: number;
  timerSeconds: number;
}

// Gradual difficulty progression
export const LEVEL_CONFIGS: LevelConfig[] = [
  // Very easy: few tiles, 1 layer, lots of time
  {minLevel: 1, maxLevel: 3, tileTypes: 4, totalTiles: 18, layers: 1, timerSeconds: 240},
  // Easy: still simple, introduce 2 layers
  {minLevel: 4, maxLevel: 7, tileTypes: 5, totalTiles: 24, layers: 2, timerSeconds: 210},
  // Normal: standard gameplay
  {minLevel: 8, maxLevel: 12, tileTypes: 6, totalTiles: 30, layers: 2, timerSeconds: 180},
  // Medium: more tile types
  {minLevel: 13, maxLevel: 18, tileTypes: 8, totalTiles: 42, layers: 2, timerSeconds: 165},
  // Medium-hard: 3 layers
  {minLevel: 19, maxLevel: 25, tileTypes: 8, totalTiles: 48, layers: 3, timerSeconds: 150},
  // Hard: more types + more tiles
  {minLevel: 26, maxLevel: 35, tileTypes: 10, totalTiles: 60, layers: 3, timerSeconds: 135},
  // Very hard: 4 layers
  {minLevel: 36, maxLevel: 50, tileTypes: 12, totalTiles: 72, layers: 4, timerSeconds: 120},
  // Expert: maximum difficulty
  {minLevel: 51, maxLevel: 999, tileTypes: 14, totalTiles: 90, layers: 5, timerSeconds: 90},
];

export const BAR_SIZE = 7;
export const MATCH_COUNT = 3;

// Layout order: start with simplest, introduce harder layouts later
export const LAYOUT_ORDER: LayoutTemplate[] = ['rectangle', 'rectangle', 'pyramid', 'diamond', 'cross'];

export function getLevelConfig(levelNumber: number): LevelConfig {
  for (const config of LEVEL_CONFIGS) {
    if (levelNumber >= config.minLevel && levelNumber <= config.maxLevel) {
      return config;
    }
  }
  return LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
}

export function getLevelLayout(levelNumber: number): LayoutTemplate {
  // First 2 levels always rectangle (easiest)
  if (levelNumber <= 2) return 'rectangle';
  return LAYOUT_ORDER[(levelNumber - 1) % LAYOUT_ORDER.length];
}

export const INITIAL_POWERUPS: Record<string, number> = {
  undo: 1,
  shuffle: 1,
  remove: 0,
};
