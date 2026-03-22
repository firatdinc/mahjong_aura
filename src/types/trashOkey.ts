// ─── Trash Game Types ────────────────────────────────────────

export interface TrashTile {
  id: string;
  number: number; // 1-10, 0 = joker
  isJoker: boolean;
}

export interface GridSlot {
  position: number; // 1-10
  tile: TrashTile | null;
  isRevealed: boolean;
}

export type PlayerSide = 'player' | 'bot';

export interface TrashPlayerState {
  side: PlayerSide;
  slots: GridSlot[];
  revealedCount: number;
}

export type TrashDifficulty = 'easy' | 'medium' | 'hard';
export type TrashStatus = 'playing' | 'won' | 'lost';

export interface TrashGameState {
  players: Record<PlayerSide, TrashPlayerState>;
  drawPile: TrashTile[];
  discardPile: TrashTile[];
  drawnTile: TrashTile | null;
  currentTurn: PlayerSide;
  chainActive: boolean;
  chainLength: number;
  status: TrashStatus;
  difficulty: TrashDifficulty;
  turnCount: number;
  longestChain: number;
}

export interface TrashOkeyStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  longestChain: number;
  totalTurns: number;
  byDifficulty: Record<TrashDifficulty, {played: number; wins: number}>;
}

// Keep old aliases for compatibility
export type TrashOkeyDifficulty = TrashDifficulty;
export type TrashOkeyStatus = TrashStatus;
export type TrashOkeyGameState = TrashGameState;
export type TrashOkeyPlayerState = TrashPlayerState;
export type OkeyTile = TrashTile;
export type TrashOkeyColor = string;
