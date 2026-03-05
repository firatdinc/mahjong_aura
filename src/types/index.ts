// ─── Game Identifier ─────────────────────────────────────────
export type GameId = 'mahjong' | 'tileMatch' | 'trashOkey' | 'columnPush';

// ─── Tile Suits ───────────────────────────────────────────────
// Standard Mahjong: 3 numbered suits + 2 honor types
export type Suit = 'bamboo' | 'dot' | 'character' | 'wind' | 'dragon';

// ─── Seat / Location ─────────────────────────────────────────
// Where a tile currently resides
export type SeatId = 'player' | 'bot1' | 'bot2' | 'bot3';
export type Location = SeatId | 'wall' | 'discardPile';

// ─── Difficulty ──────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Wind Direction ──────────────────────────────────────────
export type WindDirection = 'east' | 'south' | 'west' | 'north';

// ─── Dragon Color ────────────────────────────────────────────
export type DragonColor = 'red' | 'green' | 'white';

// ─── Meld Types ──────────────────────────────────────────────
export type MeldType = 'pong' | 'kong' | 'chow';

// ─── Tile ────────────────────────────────────────────────────
// Core data unit. Every tile in the game is one of 144 instances.
export interface Tile {
  /** Unique identifier, e.g. 'bamboo_5_1', 'wind_east_4' */
  id: string;
  /** Which suit the tile belongs to */
  suit: Suit;
  /**
   * Face value:
   *  - '1'–'9' for bamboo / dot / character
   *  - 'east' | 'south' | 'west' | 'north' for wind
   *  - 'red' | 'green' | 'white' for dragon
   */
  value: string;
  /** Current location of the tile */
  location: Location;
  /** Whether the tile face is hidden (opponent tiles, wall tiles) */
  isHidden: boolean;
}

// ─── Meld ────────────────────────────────────────────────────
// A completed set of tiles (revealed or concealed)
export interface Meld {
  type: MeldType;
  tiles: Tile[];
}

// ─── Player State ────────────────────────────────────────────
export interface PlayerState {
  /** The seat this player occupies */
  seatId: SeatId;
  /** Tiles currently in hand (concealed) */
  hand: Tile[];
  /** Melds revealed via claiming (Pong, Kong, Chow) */
  revealedMelds: Meld[];
  /** Tiles this player has discarded */
  discards: Tile[];
}

// ─── Turn Phase ──────────────────────────────────────────────
// Tracks what sub-step of the turn we are in
export type TurnPhase =
  | 'drawing'      // Player is about to draw a tile
  | 'discarding'   // Player has drawn and must discard
  | 'claiming'     // A discard is available for claiming
  | 'gameOver';    // The game has ended

// ─── Game State ──────────────────────────────────────────────
export interface GameState {
  /** The wall of undrawn tiles */
  wall: Tile[];
  /** All discarded tiles in order */
  discardPile: Tile[];
  /** State for each of the 4 players */
  players: Record<SeatId, PlayerState>;
  /** Whose turn it is right now */
  currentTurn: SeatId;
  /** What phase the current turn is in */
  turnPhase: TurnPhase;
  /** Difficulty level for the bot AI */
  difficulty: Difficulty;
  /** The most recently discarded tile (available for claiming) */
  lastDiscardedTile: Tile | null;
  /** Who discarded the last tile */
  lastDiscardedBy: SeatId | null;
  /** Winner of the game, if any */
  winner: SeatId | null;
}

// ─── Game Store Actions ──────────────────────────────────────
// These will be implemented in Phase 3 (Zustand store)
export interface GameActions {
  /** Start a new game with the given difficulty */
  startGame: (difficulty: Difficulty) => void;
  /** Draw a tile from the wall for the current player */
  drawTile: () => void;
  /** Current player discards a tile from their hand */
  discardTile: (tileId: string) => void;
  /** A player claims the last discarded tile to form a meld */
  claimTile: (claimingSeat: SeatId, meldType: MeldType, meldTileIds: string[]) => void;
  /** Skip claiming the last discarded tile */
  skipClaim: () => void;
  /** Execute a bot's turn (AI logic) */
  playBotTurn: () => Promise<void>;
  /** Process bot claiming after a discard, then continue bot turns */
  processBotActions: () => Promise<void>;
  /** Try to resume a previously saved game. Returns true if a game was restored. */
  resumeGame: () => boolean;
  /** Reset the entire game state */
  resetGame: () => void;
}

// ─── Full Store Type ─────────────────────────────────────────
export type GameStore = GameState & GameActions;
