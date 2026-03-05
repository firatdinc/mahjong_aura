export const GRID_COLS = 6;
export const GRID_ROWS = 8;

/**
 * Get the target number for a grid position.
 * Rows 0,2,4,6 (odd display rows 1,3,5,7): numbers 1-6
 * Rows 1,3,5,7 (even display rows 2,4,6,8): numbers 7-12
 */
export function getTargetNumber(row: number, col: number): number {
  if (row % 2 === 0) {
    return col + 1; // 1-6
  }
  return col + 7; // 7-12
}
