export const TILE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const COPIES_PER_NUMBER = 4;
export const JOKER_COUNT = 2;
export const TILES_PER_PLAYER = 10;
// 10 numbers x 4 copies + 2 jokers = 42 total
export const TOTAL_TILES = TILE_NUMBERS.length * COPIES_PER_NUMBER + JOKER_COUNT;

// Keep old exports for compatibility
export const OKEY_COLORS = ['red', 'blue', 'yellow', 'black'] as const;
export const COPIES_PER_TILE = COPIES_PER_NUMBER;
export const TOTAL_AVAILABLE_TILES = TOTAL_TILES;
