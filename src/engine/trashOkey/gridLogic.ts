import {GridSlot, OkeyTile} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';

/**
 * Find available (face-down) slots for a given number.
 */
export function getAvailableSlots(grid: GridSlot[][], number: number): GridSlot[] {
  const slots: GridSlot[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const slot = grid[row][col];
      if (slot.targetNumber === number && slot.isFaceDown) {
        slots.push(slot);
      }
    }
  }
  return slots;
}

/**
 * Check if a tile can be placed anywhere in the grid.
 */
export function canPlaceTile(grid: GridSlot[][], tile: OkeyTile): boolean {
  if (tile.isFalseJoker) {
    // Joker can go in any face-down slot
    return grid.some(row => row.some(slot => slot.isFaceDown));
  }
  return getAvailableSlots(grid, tile.number).length > 0;
}

/**
 * Place a tile in a specific slot. Returns the picked-up tile (or null if slot was empty).
 */
export function placeInSlot(
  grid: GridSlot[][],
  row: number,
  col: number,
  tile: OkeyTile,
): {newGrid: GridSlot[][]; pickedUpTile: OkeyTile | null} {
  const newGrid = grid.map(r => r.map(s => ({...s})));
  const slot = newGrid[row][col];
  const pickedUpTile = slot.tile;

  // Place the new tile face-up
  const placedTile: OkeyTile = {...tile, isFaceUp: true};
  slot.tile = placedTile;
  slot.isFaceDown = false;
  slot.isRevealed = true;

  return {
    newGrid,
    pickedUpTile: pickedUpTile ? {...pickedUpTile, isFaceUp: true} : null,
  };
}

/**
 * Check if all 48 tiles are revealed (win condition).
 */
export function isGridComplete(grid: GridSlot[][]): boolean {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!grid[row][col].isRevealed) return false;
    }
  }
  return true;
}

/**
 * Get all face-down slots (for joker placement).
 */
export function getAllFaceDownSlots(grid: GridSlot[][]): GridSlot[] {
  const slots: GridSlot[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col].isFaceDown) {
        slots.push(grid[row][col]);
      }
    }
  }
  return slots;
}

/**
 * Count revealed tiles in a grid.
 */
export function countRevealed(grid: GridSlot[][]): number {
  let count = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col].isRevealed) count++;
    }
  }
  return count;
}
