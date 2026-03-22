import {TileMatchTile} from '../../types/tileMatch';
import {BAR_SIZE, MATCH_COUNT} from '../../constants/tileMatch/levels';

/**
 * Compute which tiles on the board are "free" (nothing on top).
 * A tile is blocked if any tile on a higher layer overlaps its position.
 * Two tiles overlap if their row/col ranges intersect (within 0.9 of each other).
 */
export function computeFreeTiles(board: TileMatchTile[]): Set<string> {
  const activeTiles = board.filter(t => !t.isInBar && !t.isMatched);
  const freeIds = new Set<string>();

  for (const tile of activeTiles) {
    const isBlocked = activeTiles.some(
      other =>
        other.layer > tile.layer &&
        Math.abs(other.row - tile.row) < 0.9 &&
        Math.abs(other.col - tile.col) < 0.9,
    );
    if (!isBlocked) {
      freeIds.add(tile.id);
    }
  }

  return freeIds;
}

/**
 * Add a tile to the bar, inserting it next to matching tiles.
 * Returns the new bar array and any matched tiles (null if no match).
 */
export function addToBar(
  bar: TileMatchTile[],
  tile: TileMatchTile,
): {newBar: TileMatchTile[]; matched: TileMatchTile[] | null} {
  const barTile: TileMatchTile = {...tile, isInBar: true};

  // Find index of last matching tile in bar to group them together
  let matchIndex = -1;
  for (let i = bar.length - 1; i >= 0; i--) {
    if (bar[i].type === tile.type) {
      matchIndex = i;
      break;
    }
  }

  let newBar: TileMatchTile[];
  if (matchIndex >= 0) {
    // Insert right after the last matching tile
    newBar = [...bar];
    newBar.splice(matchIndex + 1, 0, barTile);
  } else {
    // Add to end
    newBar = [...bar, barTile];
  }

  // Check for 3 consecutive matching tiles
  for (let i = 0; i <= newBar.length - MATCH_COUNT; i++) {
    const group = newBar.slice(i, i + MATCH_COUNT);
    if (group.every(t => t.type === group[0].type)) {
      // Found a match! Remove them
      const matched = group;
      const remaining = [...newBar.slice(0, i), ...newBar.slice(i + MATCH_COUNT)];
      return {newBar: remaining, matched};
    }
  }

  return {newBar, matched: null};
}

/** Check if all tiles are cleared from the board */
export function checkWin(board: TileMatchTile[]): boolean {
  return board.every(t => t.isMatched || t.isInBar);
}

/** Check if the bar is full (7 tiles, no match possible) */
export function checkLoss(bar: TileMatchTile[]): boolean {
  return bar.length >= BAR_SIZE;
}

/** Shuffle remaining board tiles' positions */
export function shuffleBoard(board: TileMatchTile[]): TileMatchTile[] {
  const active = board.filter(t => !t.isInBar && !t.isMatched);
  const inactive = board.filter(t => t.isInBar || t.isMatched);

  // Collect positions from active tiles
  const positions = active.map(t => ({row: t.row, col: t.col, layer: t.layer}));

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Reassign positions
  const shuffled = active.map((t, i) => ({
    ...t,
    row: positions[i].row,
    col: positions[i].col,
    layer: positions[i].layer,
  }));

  return [...shuffled, ...inactive];
}

/** Calculate stars earned for a level */
export function calculateStars(
  timeRemaining: number,
  totalTime: number,
  powerUpsUsed: number,
): 1 | 2 | 3 {
  const timeRatio = timeRemaining / totalTime;

  if (powerUpsUsed === 0 && timeRatio > 0.5) return 3;
  if (powerUpsUsed <= 1 && timeRatio > 0.25) return 2;
  return 1;
}
