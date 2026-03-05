import {CPGrid, CPTile, CPDifficulty, CPOwner} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';
import {getValidColumnsForPlacement} from './gridLogic';

/**
 * Choose which column the bot should push the tile into.
 * botTheme = the CPOwner value the bot is collecting.
 */
export function chooseBotColumn(
  grid: CPGrid,
  tile: CPTile,
  difficulty: CPDifficulty,
  isInChain: boolean,
  botTheme: CPOwner,
): number {
  // Placement rule already enforces same-type-per-column (subsumes chain restriction)
  const placementCols = getValidColumnsForPlacement(grid, tile);
  const validCols = placementCols.length > 0
    ? placementCols
    : Array.from({length: CP_COLS}, (_, i) => i);

  switch (difficulty) {
    case 'easy':
      return validCols[Math.floor(Math.random() * validCols.length)];
    case 'medium':
      return chooseMedium(grid, validCols, botTheme);
    case 'hard':
      return chooseHard(grid, tile, validCols, botTheme);
  }
}

/** Prefer columns where bottom tile is bot's theme (chain potential) */
function chooseMedium(grid: CPGrid, validCols: number[], botTheme: CPOwner): number {
  const chainCols = validCols.filter(
    col => grid[col][CP_ROWS - 1].owner === botTheme,
  );
  if (chainCols.length > 0) {
    return chainCols[Math.floor(Math.random() * chainCols.length)];
  }
  return validCols[Math.floor(Math.random() * validCols.length)];
}

/** Strategic: maximize chain chance + group same types */
function chooseHard(grid: CPGrid, tile: CPTile, validCols: number[], botTheme: CPOwner): number {
  let bestCol = validCols[0];
  let bestScore = -Infinity;

  for (const col of validCols) {
    let score = 0;
    const column = grid[col];
    const bottomTile = column[CP_ROWS - 1];

    // Chain bonus: bottom tile is bot's theme
    if (bottomTile.owner === botTheme) score += 15;
    // Penalty: bottom tile is opponent's theme
    if (bottomTile.owner !== botTheme && bottomTile.owner !== 'neutral') score -= 5;

    // Win progress: count bot-theme tiles with same typeIndex
    for (let row = 0; row < CP_ROWS; row++) {
      if (column[row].owner === botTheme && column[row].typeIndex === tile.typeIndex) {
        score += 4;
      }
    }

    // Homogeneity bonus: more of bot's theme tiles in column
    let botThemeCount = 0;
    for (let row = 0; row < CP_ROWS; row++) {
      if (column[row].owner === botTheme) botThemeCount++;
    }
    score += botThemeCount * 2;

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

/**
 * Bot thinking delay (ms).
 */
export function getBotDelay(difficulty: CPDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 800;
    case 'medium':
      return 600;
    case 'hard':
      return 400;
  }
}

/**
 * Bot picks a tile from center during finalPick phase.
 * Prefers tiles matching bot's theme, otherwise picks randomly.
 */
export function botPickFromCenter(centerTiles: CPTile[], botTheme: CPOwner): number {
  const themeIdx = centerTiles.findIndex(t => t.owner === botTheme);
  if (themeIdx !== -1) return themeIdx;
  return 0;
}
