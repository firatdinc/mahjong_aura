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

// Light background tint per suit (used as tile background)
export const SUIT_BG_COLORS: Record<string, string> = {
  bamboo: '#E8F5E9',
  dot: '#FFEBEE',
  character: '#E3F2FD',
  wind: '#F3E5F5',
  dragon: '#FFF3E0',
};

// Border color per suit
export const SUIT_BORDER_COLORS: Record<string, string> = {
  bamboo: '#81C784',
  dot: '#EF9A9A',
  character: '#90CAF9',
  wind: '#CE93D8',
  dragon: '#FFCC80',
};

// Suit icon symbols (small, shown on tile)
export const SUIT_ICONS: Record<string, string> = {
  bamboo: '⚔',
  dot: '◆',
  character: '⛊',
  wind: '☁',
  dragon: '★',
};
