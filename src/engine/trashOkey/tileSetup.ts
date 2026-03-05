import {OkeyTile, TrashOkeyColor, GridSlot, TrashOkeyPlayerState, TrashOkeyGameState, TrashOkeyDifficulty} from '../../types/trashOkey';
import {OKEY_COLORS, TILE_NUMBERS, COPIES_PER_TILE, TILES_PER_PLAYER} from '../../constants/trashOkey/tiles';
import {GRID_COLS, GRID_ROWS, getTargetNumber} from '../../constants/trashOkey/grid';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate the 97 okey tiles (106 - 8 thirteens - 1 false joker).
 */
function generateOkeyTiles(): OkeyTile[] {
  const tiles: OkeyTile[] = [];
  let id = 0;

  // Generate numbered tiles (1-12 x 4 colors x 2 copies)
  for (const num of TILE_NUMBERS) {
    for (const color of OKEY_COLORS) {
      for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
        tiles.push({
          id: `okey_${id++}`,
          number: num,
          color,
          isFalseJoker: false,
          isFaceUp: false,
        });
      }
    }
  }

  // Add 1 false joker (out of 2 total, we keep 1)
  tiles.push({
    id: `okey_joker`,
    number: 0,
    color: 'red',
    isFalseJoker: true,
    isFaceUp: false,
  });

  // Note: We did not add 13s at all (they're removed)
  // We added 12*4*2 = 96 numbered + 1 joker = 97 tiles total

  return tiles;
}

/**
 * Create an empty grid for a player (8 rows x 6 cols).
 */
function createEmptyGrid(): GridSlot[][] {
  const grid: GridSlot[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const gridRow: GridSlot[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      gridRow.push({
        row,
        col,
        targetNumber: getTargetNumber(row, col),
        tile: null,
        isFaceDown: true,
        isRevealed: false,
      });
    }
    grid.push(gridRow);
  }
  return grid;
}

/**
 * Deal a new Trash Okey game.
 */
export function dealTrashOkey(difficulty: TrashOkeyDifficulty): TrashOkeyGameState {
  const allTiles = shuffle(generateOkeyTiles());

  // Deal 48 to each player
  const playerTiles = allTiles.slice(0, TILES_PER_PLAYER);
  const botTiles = allTiles.slice(TILES_PER_PLAYER, TILES_PER_PLAYER * 2);
  const centerTile = allTiles[TILES_PER_PLAYER * 2];

  // Place tiles face-down in grids
  const playerGrid = createEmptyGrid();
  const botGrid = createEmptyGrid();

  let tileIndex = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      playerGrid[row][col].tile = playerTiles[tileIndex];
      botGrid[row][col].tile = botTiles[tileIndex];
      tileIndex++;
    }
  }

  // Center tile is face up
  centerTile.isFaceUp = true;

  const playerState: TrashOkeyPlayerState = {
    side: 'player',
    grid: playerGrid,
    revealedCount: 0,
  };

  const botState: TrashOkeyPlayerState = {
    side: 'bot',
    grid: botGrid,
    revealedCount: 0,
  };

  return {
    players: {player: playerState, bot: botState},
    centerTile,
    currentTurn: 'player',
    chainActive: false,
    chainLength: 0,
    currentChainTile: null,
    status: 'playing',
    difficulty,
    turnCount: 0,
    longestChain: 0,
  };
}
