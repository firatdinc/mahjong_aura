// ─── Tile Display Mappings ───────────────────────────────────
// Unicode/emoji representations for each tile type

export const SUIT_SYMBOLS: Record<string, string> = {
  bamboo: '🎋',
  dot: '🔴',
  character: '字',
  wind: '🌬',
  dragon: '🐉',
};

// Compact labels for numbered tiles
export const SUIT_LABELS: Record<string, string> = {
  bamboo: 'B',
  dot: 'D',
  character: 'C',
  wind: 'W',
  dragon: 'Dr',
};

// Display values for honor tiles
export const HONOR_DISPLAY: Record<string, string> = {
  east: 'E',
  south: 'S',
  west: 'W',
  north: 'N',
  red: 'R',
  green: 'G',
  white: 'Wh',
};

// Colors per suit for styling
export const SUIT_COLORS: Record<string, string> = {
  bamboo: '#2E7D32',
  dot: '#C62828',
  character: '#1565C0',
  wind: '#6A1B9A',
  dragon: '#E65100',
};
