// ─── Column Push (Seaside Escape) Types ─────────────────────

export type CPOwner = 'player' | 'bot' | 'neutral';

export interface CPTile {
  id: string;
  /** 0-7 index into owner's emoji array. -1 for neutral tile. */
  typeIndex: number;
  /** Who this tile belongs to */
  owner: CPOwner;
  isHidden: boolean;
}

/** Grid is 8 columns x 4 rows. grid[col][row], row 0 = top, row 3 = bottom */
export type CPGrid = CPTile[][];

export type CPPlayer = 'player' | 'bot';

export type CPDifficulty = 'easy' | 'medium' | 'hard';

export type CPStatus = 'diceRoll' | 'playing' | 'finalPick' | 'won' | 'lost';

export interface CPDiceResult {
  playerRoll: number;
  botRoll: number;
}

export interface CPGameState {
  playerGrid: CPGrid;
  botGrid: CPGrid;
  activeTile: CPTile | null;
  currentTurn: CPPlayer;
  status: CPStatus;
  difficulty: CPDifficulty;
  diceResult: CPDiceResult | null;
  chainLength: number;
  longestChain: number;
  turnCount: number;
  /** Which tile theme the human player collects. null = not yet determined. */
  playerTheme: CPOwner | null;
  /** Tiles available for picking during finalPick phase */
  centerTiles: CPTile[];
}

export interface CPStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  longestChain: number;
  totalTurns: number;
  byDifficulty: Record<CPDifficulty, {played: number; wins: number}>;
}
