// ─── Trash Okey Types ────────────────────────────────────────

export type TrashOkeyColor = 'red' | 'blue' | 'yellow' | 'black';

export interface OkeyTile {
  id: string;
  number: number;
  color: TrashOkeyColor;
  isFalseJoker: boolean;
  isFaceUp: boolean;
}

export interface GridSlot {
  row: number;
  col: number;
  targetNumber: number;
  tile: OkeyTile | null;
  isFaceDown: boolean;
  isRevealed: boolean;
}

export type PlayerSide = 'player' | 'bot';

export interface TrashOkeyPlayerState {
  side: PlayerSide;
  grid: GridSlot[][];
  revealedCount: number;
}

export type TrashOkeyDifficulty = 'easy' | 'medium' | 'hard';

export type TrashOkeyStatus = 'playing' | 'won' | 'lost' | 'gameOver';

export interface TrashOkeyGameState {
  players: Record<PlayerSide, TrashOkeyPlayerState>;
  centerTile: OkeyTile | null;
  currentTurn: PlayerSide;
  chainActive: boolean;
  chainLength: number;
  currentChainTile: OkeyTile | null;
  status: TrashOkeyStatus;
  difficulty: TrashOkeyDifficulty;
  turnCount: number;
  longestChain: number;
}

export interface TrashOkeyStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  longestChain: number;
  totalTurns: number;
  byDifficulty: Record<TrashOkeyDifficulty, {played: number; wins: number}>;
}
