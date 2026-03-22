import {TileMatchTile, TileMatchLevel, TileMatchGameState} from '../../types/tileMatch';
import {getLevelConfig, getLevelLayout, INITIAL_POWERUPS} from '../../constants/tileMatch/levels';
import {generateTilePool} from './tilePool';
import {generateLayout} from './layoutTemplates';
import {computeFreeTiles} from './matchLogic';

/**
 * Generate a complete level state for the given level number.
 */
export function generateLevel(levelNumber: number): TileMatchGameState {
  const config = getLevelConfig(levelNumber);
  const layoutTemplate = getLevelLayout(levelNumber);

  const level: TileMatchLevel = {
    levelNumber,
    tileTypes: config.tileTypes,
    totalTiles: config.totalTiles,
    layers: config.layers,
    timerSeconds: config.timerSeconds,
    layout: layoutTemplate,
  };

  // Generate tile pool
  const pool = generateTilePool(config.tileTypes, config.totalTiles);

  // Generate layout positions
  const positions = generateLayout(layoutTemplate, config.totalTiles, config.layers);

  // Assign positions to tiles
  const board: TileMatchTile[] = pool.map((tile, i) => ({
    ...tile,
    layer: positions[i].layer,
    row: positions[i].row,
    col: positions[i].col,
    isFree: false, // Will be computed below
  }));

  // Compute free tiles
  const freeIds = computeFreeTiles(board);
  for (const tile of board) {
    tile.isFree = freeIds.has(tile.id);
  }

  return {
    level,
    board,
    bar: [],
    timeRemaining: config.timerSeconds,
    powerUps: {...INITIAL_POWERUPS} as Record<string, number> as TileMatchGameState['powerUps'],
    powerUpsUsed: 0,
    moveHistory: [],
    status: 'playing',
    combo: 0,
    bestCombo: 0,
    matchCount: 0,
  };
}
