import {CPTile, CPGrid, CPPlayer, CPOwner} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';

/**
 * Push a tile into the TOP of a column.
 * All tiles shift down by 1. Bottom tile pops out and is revealed.
 */
export function pushTileToColumn(
  grid: CPGrid,
  colIndex: number,
  tile: CPTile,
): {newGrid: CPGrid; poppedTile: CPTile} {
  const newGrid = grid.map(col => col.map(t => ({...t})));
  const column = newGrid[colIndex];

  const poppedTile: CPTile = {...column[CP_ROWS - 1], isHidden: false};

  for (let r = CP_ROWS - 1; r > 0; r--) {
    column[r] = column[r - 1];
  }

  column[0] = {...tile, isHidden: false};

  return {newGrid, poppedTile};
}

/**
 * Get the tile theme that a given player is collecting.
 * playerTheme = which CPOwner value the human player collects.
 */
export function getThemeForPlayer(player: CPPlayer, playerTheme: CPOwner): CPOwner {
  if (player === 'player') return playerTheme;
  return playerTheme === 'player' ? 'bot' : 'player';
}

/**
 * Chain check: popped tile's theme matches the current player's assigned theme.
 * Neutral tiles never chain.
 * If theme not yet assigned (null), no chain possible.
 */
export function isChainByOwner(
  poppedTile: CPTile,
  currentPlayer: CPPlayer,
  playerTheme: CPOwner | null,
): boolean {
  if (!playerTheme) return false;
  if (poppedTile.owner === 'neutral') return false;
  return poppedTile.owner === getThemeForPlayer(currentPlayer, playerTheme);
}

/**
 * Get valid columns for placing a tile, enforcing the same-type-per-column rule.
 * Two-way constraint:
 * 1. A column can only hold one typeIndex (no mixing).
 * 2. A typeIndex can only exist in one column — if it's already placed somewhere,
 *    future tiles of that type MUST go to that same column.
 * Empty columns (all hidden/neutral) accept any type not yet claimed by another column.
 * Neutral tiles (typeIndex === -1) can go anywhere.
 */
export function getValidColumnsForPlacement(grid: CPGrid, tile: CPTile): number[] {
  // Neutral tiles can go anywhere
  if (tile.typeIndex === -1) {
    return Array.from({length: CP_COLS}, (_, i) => i);
  }

  // First pass: find each column's established typeIndex (first revealed non-neutral tile)
  const colTypes: (number | null)[] = [];
  let existingCol: number | null = null; // column that already has this tile's typeIndex

  for (let col = 0; col < CP_COLS; col++) {
    let colTypeIndex: number | null = null;
    for (let row = 0; row < CP_ROWS; row++) {
      const t = grid[col][row];
      if (!t.isHidden && t.typeIndex !== -1) {
        colTypeIndex = t.typeIndex;
        break;
      }
    }
    colTypes.push(colTypeIndex);
    if (colTypeIndex === tile.typeIndex) {
      existingCol = col;
    }
  }

  // If this typeIndex already exists in a column, it MUST go there
  if (existingCol !== null) {
    return [existingCol];
  }

  // Otherwise, allow only empty columns (no established type yet)
  const empty: number[] = [];
  for (let col = 0; col < CP_COLS; col++) {
    if (colTypes[col] === null) {
      empty.push(col);
    }
  }

  // Fallback: if no columns are valid, allow all (shouldn't happen in normal play)
  return empty.length > 0 ? empty : Array.from({length: CP_COLS}, (_, i) => i);
}

/**
 * Win condition: every tile on the board belongs to the given theme.
 */
export function checkWinCondition(grid: CPGrid, theme: CPOwner): boolean {
  for (let col = 0; col < CP_COLS; col++) {
    for (let row = 0; row < CP_ROWS; row++) {
      if (grid[col][row].owner !== theme) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Count hidden tiles across both grids.
 */
export function countHiddenTiles(playerGrid: CPGrid, botGrid: CPGrid): number {
  let count = 0;
  for (let col = 0; col < CP_COLS; col++) {
    for (let row = 0; row < CP_ROWS; row++) {
      if (playerGrid[col][row].isHidden) count++;
      if (botGrid[col][row].isHidden) count++;
    }
  }
  return count;
}

/**
 * Collect all hidden tiles from a grid, reveal them, and return the updated grid + tiles.
 */
export function collectHiddenFromGrid(grid: CPGrid): {newGrid: CPGrid; hiddenTiles: CPTile[]} {
  const newGrid = grid.map(col => col.map(t => ({...t})));
  const hiddenTiles: CPTile[] = [];
  for (let col = 0; col < CP_COLS; col++) {
    for (let row = 0; row < CP_ROWS; row++) {
      if (newGrid[col][row].isHidden) {
        const tile = {...newGrid[col][row], isHidden: false};
        hiddenTiles.push(tile);
        newGrid[col][row] = tile;
      }
    }
  }
  return {newGrid, hiddenTiles};
}

/**
 * Place a picked tile onto a grid, replacing the first tile that doesn't match the given theme.
 */
export function placeTileOnGrid(grid: CPGrid, tile: CPTile, theme: CPOwner): CPGrid {
  const newGrid = grid.map(col => col.map(t => ({...t})));
  for (let col = 0; col < CP_COLS; col++) {
    for (let row = 0; row < CP_ROWS; row++) {
      if (newGrid[col][row].owner !== theme) {
        newGrid[col][row] = {...tile, isHidden: false};
        return newGrid;
      }
    }
  }
  return newGrid;
}
