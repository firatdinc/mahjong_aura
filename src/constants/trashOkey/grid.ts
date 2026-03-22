export const GRID_COLS = 5;
export const GRID_ROWS = 2;
export const SLOTS_PER_PLAYER = 10;

/**
 * Get the target number for a grid position.
 * Row 0: positions 1-5
 * Row 1: positions 6-10
 */
export function getTargetNumber(row: number, col: number): number {
  return row * GRID_COLS + col + 1;
}
