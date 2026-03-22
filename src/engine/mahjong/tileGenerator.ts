import {Tile, SeatId, PlayerState, GameState, Difficulty} from '../../types';
import {
  NUMBERED_SUITS,
  COPIES_PER_TILE,
  TILES_PER_HAND,
} from '../../constants/mahjong/tiles';
import {TURN_ORDER} from '../../constants/mahjong/game';

// ─── Generate the full 144-tile set ─────────────────────────
export function generateTiles(): Tile[] {
  const tiles: Tile[] = [];

  // Numbered suits: bamboo, dot, character — values 1–9, 4 copies each
  for (const suit of NUMBERED_SUITS) {
    for (let value = 1; value <= 9; value++) {
      for (let copy = 1; copy <= COPIES_PER_TILE; copy++) {
        tiles.push({
          id: `${suit}_${value}_${copy}`,
          suit,
          value: String(value),
          location: 'wall',
          isHidden: true,
        });
      }
    }
  }

  // Honor tiles (wind, dragon) removed for simpler, faster games

  return tiles;
}

// ─── Fisher-Yates shuffle ───────────────────────────────────
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Create an empty player state ───────────────────────────
function createPlayerState(seatId: SeatId): PlayerState {
  return {
    seatId,
    hand: [],
    revealedMelds: [],
    discards: [],
  };
}

// ─── Deal tiles to all 4 players ────────────────────────────
// Deals 13 tiles to each player from the shuffled wall.
// Returns the initial GameState ready for play.
export function dealGame(difficulty: Difficulty): GameState {
  const allTiles = shuffleTiles(generateTiles());

  const players: Record<SeatId, PlayerState> = {
    player: createPlayerState('player'),
    bot1: createPlayerState('bot1'),
    bot2: createPlayerState('bot2'),
    bot3: createPlayerState('bot3'),
  };

  let wallIndex = 0;

  // Deal 13 tiles to each player in turn order
  for (const seatId of TURN_ORDER) {
    for (let i = 0; i < TILES_PER_HAND; i++) {
      const tile = allTiles[wallIndex];
      tile.location = seatId;
      // Only the human player's tiles are face-up
      tile.isHidden = seatId !== 'player';
      players[seatId].hand.push(tile);
      wallIndex++;
    }
    // Sort the player's hand for convenience
    sortHand(players[seatId].hand);
  }

  // Remaining tiles form the wall
  const wall = allTiles.slice(wallIndex);

  return {
    wall,
    discardPile: [],
    players,
    currentTurn: 'player', // East seat (human) always starts
    turnPhase: 'drawing',
    difficulty,
    lastDiscardedTile: null,
    lastDiscardedBy: null,
    winner: null,
    playerClaimOptions: [],
    waitingForPlayerClaim: false,
  };
}

// ─── Sort a hand by suit then value ─────────────────────────
const SUIT_ORDER: Record<string, number> = {
  character: 0,
  dot: 1,
  bamboo: 2,
  wind: 3,
  dragon: 4,
};

const VALUE_ORDER: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9,
  east: 10, south: 11, west: 12, north: 13,
  red: 14, green: 15, white: 16,
};

export function sortHand(hand: Tile[]): void {
  hand.sort((a, b) => {
    const suitDiff = (SUIT_ORDER[a.suit] ?? 99) - (SUIT_ORDER[b.suit] ?? 99);
    if (suitDiff !== 0) {return suitDiff;}
    return (VALUE_ORDER[a.value] ?? 99) - (VALUE_ORDER[b.value] ?? 99);
  });
}
