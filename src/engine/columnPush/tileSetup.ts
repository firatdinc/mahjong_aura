import {CPTile, CPGrid, CPGameState, CPDifficulty, CPOwner} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';
import {CP_TYPES_PER_PLAYER, CP_COPIES_PER_TYPE} from '../../constants/columnPush/tiles';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Create all 64 tiles: 8 types × 4 copies × 2 owners */
function createAllTiles(): CPTile[] {
  const tiles: CPTile[] = [];
  let id = 0;
  for (const owner of ['player', 'bot'] as CPOwner[]) {
    for (let typeIndex = 0; typeIndex < CP_TYPES_PER_PLAYER; typeIndex++) {
      for (let copy = 0; copy < CP_COPIES_PER_TYPE; copy++) {
        tiles.push({
          id: `cp_${owner[0]}_${typeIndex}_${copy}`,
          typeIndex,
          owner,
          isHidden: true,
        });
        id++;
      }
    }
  }
  return tiles;
}

function createGrid(tiles: CPTile[]): CPGrid {
  const grid: CPGrid = [];
  for (let col = 0; col < CP_COLS; col++) {
    const column: CPTile[] = [];
    for (let row = 0; row < CP_ROWS; row++) {
      column.push(tiles[col * CP_ROWS + row]);
    }
    grid.push(column);
  }
  return grid;
}

export function dealColumnPush(difficulty: CPDifficulty): CPGameState {
  const allTiles = shuffle(createAllTiles()); // 64 tiles, mixed owners
  const playerGridTiles = allTiles.slice(0, 32);
  const botGridTiles = allTiles.slice(32, 64);

  const neutralTile: CPTile = {
    id: 'cp_neutral',
    typeIndex: -1,
    owner: 'neutral',
    isHidden: false,
  };

  return {
    playerGrid: createGrid(playerGridTiles),
    botGrid: createGrid(botGridTiles),
    activeTile: neutralTile,
    currentTurn: 'player',
    status: 'diceRoll',
    difficulty,
    diceResult: null,
    chainLength: 0,
    longestChain: 0,
    playerLongestChain: 0,
    turnCount: 0,
    playerTheme: null,
    centerTiles: [],
  };
}
