// ─── Tile Match (Triple Match) Types ─────────────────────────

export type LayoutTemplate = 'rectangle' | 'pyramid' | 'diamond' | 'cross';

export type TileMatchPowerUp = 'undo' | 'shuffle' | 'remove';

export interface TileMatchTile {
  id: string;
  /** Type key for matching — e.g. 'bamboo_1', 'dragon_red' */
  type: string;
  /** Suit for TileComponent display */
  suit: string;
  /** Value for TileComponent display */
  value: string;
  /** Z-level (0 = bottom layer) */
  layer: number;
  /** Grid row position */
  row: number;
  /** Grid column position */
  col: number;
  /** True if no tile is on top of this one */
  isFree: boolean;
  /** True if tile is currently in the match bar */
  isInBar: boolean;
  /** True if tile has been matched and removed */
  isMatched: boolean;
}

export interface TileMatchLevel {
  levelNumber: number;
  tileTypes: number;
  totalTiles: number;
  layers: number;
  timerSeconds: number;
  layout: LayoutTemplate;
}

export interface TileMatchProgress {
  currentLevel: number;
  highestLevel: number;
  totalStars: number;
  starsByLevel: Record<number, number>;
}

export interface TileMatchStats {
  levelsCompleted: number;
  highestLevel: number;
  totalStars: number;
  totalMatches: number;
  bestCombo: number;
  totalTimePlayed: number;
  totalLevelsAttempted: number;
}

export type TileMatchStatus = 'playing' | 'won' | 'lost' | 'paused';

export interface TileMatchGameState {
  level: TileMatchLevel;
  board: TileMatchTile[];
  bar: TileMatchTile[];
  timeRemaining: number;
  powerUps: Record<TileMatchPowerUp, number>;
  powerUpsUsed: boolean;
  moveHistory: TileMatchTile[];
  status: TileMatchStatus;
  combo: number;
  bestCombo: number;
  matchCount: number;
}
